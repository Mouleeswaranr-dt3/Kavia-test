import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUpload } from "../api/enersight";
import type { UploadResponse } from "../api/contracts";
import { ErrorState, PageHeader, StatusBadge, ValidationSummary, useDocumentTitle } from "../components/ui";

export function UploadPage() {
  useDocumentTitle("Meter uploads");
  const navigate = useNavigate();
  const [siteId, setSiteId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const validationErrors = [
    ...(siteId ? [] : ["Select an authorized site identifier."]),
    ...(file ? (file.name.toLowerCase().endsWith(".csv") ? [] : ["Choose a file with a .csv extension."]) : ["Choose a CSV file."]),
  ];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (validationErrors.length || !file) return;

    setSubmitting(true);
    try {
      const upload = await createUpload(siteId, file);
      setResult(upload);
      navigate(`/uploads/${upload.id}`);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Operations workspace"
        title="Upload meter data"
        description="Submit a CSV for an authorized site. Processing and validation results are confirmed by EnerSight."
      />
      <div className="content-grid single-column">
        <section className="panel">
          <h2>CSV upload</h2>
          <p className="muted">An approved site directory is required for production. Enter a site identifier supplied by your authorized workflow.</p>
          <ValidationSummary errors={validationErrors.length && Boolean(error) ? validationErrors : []} />
          <form onSubmit={submit} noValidate>
            <label htmlFor="upload-site">
              Site identifier
              <input id="upload-site" value={siteId} onChange={(event) => setSiteId(event.target.value)} placeholder="e.g. site-001" aria-invalid={!siteId} />
            </label>
            <label htmlFor="upload-file">
              Meter CSV
              <input id="upload-file" type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} aria-invalid={Boolean(file && !file.name.toLowerCase().endsWith(".csv"))} />
            </label>
            {file && <p className="selected-file">Selected file: <strong>{file.name}</strong></p>}
            <button className="button primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting upload…" : "Submit CSV"}
            </button>
          </form>
        </section>
        {error != null && <ErrorState error={error} />}
        {result && <UploadStatusCard upload={result} />}
      </div>
    </>
  );
}

export function UploadStatusCard({ upload }: { upload: UploadResponse }) {
  const terminal = ["completed", "rejected", "failed"].includes(upload.status);
  const summary = upload.validation_summary && Object.entries(upload.validation_summary);

  return (
    <section className="panel status-panel" aria-live="polite">
      <div className="panel-heading">
        <div>
          <h2>Upload status</h2>
          <p>Upload {upload.id}</p>
        </div>
        <StatusBadge status={upload.status} />
      </div>
      {upload.status === "queued" && <p>Your file is queued. Validation and processing are not complete.</p>}
      {upload.status === "processing" && <p>Your CSV is being processed. This page will refresh while the status remains active.</p>}
      {upload.status === "completed" && <p>Processing is complete. The accepted data is now available for downstream analytics.</p>}
      {upload.status === "rejected" && <p>The CSV was not accepted. Review the validation summary below.</p>}
      {upload.status === "failed" && <p>Processing could not be completed. Start a new upload when appropriate.</p>}
      {terminal && summary && (
        <dl className="validation-details">
          {summary.map(([key, value]) => <div key={key}><dt>{key.split("_").join(" ")}</dt><dd>{String(value)}</dd></div>)}
        </dl>
      )}
    </section>
  );
}
