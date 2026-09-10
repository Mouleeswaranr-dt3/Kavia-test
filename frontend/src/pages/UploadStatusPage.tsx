import { Link, useParams } from "react-router-dom";
import { getUpload } from "../api/enersight";
import { ErrorState, LoadingState, PageHeader, useDocumentTitle } from "../components/ui";
import { useLifecyclePolling } from "../hooks/useRequest";
import { UploadStatusCard } from "./UploadPage";

export function UploadStatusPage() {
  const { uploadId = "" } = useParams();
  useDocumentTitle("Upload status");
  const request = useLifecyclePolling(() => getUpload(uploadId), Boolean(uploadId), [uploadId]);

  return (
    <>
      <PageHeader eyebrow="Operations workspace" title="Upload outcome" description="Review the current server-confirmed processing status for this upload." />
      {!uploadId && <ErrorState error={new Error("The requested upload is unavailable.")} />}
      {uploadId && request.loading && <LoadingState label="Loading upload status" />}
      {uploadId && request.error && <ErrorState error={request.error} onRetry={request.retry} />}
      {request.refreshError && <ErrorState error={request.refreshError} onRetry={request.retry} />}
      {request.data && <UploadStatusCard upload={request.data} />}
      <p className="back-link"><Link to="/uploads">Upload another CSV</Link></p>
    </>
  );
}
