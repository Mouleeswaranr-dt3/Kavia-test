import { download, get, postForm, postJson } from "./client";
import type {
  AlertsResponse,
  BenchmarkResponse,
  ConsumptionResponse,
  CreateExportRequest,
  DailyAnalyticsResponse,
  ExportResponse,
  Granularity,
  RankingResponse,
  UploadResponse,
} from "./contracts";

function query(values: Record<string, string>): string {
  return new URLSearchParams(values).toString();
}

export function createUpload(siteId: string, file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.set("file", file);
  return postForm<UploadResponse>(`/meter-uploads?${query({ site_id: siteId })}`, form);
}

export function getUpload(uploadId: string): Promise<UploadResponse> {
  return get<UploadResponse>(`/meter-uploads/${encodeURIComponent(uploadId)}`);
}

export function getConsumption(
  siteId: string,
  fromDate: string,
  toDate: string,
  granularity: Granularity,
): Promise<ConsumptionResponse> {
  return get<ConsumptionResponse>(
    `/sites/${encodeURIComponent(siteId)}/consumption?${query({
      from_date: fromDate,
      to_date: toDate,
      granularity,
    })}`,
  );
}

export function getDailyAnalytics(siteId: string, fromDate: string, toDate: string): Promise<DailyAnalyticsResponse> {
  return get<DailyAnalyticsResponse>(
    `/sites/${encodeURIComponent(siteId)}/daily-analytics?${query({ from_date: fromDate, to_date: toDate })}`,
  );
}

export function getBenchmark(siteId: string): Promise<BenchmarkResponse> {
  return get<BenchmarkResponse>(`/sites/${encodeURIComponent(siteId)}/benchmark`);
}

export function getAlerts(): Promise<AlertsResponse> {
  return get<AlertsResponse>("/account-manager/alerts");
}

export function getRanking(fromDate: string, toDate: string): Promise<RankingResponse> {
  return get<RankingResponse>(
    `/account-manager/customer-ranking?${query({
      from_date: fromDate,
      to_date: toDate,
      criterion: "anomaly_count",
    })}`,
  );
}

export function createExport(payload: CreateExportRequest): Promise<ExportResponse> {
  return postJson<ExportResponse>("/exports", payload);
}

export function getExport(exportId: string): Promise<ExportResponse> {
  return get<ExportResponse>(`/exports/${encodeURIComponent(exportId)}`);
}

export function downloadExport(exportId: string): Promise<Blob> {
  return download(`/exports/${encodeURIComponent(exportId)}/download`);
}
