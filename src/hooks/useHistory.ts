"use client";

// Live list of match history from dummyRoom/history. Read-only.
import { useEffect, useState } from "react";
import { DB_PATHS, isConfigured } from "@/lib/firebase";
import { subscribeToList } from "@/lib/rtdb";
import type { HistoryEntry } from "@/types/models";

export function useHistory(): {
  history: HistoryEntry[];
  loading: boolean;
  error: Error | null;
} {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If Firebase is not configured (local development), load mock data immediately
    if (process.env.NODE_ENV === "development" && !isConfigured) {
      fetch("/mock-data.json")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data?.history) && data.history.length > 0) {
            setHistory(data.history);
            setError(null);
          }
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false));
      return;
    }
    const unsubscribe = subscribeToList<HistoryEntry>(
      DB_PATHS.history,
      (items) => {
        setHistory(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        if (process.env.NODE_ENV === "development" && !isConfigured) {
          fetch("/mock-data.json")
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data?.history) && data.history.length > 0) {
                setHistory(data.history);
                setError(null);
              } else {
                setError(err);
              }
            })
            .catch(() => setError(err))
            .finally(() => setLoading(false));
          return;
        }
        setError(err);
        setLoading(false);
      },
    );
    // Detach the listener on unmount.
    return unsubscribe;
  }, []);

  return { history, loading, error };
}
