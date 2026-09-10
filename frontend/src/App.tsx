import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/ui";
import { AccountManagerPage } from "./pages/AccountManagerPage";
import { ConsumptionPage } from "./pages/ConsumptionPage";
import { UploadPage } from "./pages/UploadPage";
import { UploadStatusPage } from "./pages/UploadStatusPage";

function NotFoundPage() {
  return (
    <section className="state-card error-state">
      <h1>Page unavailable</h1>
      <p>The requested page is unavailable.</p>
    </section>
  );
}

// PUBLIC_INTERFACE
export function App() {
  /** Compose the EnerSight route views within the shared application shell. */
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/uploads" replace />} />
          <Route path="/uploads" element={<UploadPage />} />
          <Route path="/uploads/:uploadId" element={<UploadStatusPage />} />
          <Route path="/sites/:siteId/consumption" element={<ConsumptionPage />} />
          <Route path="/account-manager" element={<AccountManagerPage />} />
          <Route path="/exports/:exportId" element={<Navigate to="/uploads" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
