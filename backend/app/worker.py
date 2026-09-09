"""Durable job worker entry point for EnerSight ingestion and export processing."""

from __future__ import annotations

import time
import logging
from datetime import timedelta

from sqlalchemy import select

from .core import SessionLocal
from .models import ExportRequest, LifecycleStatus, ProcessingJob, utcnow
from .services import process_upload
from .telemetry import log_event


# PUBLIC_INTERFACE
def run_once() -> bool:
    """Claim and process one queued job, returning whether any work was completed."""
    with SessionLocal() as db:
        job = db.scalar(
            select(ProcessingJob)
            .where(ProcessingJob.status == LifecycleStatus.QUEUED.value)
            .order_by(ProcessingJob.created_at)
            .with_for_update(skip_locked=True)
        )
        if job is None:
            return False

        job.status = LifecycleStatus.PROCESSING.value
        job.attempts += 1
        job.lease_expires_at = utcnow() + timedelta(minutes=5)
        db.commit()
        log_event(
            "job_claimed",
            process_role="worker",
            correlation_id=job.correlation_id,
            job_id=job.id,
            job_type=job.job_type,
            attempt=job.attempts,
            outcome="processing",
        )

        try:
            if job.job_type == "ingestion":
                process_upload(db, job.resource_id)
            elif job.job_type == "export":
                export = db.get(ExportRequest, job.resource_id)
                if export is not None:
                    # PDF storage remains fail-closed until approved storage and template adapters exist.
                    export.status = (
                        LifecycleStatus.COMPLETED.value
                        if export.output_format == "csv"
                        else LifecycleStatus.REJECTED.value
                    )
                    export.failure_category = (
                        None if export.output_format == "csv" else "pdf_storage_not_configured"
                    )
                    db.commit()
            job.status = LifecycleStatus.COMPLETED.value
            job.completed_at = utcnow()
            db.commit()
            log_event(
                "job_completed",
                process_role="worker",
                correlation_id=job.correlation_id,
                job_id=job.id,
                job_type=job.job_type,
                attempt=job.attempts,
                outcome="completed",
            )
            return True
        except Exception:
            db.rollback()
            job = db.get(ProcessingJob, job.id)
            if job is None:
                raise
            job.status = LifecycleStatus.FAILED.value
            job.failure_category = (
                "retry_exhausted" if job.attempts >= 3 else "retryable_processing_failure"
            )
            db.commit()
            log_event(
                "job_failed",
                level=logging.ERROR,
                process_role="worker",
                correlation_id=job.correlation_id,
                job_id=job.id,
                job_type=job.job_type,
                attempt=job.attempts,
                outcome="failed",
                failure_category=job.failure_category,
            )
            return True


# PUBLIC_INTERFACE
def run_forever(poll_seconds: float = 2.0) -> None:
    """Continuously process durable jobs; run this in a dedicated worker process."""
    while True:
        if not run_once():
            time.sleep(poll_seconds)


if __name__ == "__main__":
    run_forever()
