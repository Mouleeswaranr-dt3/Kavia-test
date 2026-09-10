import { type ReactNode, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { ApiError } from "../api/client";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="app-header">
        <Link className="brand" to="/uploads">EnerSight <span>Analytics</span></Link>
        <nav aria-label="Primary navigation">
          <NavLink to="/uploads">Meter uploads</NavLink>
          <NavLink to="/account-manager">Account manager</NavLink>
        </nav>
      </header>
      <main id="main-content" className="page-container">{children}</main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="state-card loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="state-card empty-state">
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = error instanceof ApiError ? error : undefined;
  const genericError = error instanceof Error ? error : undefined;
  const title = apiError?.code === "resource_unavailable"
    ? "This item is unavailable"
    : apiError?.code === "feature_disabled"
      ? "EnerSight is temporarily unavailable"
      : "We could not complete that request";

  return (
    <section className="state-card error-state" role="alert">
      <h2>{title}</h2>
      <p>{apiError?.message ?? genericError?.message ?? "Please try again. If the problem continues, contact support."}</p>
      {apiError?.correlationId && <p className="support-reference">Support reference: {apiError.correlationId}</p>}
      {onRetry && <button className="button secondary" onClick={onRetry}>Try again</button>}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{status.split("_").join(" ")}</span>;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | EnerSight Analytics`;
  }, [title]);
}

export function DateRangeFields({
  fromDate,
  toDate,
  onChange,
  prefix,
}: {
  fromDate: string;
  toDate: string;
  onChange: (field: "fromDate" | "toDate", value: string) => void;
  prefix: string;
}) {
  const invalid = Boolean(fromDate && toDate && fromDate > toDate);

  return (
    <div className="date-range">
      <label htmlFor={`${prefix}-from`}>
        From date
        <input id={`${prefix}-from`} type="date" value={fromDate} onChange={(event) => onChange("fromDate", event.target.value)} />
      </label>
      <label htmlFor={`${prefix}-to`}>
        To date
        <input id={`${prefix}-to`} type="date" value={toDate} onChange={(event) => onChange("toDate", event.target.value)} />
      </label>
      {invalid && <p className="field-error" role="alert">The end date must be on or after the start date.</p>}
    </div>
  );
}

export function focusElement(element: HTMLElement | null) {
  element?.focus();
}

export function ValidationSummary({ errors }: { errors: string[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length) ref.current?.focus();
  }, [errors]);

  if (!errors.length) return null;

  return (
    <div ref={ref} className="validation-summary" tabIndex={-1} role="alert">
      <strong>Please correct the following:</strong>
      <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
    </div>
  );
}
