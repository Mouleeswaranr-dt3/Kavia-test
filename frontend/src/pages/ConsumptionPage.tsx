import { FormEvent, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getBenchmark, getConsumption, getDailyAnalytics } from "../api/enersight";
import type { DailyAnalyticsResponse, Granularity } from "../api/contracts";
import { DateRangeFields, EmptyState, ErrorState, LoadingState, PageHeader, useDocumentTitle } from "../components/ui";
import { useRequest } from "../hooks/useRequest";
import { ExportDialog } from "./ExportDialog";

function defaultDates() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - 29);
  return { fromDate: from.toISOString().slice(0, 10), toDate: to.toISOString().slice(0, 10) };
}

function formatKwh(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function DailyAnalyticsView({ data }: { data: DailyAnalyticsResponse }) {
  if (data.state === "no_data") {
    return <EmptyState title="No daily analytics">There are no accepted daily values for this selected range.</EmptyState>;
  }

  return (
    <section className="panel">
      <h2>Daily analytics</h2>
      <p className="muted">An anomaly is shown with a label and marker, not color alone. Baselines are server-supplied.</p>
      <div className="chart-scroll" role="region" aria-label="Daily analytics data">
        <table>
          <thead><tr><th>Date</th><th>Actual kWh</th><th>Baseline kWh</th><th>Deviation</th><th>Threshold</th><th>State</th></tr></thead>
          <tbody>
            {data.days.map((day) => (
              <tr key={day.consumption_date} className={day.anomaly_flag ? "anomaly-row" : ""}>
                <td>{day.consumption_date}</td>
                <td>{formatKwh(day.actual_kwh)}</td>
                <td>{day.baseline_kwh === null ? "Unavailable" : formatKwh(day.baseline_kwh)}</td>
                <td>{day.deviation_percent === null ? "Unavailable" : `${formatKwh(day.deviation_percent)}%`}</td>
                <td>{formatKwh(day.threshold_percent)}%</td>
                <td>{day.anomaly_flag ? <strong>● Anomaly</strong> : day.state === "baseline_unavailable" ? "Baseline unavailable" : "Normal"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ConsumptionPage() {
  const { siteId = "" } = useParams();
  const initial = useMemo(defaultDates, []);
  const [draft, setDraft] = useState({ ...initial, granularity: "daily" as Granularity });
  const [selection, setSelection] = useState(draft);
  const [showExport, setShowExport] = useState(false);
  const valid = Boolean(siteId && selection.fromDate && selection.toDate && selection.fromDate <= selection.toDate);

  useDocumentTitle("Consumption dashboard");
  const consumption = useRequest(
    () => getConsumption(siteId, selection.fromDate, selection.toDate, selection.granularity),
    [siteId, selection.fromDate, selection.toDate, selection.granularity],
  );
  const daily = useRequest(
    () => getDailyAnalytics(siteId, selection.fromDate, selection.toDate),
    [siteId, selection.fromDate, selection.toDate],
  );
  const benchmark = useRequest(() => getBenchmark(siteId), [siteId]);

  function apply(event: FormEvent) {
    event.preventDefault();
    if (draft.fromDate && draft.toDate && draft.fromDate <= draft.toDate) setSelection(draft);
  }

  return (
    <>
      <PageHeader
        eyebrow={`Authorized site · ${siteId || "unavailable"}`}
        title="Consumption dashboard"
        description="Review server-derived consumption, daily baseline evidence, and governed benchmark availability."
        actions={<button className="button primary" onClick={() => setShowExport(true)} disabled={!valid}>Export report</button>}
      />
      <section className="panel controls-panel">
        <form onSubmit={apply}>
          <DateRangeFields
            prefix="consumption"
            fromDate={draft.fromDate}
            toDate={draft.toDate}
            onChange={(field, value) => setDraft((previous) => ({ ...previous, [field]: value }))}
          />
          <label htmlFor="granularity">
            Granularity
            <select id="granularity" value={draft.granularity} onChange={(event) => setDraft((previous) => ({ ...previous, granularity: event.target.value as Granularity }))}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <button className="button secondary" type="submit" disabled={draft.fromDate > draft.toDate}>Apply view</button>
        </form>
      </section>

      {!siteId && <ErrorState error={new Error("The requested site is unavailable.")} />}
      {siteId && <div className="analytics-grid">
        <div className="stack">
          {consumption.loading && <LoadingState label="Loading consumption" />}
          {consumption.error != null && <ErrorState error={consumption.error} onRetry={consumption.retry} />}
          {consumption.data?.state === "no_data" && <EmptyState title="No consumption data">No accepted consumption data exists for the selected authorized site and date range.</EmptyState>}
          {consumption.data?.state === "available" && (
            <section className="panel">
              <h2>{selection.granularity[0].toUpperCase() + selection.granularity.slice(1)} consumption</h2>
              <div className="chart-scroll"><table>
                <thead><tr><th>Period start</th><th>Period end</th><th>Total kWh</th></tr></thead>
                <tbody>{consumption.data.periods.map((period) => <tr key={`${period.period_start}-${period.period_end}`}><td>{period.period_start}</td><td>{period.period_end}</td><td>{formatKwh(period.total_kwh)}</td></tr>)}</tbody>
              </table></div>
            </section>
          )}
          {daily.loading && selection.granularity === "daily" && <LoadingState label="Loading daily analytics" />}
          {daily.error != null && selection.granularity === "daily" && <ErrorState error={daily.error} onRetry={daily.retry} />}
          {daily.data && selection.granularity === "daily" && <DailyAnalyticsView data={daily.data} />}
        </div>
        <aside className="stack">
          <section className="panel">
            <h2>Peer benchmark</h2>
            {benchmark.loading && <LoadingState label="Loading benchmark" />}
            {benchmark.error != null && <ErrorState error={benchmark.error} onRetry={benchmark.retry} />}
            {benchmark.data?.state === "unavailable" && <p>Peer comparison is unavailable: {benchmark.data.reason_code?.split("_").join(" ") ?? "not configured"}.</p>}
            {benchmark.data?.state === "available" && <p>Peer average: {benchmark.data.peer_average_kwh === null ? "Unavailable" : `${formatKwh(benchmark.data.peer_average_kwh)} kWh`}</p>}
          </section>
        </aside>
      </div>}
      {showExport && siteId && <ExportDialog siteId={siteId} fromDate={selection.fromDate} toDate={selection.toDate} onClose={() => setShowExport(false)} />}
    </>
  );
}
