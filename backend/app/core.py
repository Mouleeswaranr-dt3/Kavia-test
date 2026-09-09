"""Application configuration, request context, and safe API errors."""

from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Generator

from fastapi import Header, HTTPException, Request
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


@dataclass(frozen=True)
class Settings:
    """Runtime configuration loaded from deployment-injected environment variables."""

    database_url: str
    api_v1_prefix: str
    feature_enabled: bool
    anomaly_threshold_percent: Decimal
    calculation_version: str
    export_expiry_seconds: int
    cors_trusted_origins: list[str]


def _boolean(value: str) -> bool:
    """Convert a configured boolean value without silently accepting unknown values."""
    if value.lower() in {"true", "1", "yes"}:
        return True
    if value.lower() in {"false", "0", "no"}:
        return False
    raise RuntimeError("FEATURE_ENERSIGHT_ENABLED must be true or false.")


# PUBLIC_INTERFACE
def get_settings() -> Settings:
    """Return validated runtime settings sourced exclusively from environment variables."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL must be provided by the deployment environment.")

    threshold = Decimal(os.getenv("ANOMALY_THRESHOLD_PERCENT", "20"))
    if threshold < 0:
        raise RuntimeError("ANOMALY_THRESHOLD_PERCENT must not be negative.")

    origins = [
        origin.strip()
        for origin in os.getenv("CORS_TRUSTED_ORIGINS", "").split(",")
        if origin.strip()
    ]
    return Settings(
        database_url=database_url,
        api_v1_prefix=os.getenv("API_V1_PREFIX", "/api/v1"),
        feature_enabled=_boolean(os.getenv("FEATURE_ENERSIGHT_ENABLED", "false")),
        anomaly_threshold_percent=threshold,
        calculation_version=os.getenv("ANALYTICS_CALCULATION_VERSION", "1"),
        export_expiry_seconds=int(os.getenv("EXPORT_EXPIRY_SECONDS", "86400")),
        cors_trusted_origins=origins,
    )


settings = get_settings()
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


# PUBLIC_INTERFACE
def get_db() -> Generator[Session, None, None]:
    """Yield a database session and always close it after the request completes."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


# PUBLIC_INTERFACE
def get_correlation_id(
    request: Request,
    x_correlation_id: str | None = Header(default=None),
) -> str:
    """Return a safe request correlation identifier and attach it to request state."""
    correlation_id = x_correlation_id or str(uuid.uuid4())
    request.state.correlation_id = correlation_id
    return correlation_id


# PUBLIC_INTERFACE
def require_enabled() -> None:
    """Block all product operations when the deployment feature flag is disabled."""
    if not settings.feature_enabled:
        raise HTTPException(
            status_code=503,
            detail={"code": "feature_disabled", "message": "EnerSight is not enabled."},
        )
