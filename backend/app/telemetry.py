"""Safe structured logging utilities for API and worker processes."""

from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any


class JsonFormatter(logging.Formatter):
    """Render approved operational fields as newline-delimited JSON."""

    def format(self, record: logging.LogRecord) -> str:
        """Format one safe application event without serializing arbitrary context."""
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "event": getattr(record, "event", record.msg),
            "process_role": getattr(record, "process_role", "api"),
            "correlation_id": getattr(record, "correlation_id", "unavailable"),
            "outcome": getattr(record, "outcome", "unknown"),
        }
        for field in (
            "method",
            "route",
            "status_code",
            "duration_ms",
            "error_code",
            "job_id",
            "job_type",
            "attempt",
            "resource_type",
            "resource_id",
            "failure_category",
        ):
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value
        return json.dumps(payload, default=str, separators=(",", ":"))


# PUBLIC_INTERFACE
def configure_logging() -> logging.Logger:
    """Configure the EnerSight logger with safe JSON output exactly once."""
    logger = logging.getLogger("enersight")
    if logger.handlers:
        return logger

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
    logger.propagate = False
    return logger


# PUBLIC_INTERFACE
def log_event(event: str, *, level: int = logging.INFO, **fields: Any) -> None:
    """Emit an approved structured event using only explicitly supplied safe fields."""
    configure_logging().log(level, event, extra={"event": event, **fields})
