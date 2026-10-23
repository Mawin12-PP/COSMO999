"use client";

import { useEffect, useState } from "react";
import {
  endLiveSession,
  startLiveSession,
  subscribeToActiveSession,
} from "@/lib/session";
import type { LiveSession } from "@/types/session";

export function useLiveSession(enabled: boolean = true) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    // Feature switched off: do not subscribe to the live session node at all.
    if (!enabled) return;

    const unsubscribe = subscribeToActiveSession((active) => {
      setSession(active);
      setLoading(false);
    });

    return unsubscribe;
  }, [enabled]);

  return {
    session,
    isLive: Boolean(session?.isActive),
    loading,
    startSession: startLiveSession,
    endSession: endLiveSession,
  };
}
