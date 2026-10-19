"use client";

// Live list of groups from dummyRoom/groups. Read-only.
import { useEffect, useState } from "react";
import { DB_PATHS, isConfigured } from "@/lib/firebase";
import { subscribeToList } from "@/lib/rtdb";
import type { Group } from "@/types/models";

export function useGroups(): {
  groups: Group[];
  loading: boolean;
  error: Error | null;
} {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If Firebase is not configured (local development), load mock data immediately
    if (process.env.NODE_ENV === "development" && !isConfigured) {
      fetch("/mock-data.json")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data?.groups) && data.groups.length > 0) {
            setGroups(data.groups);
            setError(null);
          }
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false));
      return;
    }
    const unsubscribe = subscribeToList<Group>(
      DB_PATHS.groups,
      (items) => {
        setGroups(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        if (process.env.NODE_ENV === "development" && !isConfigured) {
          fetch("/mock-data.json")
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data?.groups) && data.groups.length > 0) {
                setGroups(data.groups);
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

  return { groups, loading, error };
}
