"""Centralized safe error translation for EnerSight HTTP APIs."""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from .telemetry import log_event


def _correlation_id(request: Request) -> str:
    """Return request correlation context when middleware has established it."""
    return getattr(request.state, "correlation_id", "unavailable")


def _safe_response(
    request: Request,
    status_code: int,
    code: str,
    message: str,
    details: list[dict] | None = None,
) -> JSONResponse:
    """Build the standard public error envelope without internal diagnostics."""
    payload: dict[str, object] = {
        "code": code,
        "message": message,
        "correlation_id": _correlation_id(request),
    }
    if details:
        payload["details"] = details
    return JSONResponse(status_code=status_code, content=payload)


# PUBLIC_INTERFACE
def install_exception_handlers(app: FastAPI) -> None:
    """Install safe, correlation-aware handlers for all API failure categories."""

    @app.exception_handler(HTTPException)
    async def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
        """Serialize expected application errors using the standard envelope."""
        detail = exc.detail if isinstance(exc.detail, dict) else {}
        return _safe_response(
            request,
            exc.status_code,
            str(detail.get("code", "request_failed")),
            str(detail.get("message", "The request could not be completed.")),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Return field-safe validation details without exposing request payloads."""
        safe_details = [
            {"field": ".".join(str(part) for part in error["loc"]), "message": error["msg"]}
            for error in exc.errors()
        ]
        return _safe_response(
            request,
            422,
            "invalid_request",
            "The request contains invalid values.",
            safe_details,
        )

    @app.exception_handler(SQLAlchemyError)
    async def handle_database_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        """Map persistence failures to a generic error while retaining safe diagnostics."""
        log_event(
            "database_request_failed",
            level=logging.ERROR,
            correlation_id=_correlation_id(request),
            outcome="failed",
            failure_category="persistence_failure",
        )
        return _safe_response(
            request, 500, "internal_error", "The request could not be completed."
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        """Prevent unhandled exception details from being disclosed to clients."""
        log_event(
            "request_failed",
            level=logging.ERROR,
            correlation_id=_correlation_id(request),
            outcome="failed",
            failure_category="unexpected_failure",
        )
        return _safe_response(
            request, 500, "internal_error", "The request could not be completed."
        )
