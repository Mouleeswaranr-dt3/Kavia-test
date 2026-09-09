"""SQLAlchemy models for EnerSight's authorized operational and analytic records."""

from __future__ import annotations

import enum
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def new_id() -> str:
    """Create a non-sequential public-safe identifier."""
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """Return the current timezone-aware UTC timestamp."""
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Base class for all EnerSight persistence mappings."""


class LifecycleStatus(str, enum.Enum):
    """Observable lifecycle states used by uploads, exports, and jobs."""

    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REJECTED = "rejected"


class UserRole(str, enum.Enum):
    """Supported locally normalized user roles."""

    OPERATIONS = "operations"
    CUSTOMER = "customer"
    ACCOUNT_MANAGER = "account_manager"


class Customer(Base):
    """Commercial customer organization."""

    __tablename__ = "customer"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    external_reference: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32), default="active")


class Site(Base):
    """Metered site belonging to a commercial customer."""

    __tablename__ = "site"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    customer_id: Mapped[str] = mapped_column(ForeignKey("customer.id"), index=True)
    external_reference: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    business_category_reference: Mapped[str | None] = mapped_column(String(128))
    timezone_name: Mapped[str] = mapped_column(String(64), default="UTC")
    status: Mapped[str] = mapped_column(String(32), default="active")


class UserAccount(Base):
    """Local representation of an approved external identity."""

    __tablename__ = "user_account"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    external_subject: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="active")


class SiteAccessGrant(Base):
    """Effective site-level authorization grant."""

    __tablename__ = "site_access_grant"
    __table_args__ = (Index("ix_site_grant_active", "user_id", "site_id", "effective_from"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("user_account.id"), index=True)
    site_id: Mapped[str] = mapped_column(ForeignKey("site.id"), index=True)
    access_role: Mapped[str] = mapped_column(String(64))
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AccountManagerAssignment(Base):
    """Effective account-manager membership of a customer portfolio."""

    __tablename__ = "account_manager_assignment"
    __table_args__ = (Index("ix_manager_assignment_active", "user_id", "customer_id", "effective_from"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("user_account.id"), index=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("customer.id"), index=True)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class MeterUpload(Base):
    """Immutable CSV upload provenance and its visible processing outcome."""

    __tablename__ = "meter_upload"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    site_id: Mapped[str] = mapped_column(ForeignKey("site.id"), index=True)
    uploader_id: Mapped[str] = mapped_column(ForeignKey("user_account.id"), index=True)
    checksum: Mapped[str] = mapped_column(String(64), index=True)
    source_file_name: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32), default=LifecycleStatus.QUEUED.value)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    validation_summary: Mapped[dict | None] = mapped_column(JSON)
    source_payload: Mapped[str] = mapped_column(Text)


class MeterReading(Base):
    """Accepted timestamped kWh reading associated with its source upload."""

    __tablename__ = "meter_reading"
    __table_args__ = (Index("ix_reading_site_observed", "site_id", "observed_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    upload_id: Mapped[str] = mapped_column(ForeignKey("meter_upload.id"), index=True)
    site_id: Mapped[str] = mapped_column(ForeignKey("site.id"), index=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    kwh_value: Mapped[Decimal] = mapped_column(Numeric(16, 4))


class DailyConsumption(Base):
    """Versioned daily total consumption derived from accepted readings."""

    __tablename__ = "daily_consumption"
    __table_args__ = (
        UniqueConstraint("site_id", "consumption_date", "calculation_version"),
        Index("ix_consumption_site_date", "site_id", "consumption_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    site_id: Mapped[str] = mapped_column(ForeignKey("site.id"), index=True)
    consumption_date: Mapped[date] = mapped_column(Date)
    total_kwh: Mapped[Decimal] = mapped_column(Numeric(16, 4))
    calculation_version: Mapped[str] = mapped_column(String(64))
    coverage_state: Mapped[str] = mapped_column(String(32), default="available")


class DailyAnalytic(Base):
    """Versioned baseline and anomaly evaluation for one daily consumption fact."""

    __tablename__ = "daily_analytic"
    __table_args__ = (
        CheckConstraint(
            "(baseline_kwh IS NOT NULL AND baseline_kwh > 0) OR anomaly_flag = false",
            name="ck_non_positive_baseline_not_anomalous",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    daily_consumption_id: Mapped[str] = mapped_column(
        ForeignKey("daily_consumption.id"), unique=True, index=True
    )
    baseline_kwh: Mapped[Decimal | None] = mapped_column(Numeric(16, 4))
    threshold_percent: Mapped[Decimal] = mapped_column(Numeric(8, 3))
    deviation_percent: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    anomaly_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    calculation_version: Mapped[str] = mapped_column(String(64))
    policy_version: Mapped[str] = mapped_column(String(64))


class AnomalyAlert(Base):
    """Account-manager-facing alert created only for an assigned customer."""

    __tablename__ = "anomaly_alert"
    __table_args__ = (Index("ix_alert_assignee_created", "assignee_id", "created_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    analytic_id: Mapped[str] = mapped_column(ForeignKey("daily_analytic.id"), unique=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("customer.id"), index=True)
    site_id: Mapped[str] = mapped_column(ForeignKey("site.id"), index=True)
    assignee_id: Mapped[str] = mapped_column(ForeignKey("user_account.id"), index=True)
    suggested_action_version: Mapped[str] = mapped_column(String(64), default="1")
    status: Mapped[str] = mapped_column(String(32), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class BenchmarkSnapshot(Base):
    """Governed peer aggregate or a safe unavailable benchmark result."""

    __tablename__ = "benchmark_snapshot"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    site_id: Mapped[str] = mapped_column(ForeignKey("site.id"), index=True)
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    cohort_policy_version: Mapped[str] = mapped_column(String(64))
    peer_average_kwh: Mapped[Decimal | None] = mapped_column(Numeric(16, 4))
    relative_percent: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    availability_reason: Mapped[str | None] = mapped_column(String(128))


class ExportRequest(Base):
    """Authorized export lifecycle record with no public storage URL."""

    __tablename__ = "export_request"
    __table_args__ = (Index("ix_export_requester_status", "requester_id", "status"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    requester_id: Mapped[str] = mapped_column(ForeignKey("user_account.id"), index=True)
    site_id: Mapped[str] = mapped_column(ForeignKey("site.id"), index=True)
    from_date: Mapped[date] = mapped_column(Date)
    to_date: Mapped[date] = mapped_column(Date)
    output_format: Mapped[str] = mapped_column(String(8))
    status: Mapped[str] = mapped_column(String(32), default=LifecycleStatus.QUEUED.value)
    storage_reference: Mapped[str | None] = mapped_column(String(512))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failure_category: Mapped[str | None] = mapped_column(String(128))


class ProcessingJob(Base):
    """Durable, claimable background work record."""

    __tablename__ = "processing_job"
    __table_args__ = (
        UniqueConstraint("idempotency_key"),
        Index("ix_job_status_lease", "status", "lease_expires_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    job_type: Mapped[str] = mapped_column(String(64))
    resource_type: Mapped[str] = mapped_column(String(64))
    resource_id: Mapped[str] = mapped_column(String(36), index=True)
    idempotency_key: Mapped[str] = mapped_column(String(128), unique=True)
    status: Mapped[str] = mapped_column(String(32), default=LifecycleStatus.QUEUED.value)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    correlation_id: Mapped[str] = mapped_column(String(64))
    lease_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failure_category: Mapped[str | None] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AuditEvent(Base):
    """Append-only safe audit evidence that excludes raw meter-reading data."""

    __tablename__ = "audit_event"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("user_account.id"), index=True)
    action: Mapped[str] = mapped_column(String(128))
    resource_type: Mapped[str] = mapped_column(String(64))
    resource_id: Mapped[str | None] = mapped_column(String(36))
    outcome: Mapped[str] = mapped_column(String(32))
    correlation_id: Mapped[str] = mapped_column(String(64), index=True)
    safe_metadata: Mapped[dict | None] = mapped_column(JSON)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
