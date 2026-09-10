export type Granularity = "daily" | "weekly" | "monthly";
export type ExportFormat = "csv" | "pdf";
export type RankingCriterion = "anomaly_count";

export interface PeriodValue {
  period_start: string;
  period_end: string;
  total_kwh: number;
}

export interface ConsumptionResponse {
  site_id: string;
  from_date: string;
  to_date: string;
  granularity: Granularity;
  state: "available" | "no_data";
  periods: PeriodValue[];
}

export interface DailyAnalyticValue {
  consumption_date: string;
  actual_kwh: number;
  baseline_kwh: number | null;
  deviation_percent: number | null;
  threshold_percent: number;
  anomaly_flag: boolean;
  state: "available" | "baseline_unavailable";
}

export interface DailyAnalyticsResponse {
  site_id: string;
  from_date: string;
  to_date: string;
  state: "available" | "no_data";
  days: DailyAnalyticValue[];
}

export interface BenchmarkResponse {
  site_id: string;
  state: "available" | "unavailable";
  reason_code: string | null;
  peer_average_kwh: number | null;
  relative_percent: number | null;
}

export interface UploadResponse {
  id: string;
  site_id: string;
  status: "queued" | "processing" | "completed" | "rejected" | "failed";
  validation_summary: Record<string, unknown> | null;
}

export interface AlertResponse {
  id: string;
  customer_id: string;
  site_id: string;
  anomaly_date: string;
  deviation_percent: number;
  status: string;
}

export interface AlertsResponse {
  state: "available" | "no_data";
  alerts: AlertResponse[];
}

export interface RankingRow {
  customer_id: string;
  anomaly_count: number;
  rank: number;
}

export interface RankingResponse {
  criterion: RankingCriterion;
  from_date: string;
  to_date: string;
  state: "available" | "no_data";
  rows: RankingRow[];
}

export interface CreateExportRequest {
  site_id: string;
  from_date: string;
  to_date: string;
  output_format: ExportFormat;
}

export interface ExportResponse {
  id: string;
  site_id: string;
  status: "queued" | "processing" | "completed" | "rejected" | "failed";
  output_format: ExportFormat;
  expires_at: string | null;
  failure_category: string | null;
  download_available: boolean;
}
