"use client";

// Live list of groups from dummyRoom/groups. Read-only.
import { useEffect, useState } from "react";
import { DB_PATHS, isConfigured } from "@/lib/firebase";
import {
  getLocalRoom,
  initializeLocalRoom,
  subscribeToLocalRoom,
} from "@/lib/localRoom";
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
    // If Firebase is not configured (local development), use reactive localStorage mock
    if (!isConfigured) {
      initializeLocalRoom()
        .then((room) => {
          setGroups(room.groups);
          setError(null);
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false));

      const unsubscribe = subscribeToLocalRoom(() => {
        const room = getLocalRoom();
        if (room) {
          setGroups(room.groups);
        }
      });
      return unsubscribe;
    }

    const unsubscribe = subscribeToList<Group>(
      DB_PATHS.groups,
      (items) => {
        setGroups(items);
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

  return { groups, loading, error };
}
