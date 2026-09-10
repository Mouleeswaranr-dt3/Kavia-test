import { FormEvent, useEffect, useRef, useState } from "react";
import { createExport, downloadExport, getExport } from "../api/enersight";
import type { ExportResponse } from "../api/contracts";
import { ErrorState, StatusBadge } from "../components/ui";
import { useLifecyclePolling } from "../hooks/useRequest";

function ExportStatus({ exportResult }: { exportResult: ExportResponse }) {
  const [error, setError] = useState<unknown>(null);
  const [downloading, setDownloading] = useState(false);

  async function downloadFile() {
    setDownloading(true);
    setError(null);
    try {
      const blob = await downloadExport(exportResult.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `enersight-${exportResult.id}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="export-status" aria-live="polite">
      <p><StatusBadge status={exportResult.status} /> Export {exportResult.id}</p>
      {exportResult.status === "queued" && <p>Your CSV export is queued.</p>}
      {exportResult.status === "processing" && <p>Your CSV export is being prepared.</p>}
      {exportResult.status === "completed" && <p>Your CSV export is ready for a fresh authorized download.</p>}
      {exportResult.status === "rejected" && <p>The export was not completed: {exportResult.failure_category ?? "request rejected"}.</p>}
      {exportResult.status === "failed" && <p>The export failed: {exportResult.failure_category ?? "unavailable"}.</p>}
      {exportResult.download_available && <button className="button primary" onClick={downloadFile} disabled={downloading}>{downloading ? "Starting download…" : "Download CSV"}</button>}
      {error != null && <ErrorState error={error} />}
    </div>
  );
}

export function ExportDialog({
  siteId,
  fromDate,
  toDate,
  onClose,
}: {
  siteId: string;
  fromDate: string;
  toDate: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [result, setResult] = useState<ExportResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const polling = useLifecyclePolling(() => getExport(result?.id ?? ""), Boolean(result?.id), [result?.id]);

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      setResult(await createExport({ site_id: siteId, from_date: fromDate, to_date: toDate, output_format: "csv" }));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSubmitting(false);
    }
  }

  const latest = polling.data ?? result;

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <div className="dialog-heading">
          <h2 id="export-title">Export consumption report</h2>
          <button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close export dialog">×</button>
        </div>
        <p>Request a CSV export for site <strong>{siteId}</strong> from {fromDate} through {toDate}.</p>
        <form onSubmit={submit}>
          <label>
            Output format
            <select value="csv" disabled><option value="csv">CSV</option></select>
          </label>
          <p className="muted">PDF export is unavailable in the current environment.</p>
          {!result && <button className="button primary" type="submit" disabled={submitting}>{submitting ? "Requesting export…" : "Request CSV export"}</button>}
        </form>
        {error != null && <ErrorState error={error} />}
        {polling.error != null && <ErrorState error={polling.error} onRetry={polling.retry} />}
        {polling.refreshError != null && <ErrorState error={polling.refreshError} onRetry={polling.retry} />}
        {latest && <ExportStatus exportResult={latest} />}
      </section>
    </div>
  );
}
