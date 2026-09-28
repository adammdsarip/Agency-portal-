"use client";

import { useEffect, useState } from "react";

export interface SubscriptionState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

/**
 * Wraps a Firestore real-time listener. `subscribe` must return the unsubscribe
 * function; pass `key = null` to stay idle (e.g. until an id is known).
 */
export function useSubscription<T>(
  key: string | null,
  initial: T,
  subscribe: (onData: (data: T) => void, onError: (e: Error) => void) => () => void,
): SubscriptionState<T> {
  const [state, setState] = useState<SubscriptionState<T> & { key: string | null }>({
    key,
    data: initial,
    loading: key !== null,
    error: null,
  });

  // Reset synchronously when the key changes, so stale data is never shown
  // for a different client.
  if (state.key !== key) {
    setState({ key, data: initial, loading: key !== null, error: null });
  }

  useEffect(() => {
    if (key === null) return;
    return subscribe(
      (data) => setState({ key, data, loading: false, error: null }),
      (error) => {
        console.error(error);
        setState((s) => ({ ...s, key, loading: false, error }));
      },
    );
    // `subscribe` is intentionally keyed by `key` only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data: state.data, loading: state.loading, error: state.error };
}
