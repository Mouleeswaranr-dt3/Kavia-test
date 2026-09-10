import { useCallback, useEffect, useState } from "react";

export interface RequestState<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
}

export function useRequest<T>(loader: () => Promise<T>, dependencies: readonly unknown[]) {
  const [state, setState] = useState<RequestState<T>>({ data: null, error: null, loading: true });
  const [retryToken, setRetryToken] = useState(0);

  const retry = useCallback(() => setRetryToken((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setState({ data: null, error: null, loading: true });

    loader()
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error: unknown) => active && setState({ data: null, error, loading: false }));

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, retryToken]);

  return { ...state, retry };
}

export function useLifecyclePolling<T extends { status: string }>(
  loader: () => Promise<T>,
  enabled: boolean,
  dependencies: readonly unknown[],
) {
  const request = useRequest(loader, dependencies);
  const [refreshError, setRefreshError] = useState<unknown>(null);

  useEffect(() => {
    const status = request.data?.status;
    if (!enabled || !status || !["queued", "processing"].includes(status)) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (attempts > 20) {
        window.clearInterval(timer);
        setRefreshError(new Error("Status could not be refreshed. Please try again later."));
        return;
      }
      request.retry();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [enabled, request, request.data?.status]);

  return { ...request, refreshError };
}
