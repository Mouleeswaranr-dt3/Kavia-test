"""SQLAlchemy repositories used by EnerSight domain services.

Repositories own persistence query construction. They return mapped records and
never expose FastAPI response types or make HTTP decisions.
"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import (
    AccountManagerAssignment,
    AnomalyAlert,
    AuditEvent,
    DailyAnalytic,
    DailyConsumption,
    ExportRequest,
    MeterReading,
    MeterUpload,
    ProcessingJob,
    Site,
    SiteAccessGrant,
    UserAccount,
)


class AccessRepository:
    """Persistence operations for local users and effective authorization grants."""

    def __init__(self, db: Session) -> None:
        """Initialize the repository with an application unit-of-work session."""
        self.db = db

    def find_active_principal(self, external_subject: str) -> UserAccount | None:
        """Return the active local account matching an authenticated subject."""
        return self.db.scalar(
            select(UserAccount).where(
                UserAccount.external_subject == external_subject,
                UserAccount.status == "active",
            )
        )

    def find_active_site(self, site_id: str) -> Site | None:
        """Return an active site by identifier."""
        return self.db.scalar(
            select(Site).where(Site.id == site_id, Site.status == "active")
        )

    def has_site_grant(self, user_id: str, site_id: str, at: datetime) -> bool:
        """Return whether a user has an effective direct site grant."""
        return self.db.scalar(
            select(SiteAccessGrant.id).where(
                SiteAccessGrant.user_id == user_id,
                SiteAccessGrant.site_id == site_id,
                SiteAccessGrant.effective_from <= at,
                SiteAccessGrant.effective_to.is_(None)
                | (SiteAccessGrant.effective_to > at),
            )
        ) is not None

    def has_customer_assignment(
        self, user_id: str, customer_id: str, at: datetime
    ) -> bool:
        """Return whether a manager has an effective customer assignment."""
        return self.db.scalar(
            select(AccountManagerAssignment.id).where(
                AccountManagerAssignment.user_id == user_id,
                AccountManagerAssignment.customer_id == customer_id,
                AccountManagerAssignment.effective_from <= at,
                AccountManagerAssignment.effective_to.is_(None)
                | (AccountManagerAssignment.effective_to > at),
            )
        ) is not None

    def manager_customer_ids(self, user_id: str, at: datetime) -> set[str]:
        """Return the current assigned customer portfolio for a manager."""
        return set(
            self.db.scalars(
                select(AccountManagerAssignment.customer_id).where(
                    AccountManagerAssignment.user_id == user_id,
                    AccountManagerAssignment.effective_from <= at,
                    AccountManagerAssignment.effective_to.is_(None)
                    | (AccountManagerAssignment.effective_to > at),
                )
            )
        )


class UploadRepository:
    """Persistence operations for immutable meter-upload provenance."""

    def __init__(self, db: Session) -> None:
        """Initialize the repository with an application unit-of-work session."""
        self.db = db

    def add(self, upload: MeterUpload) -> MeterUpload:
        """Persist and assign the identifier for an upload."""
        self.db.add(upload)
        self.db.flush()
        return upload

    def get(self, upload_id: str) -> MeterUpload | None:
        """Return an upload record by identifier."""
        return self.db.get(MeterUpload, upload_id)


class AlertRepository:
    """Persistence operations for alerts constrained to a manager portfolio."""

    def __init__(self, db: Session) -> None:
        """Initialize the repository with an application unit-of-work session."""
        self.db = db

    def list_for_manager(
        self, manager_id: str, customer_ids: set[str]
    ) -> list[tuple[AnomalyAlert, DailyConsumption, DailyAnalytic]]:
        """Return alerts only from the manager's authorized customer portfolio."""
        if not customer_ids:
            return []
        return list(
            self.db.execute(
                select(AnomalyAlert, DailyConsumption, DailyAnalytic)
                .join(DailyAnalytic, DailyAnalytic.id == AnomalyAlert.analytic_id)
                .join(
                    DailyConsumption,
                    DailyConsumption.id == DailyAnalytic.daily_consumption_id,
                )
                .where(
                    AnomalyAlert.assignee_id == manager_id,
                    AnomalyAlert.customer_id.in_(customer_ids),
                )
                .order_by(AnomalyAlert.created_at.desc())
            ).all()
        )


class ExportRepository:
    """Persistence operations for protected export lifecycle records."""

    def __init__(self, db: Session) -> None:
        """Initialize the repository with an application unit-of-work session."""
        self.db = db

    def add(self, export: ExportRequest) -> ExportRequest:
        """Persist a new export request and assign its identifier."""
        self.db.add(export)
        self.db.flush()
        return export

    def get(self, export_id: str) -> ExportRequest | None:
        """Return an export request by identifier."""
        return self.db.get(ExportRequest, export_id)


