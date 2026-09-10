import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAlerts, getRanking } from "../api/enersight";
import { DateRangeFields, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, useDocumentTitle } from "../components/ui";
import { useRequest } from "../hooks/useRequest";

function defaultDates() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - 29);
  return { fromDate: from.toISOString().slice(0, 10), toDate: to.toISOString().slice(0, 10) };
}

export function AccountManagerPage() {
  useDocumentTitle("Account manager");
  const initial = useMemo(defaultDates, []);
  const [draft, setDraft] = useState(initial);
  const [selection, setSelection] = useState(initial);
  const ranking = useRequest(() => getRanking(selection.fromDate, selection.toDate), [selection.fromDate, selection.toDate]);
  const alerts = useRequest(getAlerts, []);

  function apply(event: FormEvent) {
    event.preventDefault();
    if (draft.fromDate && draft.toDate && draft.fromDate <= draft.toDate) setSelection(draft);
  }

  return (
    <>
      <PageHeader eyebrow="Assigned portfolio" title="Account manager dashboard" description="Prioritize server-ranked assigned customers and navigate from authorized alerts to their site context." />
      <section className="panel controls-panel">
        <form onSubmit={apply}>
          <DateRangeFields prefix="ranking" fromDate={draft.fromDate} toDate={draft.toDate} onChange={(field, value) => setDraft((previous) => ({ ...previous, [field]: value }))} />
          <label>
            Ranking method
            <select value="anomaly_count" disabled><option value="anomaly_count">Anomaly count</option></select>
          </label>
          <button className="button secondary" type="submit" disabled={draft.fromDate > draft.toDate}>Refresh ranking</button>
        </form>
      </section>

      <div className="analytics-grid">
        <section className="panel">
          <h2>Customer ranking</h2>
          {ranking.loading && <LoadingState label="Loading assigned-customer ranking" />}
          {ranking.error != null && <ErrorState error={ranking.error} onRetry={ranking.retry} />}
          {ranking.data?.state === "no_data" && <EmptyState title="No ranking data">No assigned customers have ranking data for this selected period.</EmptyState>}
          {ranking.data?.state === "available" && <div className="chart-scroll"><table>
            <thead><tr><th>Rank</th><th>Customer identifier</th><th>Anomaly count</th></tr></thead>
            <tbody>{ranking.data.rows.map((row) => <tr key={row.customer_id}><td>{row.rank}</td><td>{row.customer_id}</td><td>{row.anomaly_count}</td></tr>)}</tbody>
          </table></div>}
        </section>

        <section className="panel">
          <h2>Alerts</h2>
          {alerts.loading && <LoadingState label="Loading assigned alerts" />}
          {alerts.error != null && <ErrorState error={alerts.error} onRetry={alerts.retry} />}
          {alerts.data?.state === "no_data" && <EmptyState title="No anomaly alerts">There are no anomaly alerts in your authorized portfolio.</EmptyState>}
          {alerts.data?.state === "available" && <ul className="alert-list">
            {alerts.data.alerts.map((alert) => (
              <li key={alert.id}>
                <div>
                  <strong>Customer {alert.customer_id}</strong>
                  <p>Site {alert.site_id} · {alert.anomaly_date} · {alert.deviation_percent}% deviation</p>
                </div>
                <div className="alert-actions">
                  <StatusBadge status={alert.status} />
                  <Link className="text-link" to={`/sites/${encodeURIComponent(alert.site_id)}/consumption`}>Open site</Link>
                </div>
              </li>
            ))}
          </ul>}
        </section>
      </div>
    </>
  );
}
