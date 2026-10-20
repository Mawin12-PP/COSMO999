"use client";

import { useEffect, useState } from "react";
import {
  endLiveSession,
  startLiveSession,
  subscribeToActiveSession,
} from "@/lib/session";
import type { LiveSession } from "@/types/session";

export function useLiveSession() {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToActiveSession((active) => {
      setSession(active);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    session,
    isLive: Boolean(session?.isActive),
    loading,
    startSession: startLiveSession,
    endSession: endLiveSession,
  };
}
