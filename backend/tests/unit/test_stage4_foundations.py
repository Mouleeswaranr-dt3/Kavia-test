"""Stage 4 regression tests for validation, calculations, and safe error responses."""

from __future__ import annotations

from decimal import Decimal

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.errors import install_exception_handlers
from app.schemas import DateRangeQuery
from app.services import parse_csv


def test_date_range_rejects_reversed_values() -> None:
    """Validation must reject a request whose end date precedes its start date."""
    with pytest.raises(ValueError):
        DateRangeQuery.model_validate({"from_date": "2026-02-02", "to_date": "2026-02-01"})


def test_csv_validator_rejects_missing_headers() -> None:
    """CSV policy rejects input that omits the minimum approved column names."""
    rows, summary = parse_csv("observed,kilowatt_hours\n2026-01-01T00:00:00Z,10\n")
    assert rows == []
    assert summary["code"] == "required_headers_missing"


def test_csv_validator_normalizes_valid_rows() -> None:
    """CSV policy accepts positive timezone-aware readings only."""
    rows, summary = parse_csv("timestamp,kwh\n2026-01-01T00:00:00Z,20.5\n")
    assert rows[0][1] == Decimal("20.5")
    assert summary == {"state": "accepted", "accepted_rows": 1}


def test_validation_errors_use_standard_safe_envelope() -> None:
    """Centralized validation handling includes a safe error code and correlation id."""
    application = FastAPI()
    install_exception_handlers(application)

    @application.get("/value")
    def get_value(value: int) -> dict[str, int]:
        """Return a validated integer for error-handler verification."""
        return {"value": value}

    response = TestClient(application).get("/value?value=not-an-integer")
    assert response.status_code == 422
    assert response.json()["code"] == "invalid_request"
    assert response.json()["correlation_id"] == "unavailable"