class AnalyticsRepository:
    """Persistence operations for derived facts and analytics read models."""

    def __init__(self, db: Session) -> None:
        """Initialize the repository with an application unit-of-work session."""
        self.db = db

    def reading_totals_by_day(self, site_id: str) -> list[tuple[object, object]]:
        """Return source-reading totals grouped by UTC calendar date."""
        return list(
            self.db.execute(
                select(
                    func.date(MeterReading.observed_at),
                    func.sum(MeterReading.kwh_value),
                )
                .where(MeterReading.site_id == site_id)
                .group_by(func.date(MeterReading.observed_at))
                .order_by(func.date(MeterReading.observed_at))
            ).all()
        )

    def find_daily_consumption(
        self, site_id: str, consumption_date: date, calculation_version: str
    ) -> DailyConsumption | None:
        """Return a versioned daily fact for one site and date."""
        return self.db.scalar(
            select(DailyConsumption).where(
                DailyConsumption.site_id == site_id,
                DailyConsumption.consumption_date == consumption_date,
                DailyConsumption.calculation_version == calculation_version,
            )
        )

    def find_analytic(self, consumption_id: str) -> DailyAnalytic | None:
        """Return the analytic associated with a daily-consumption record."""
        return self.db.scalar(
            select(DailyAnalytic).where(
                DailyAnalytic.daily_consumption_id == consumption_id
            )
        )

    def consumption_rows(
        self, site_id: str, from_date: date, to_date: date, calculation_version: str
    ) -> list[DailyConsumption]:
        """Return derived daily facts for a constrained site and inclusive period."""
        return list(
            self.db.scalars(
                select(DailyConsumption)
                .where(
                    DailyConsumption.site_id == site_id,
                    DailyConsumption.consumption_date.between(from_date, to_date),
                    DailyConsumption.calculation_version == calculation_version,
                )
                .order_by(DailyConsumption.consumption_date)
            )
        )

    def analytic_rows(
        self, site_id: str, from_date: date, to_date: date
    ) -> list[tuple[DailyConsumption, DailyAnalytic]]:
        """Return explainable daily analytics for one constrained site and range."""
        return list(
            self.db.execute(
                select(DailyConsumption, DailyAnalytic)
                .join(
                    DailyAnalytic,
                    DailyAnalytic.daily_consumption_id == DailyConsumption.id,
                )
                .where(
                    DailyConsumption.site_id == site_id,
                    DailyConsumption.consumption_date.between(from_date, to_date),
                )
                .order_by(DailyConsumption.consumption_date)
            ).all()
        )

    def ranking_rows(
        self, customer_ids: set[str], from_date: date, to_date: date
    ) -> list[tuple[str, int]]:
        """Return anomaly counts for an explicitly authorized customer portfolio."""
        if not customer_ids:
            return []
        return list(
            self.db.execute(
                select(Site.customer_id, func.count(AnomalyAlert.id))
                .join(AnomalyAlert, AnomalyAlert.site_id == Site.id)
                .join(DailyAnalytic, DailyAnalytic.id == AnomalyAlert.analytic_id)
                .join(
                    DailyConsumption,
                    DailyConsumption.id == DailyAnalytic.daily_consumption_id,
                )
                .where(
                    Site.customer_id.in_(customer_ids),
                    DailyConsumption.consumption_date.between(from_date, to_date),
                )
                .group_by(Site.customer_id)
                .order_by(func.count(AnomalyAlert.id).desc())
            ).all()
        )


class JobRepository:
    """Persistence operations for durable processing jobs."""

    def __init__(self, db: Session) -> None:
        """Initialize the repository with an application unit-of-work session."""
        self.db = db

    def add(self, job: ProcessingJob) -> ProcessingJob:
        """Persist a newly queued job."""
        self.db.add(job)
        self.db.flush()
        return job

    def claim_next(self) -> ProcessingJob | None:
        """Atomically lock the next queued job for a single worker."""
        return self.db.scalar(
            select(ProcessingJob)
            .where(ProcessingJob.status == "queued")
            .order_by(ProcessingJob.created_at)
            .with_for_update(skip_locked=True)
        )


class AuditRepository:
    """Persistence operations for append-only safe audit evidence."""

    def __init__(self, db: Session) -> None:
        """Initialize the repository with an application unit-of-work session."""
        self.db = db

    def record(
        self,
        actor_id: str | None,
        action: str,
        resource_type: str,
        resource_id: str | None,
        outcome: str,
        correlation_id: str,
    ) -> None:
        """Append audit evidence without raw readings, secrets, or provider payloads."""
        self.db.add(
            AuditEvent(
                actor_id=actor_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                outcome=outcome,
                correlation_id=correlation_id,
            )
        )
