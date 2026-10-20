"use client";

// Live list of match history from dummyRoom/history. Read-only.
import { useEffect, useState } from "react";
import { DB_PATHS, isConfigured } from "@/lib/firebase";
import {
  getLocalRoom,
  initializeLocalRoom,
  subscribeToLocalRoom,
} from "@/lib/localRoom";
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
    // If Firebase is not configured (local development), use reactive localStorage mock
    if (!isConfigured) {
      initializeLocalRoom()
        .then((room) => {
          const list = Object.values(room.history).sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
          setHistory(list);
          setError(null);
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false));

      const unsubscribe = subscribeToLocalRoom(() => {
        const room = getLocalRoom();
        if (room) {
          const list = Object.values(room.history).sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
          setHistory(list);
        }
      });
      return unsubscribe;
    }

    const unsubscribe = subscribeToList<HistoryEntry>(
      DB_PATHS.history,
      (items) => {
        setHistory(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    // Detach the listener on unmount.
    return unsubscribe;
  }, []);

  return { history, loading, error };
}
