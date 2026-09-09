"""Transport schemas for the approved EnerSight API surface."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class Granularity(str, Enum):
    """Supported consumption aggregation levels."""

    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ExportFormat(str, Enum):
    """Approved report output formats."""

    CSV = "csv"
    PDF = "pdf"


class RankingCriterion(str, Enum):
    """Supported account-manager ranking criteria."""

    ANOMALY_COUNT = "anomaly_count"


class DateRangeQuery(BaseModel):
    """Inclusive date range used by site data queries."""

    from_date: date = Field(description="Inclusive beginning of the requested period.")
    to_date: date = Field(description="Inclusive end of the requested period.")

    @model_validator(mode="after")
    def validate_range(self) -> "DateRangeQuery":
        """Reject date ranges where the end precedes the beginning."""
        if self.from_date > self.to_date:
            raise ValueError("to_date must be on or after from_date")
        return self


class ConsumptionQuery(DateRangeQuery):
    """Consumption query with an approved aggregation selection."""

    granularity: Granularity = Field(description="Requested daily, weekly, or monthly aggregation.")


class PeriodValue(BaseModel):
    """One authorized aggregated consumption period."""

    period_start: date
    period_end: date
    total_kwh: Decimal


class ConsumptionResponse(BaseModel):
    """Authorized consumption result or explicit no-data state."""

    site_id: str
    from_date: date
    to_date: date
    granularity: Granularity
    state: str = Field(description="available or no_data.")
    periods: list[PeriodValue]


class DailyAnalyticValue(BaseModel):
    """One explainable daily analytic record."""

    consumption_date: date
    actual_kwh: Decimal
    baseline_kwh: Decimal | None
    deviation_percent: Decimal | None
    threshold_percent: Decimal
    anomaly_flag: bool
    state: str = Field(description="available or baseline_unavailable.")


class DailyAnalyticsResponse(BaseModel):
    """Daily analytics for an authorized site."""

    site_id: str
    from_date: date
    to_date: date
    state: str
    days: list[DailyAnalyticValue]


class UploadResponse(BaseModel):
    """Safe upload provenance and durable processing state."""

    id: str
    site_id: str
    status: str
    validation_summary: dict | None = None


class BenchmarkResponse(BaseModel):
    """Available governed benchmark or a safe unavailable result."""

    site_id: str
    state: str = Field(description="available or unavailable.")
    reason_code: str | None = None
    peer_average_kwh: Decimal | None = None
    relative_percent: Decimal | None = None


class AlertResponse(BaseModel):
    """Account-manager alert visible only within the assigned portfolio."""

    id: str
    customer_id: str
    site_id: str
    anomaly_date: date
    deviation_percent: Decimal
    status: str


class AlertsResponse(BaseModel):
    """Authorized account-manager alert list."""

    state: str
    alerts: list[AlertResponse]


class RankingRow(BaseModel):
    """One authorized customer ranking result."""

    customer_id: str
    anomaly_count: int
    rank: int


class RankingResponse(BaseModel):
    """Ranking response that always identifies its criterion and period."""

    criterion: RankingCriterion
    from_date: date
    to_date: date
    state: str
    rows: list[RankingRow]


class CreateExportRequest(DateRangeQuery):
    """Command to create an authorized durable export request."""

    site_id: str = Field(min_length=1, description="Authorized site identifier.")
    output_format: ExportFormat = Field(description="Requested report format.")


class ExportResponse(BaseModel):
    """Safe export lifecycle status without an internal storage locator."""

    id: str
    site_id: str
    status: str
    output_format: ExportFormat
    expires_at: datetime | None = None
    failure_category: str | None = None
    download_available: bool


class ErrorResponse(BaseModel):
    """Stable, user-safe API error envelope."""

    code: str
    message: str
    details: list[dict] | None = None
    correlation_id: str
