import { onValue, ref, set } from "firebase/database";
import { database, DB_PATHS, isConfigured } from "./firebase";
import { aggregatePeriod } from "./leaderboard";
import { getCurrentPeriod } from "./periods";
import type { HistoryEntry, Player } from "@/types/models";
import type {
  FunAwardItem,
  LiveSession,
  LiveSessionChartPoint,
  SessionPlayerStanding,
} from "@/types/session";

const LOCAL_STORAGE_KEY = "cosmo999_active_session";

// In-memory reactive listeners for same-window / instant state propagation
const sessionListeners = new Set<(session: LiveSession | null) => void>();

function notifySubscribers(session: LiveSession | null): void {
  sessionListeners.forEach((listener) => {
    try {
      listener(session);
    } catch {
      // Ignore listener error
    }
  });
}

function getLocalSession(): LiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.isActive ? parsed : null;
  } catch {
    return null;
  }
}

function setLocalSession(session: LiveSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage write failures
  }
  notifySubscribers(session);
}

export async function startLiveSession(playerIds?: string[]): Promise<LiveSession> {
  const session: LiveSession = {
    id: `sess_${Date.now()}`,
    isActive: true,
    startTime: new Date().toISOString(),
    playerIds: playerIds ?? [],
  };

  setLocalSession(session);

  if (isConfigured) {
    try {
      const sessionRef = ref(database, `${DB_PATHS.root}/activeSession`);
      await set(sessionRef, session);
    } catch {
      // Offline fallback: already saved in localStorage
    }
  }

  return session;
}

export async function endLiveSession(): Promise<void> {
  setLocalSession(null);

  if (isConfigured) {
    try {
      const sessionRef = ref(database, `${DB_PATHS.root}/activeSession`);
      await set(sessionRef, {
        isActive: false,
        endTime: new Date().toISOString(),
      });
    } catch {
      // Ignore network errors on end
    }
  }
}

export async function updateSessionPlayerIds(
  session: LiveSession,
  playerIds: string[],
): Promise<LiveSession> {
  const updated: LiveSession = {
    ...session,
    playerIds,
  };
  setLocalSession(updated);

  if (isConfigured) {
    try {
      const sessionRef = ref(database, `${DB_PATHS.root}/activeSession`);
      await set(sessionRef, updated);
    } catch {
      // Offline fallback: already saved in localStorage
    }
  }

  return updated;
}

export function subscribeToActiveSession(
  callback: (session: LiveSession | null) => void,
): () => void {
  // Always register in-memory listener for synchronous same-tab reactivity
  sessionListeners.add(callback);

  // Initial local state
  const initial = getLocalSession();
  callback(initial);

  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_KEY) {
      callback(getLocalSession());
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  let unsubscribeRtdb: (() => void) | undefined;

  if (isConfigured) {
    const sessionRef = ref(database, `${DB_PATHS.root}/activeSession`);
    unsubscribeRtdb = onValue(
      sessionRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === "object" && val.isActive) {
          const live: LiveSession = {
            id: String(val.id || `sess_${Date.now()}`),
            isActive: Boolean(val.isActive),
            startTime: String(val.startTime || new Date().toISOString()),
            playerIds: Array.isArray(val.playerIds) ? val.playerIds : [],
            title: val.title ? String(val.title) : undefined,
          };
          setLocalSession(live);
        } else {
          setLocalSession(null);
        }
      },
      () => {
        // On error, fall back to local
        callback(getLocalSession());
      },
    );
  }

  return () => {
    sessionListeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
    if (unsubscribeRtdb) {
      unsubscribeRtdb();
    }
  };
}

export interface ComputedLiveSession {
  sessionRounds: HistoryEntry[];
  totalRounds: number;
  durationFormatted: string;
  avgSpeedFormatted: string;
  standings: SessionPlayerStanding[];
  chartData: LiveSessionChartPoint[];
  awards: FunAwardItem[];
  activePlayers: Player[];
}

export function computeLiveSessionStats(
  session: LiveSession,
  history: HistoryEntry[],
  allPlayers: Player[],
): ComputedLiveSession {
  const sessionStartMs = new Date(session.startTime).getTime();

  // Filter history rounds belonging exclusively to this session
  // Sort oldest to newest for chronological progress
  const sessionRounds = history
    .filter((entry) => entry.sessionId === session.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const totalRounds = sessionRounds.length;

  // Compute duration
  const nowMs = Date.now();
  const elapsedMs = Math.max(0, nowMs - sessionStartMs);
  const totalMinutes = Math.floor(elapsedMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const durationFormatted =
    hours > 0
      ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ชม.`
      : `${minutes} นาที`;

  // Compute speed (avg minutes per round)
  const avgSpeedFormatted =
    totalRounds > 0
      ? `${Math.max(1, Math.round(totalMinutes / totalRounds))} นาที/รอบ`
      : "-";

  // Compute Current Period Standings
  const currentPeriod = getCurrentPeriod();
  const periodScores = aggregatePeriod(history, currentPeriod.key);
  const periodRankSorted = Object.entries(periodScores).sort(([, a], [, b]) => b - a);
  const periodRankMap = new Map<string, { rank: number; score: number }>();
  periodRankSorted.forEach(([id, score], idx) => {
    periodRankMap.set(id, { rank: idx + 1, score });
  });

  // Calculate session scores and rounds played per player
  const sessionScores: Record<string, number> = {};
  const playerRoundsCount: Record<string, number> = {};
  const worstSingleRound: Record<string, number> = {};
  const bestSingleRound: Record<string, number> = {};

  // Track players who participated in this session or are in session.playerIds
  const participatingPlayerIds = new Set<string>(session.playerIds ?? []);

  for (const round of sessionRounds) {
    for (const [id, score] of Object.entries(round.playerScores ?? {})) {
      participatingPlayerIds.add(id);
      sessionScores[id] = (sessionScores[id] ?? 0) + score;
      playerRoundsCount[id] = (playerRoundsCount[id] ?? 0) + 1;

      if (worstSingleRound[id] === undefined || score < worstSingleRound[id]) {
        worstSingleRound[id] = score;
      }
      if (bestSingleRound[id] === undefined || score > bestSingleRound[id]) {
        bestSingleRound[id] = score;
      }
    }
  }

  // Active players object list
  const activePlayers = allPlayers.filter((p) => participatingPlayerIds.has(p.id));

  // Build standings list
  const standings: SessionPlayerStanding[] = activePlayers.map((player) => {
    const periodData = periodRankMap.get(player.id);
    return {
      player,
      sessionScore: sessionScores[player.id] ?? 0,
      periodRank: periodData?.rank ?? null,
      periodScore: periodData?.score ?? 0,
      roundsPlayed: playerRoundsCount[player.id] ?? 0,
    };
  });

  // Sort standings by session score descending
  standings.sort((a, b) => b.sessionScore - a.sessionScore);

  // Build Round-by-Round Chart Data (Individual net score per round, starts when player participates)
  const chartData: LiveSessionChartPoint[] = [];

  sessionRounds.forEach((round, idx) => {
    const point: LiveSessionChartPoint = {
      roundLabel: `รอบ ${idx + 1}`,
      roundIndex: idx + 1,
    };
    for (const player of activePlayers) {
      const roundScore = round.playerScores?.[player.id];
      if (roundScore !== undefined) {
        point[player.id] = roundScore;
      }
    }
    chartData.push(point);
  });

  // Compute Fun Awards (Clean, minimal, no emojis)
  const awards: FunAwardItem[] = [];

  if (standings.length >= 2 && totalRounds > 0) {
    // 1. จ่าฝูง (Leading score)
    const leader = standings[0];
    if (leader && leader.sessionScore > 0) {
      awards.push({
        id: "leader",
        title: "จ่าฝูง",
        playerName: leader.player.name,
        playerAvatar: leader.player,
        detail: `+${leader.sessionScore.toLocaleString()} แต้ม`,
      });
    }

    // 2. หมูแจกแต้ม (Lowest score)
    const sponsor = standings[standings.length - 1];
    if (sponsor && sponsor.sessionScore < 0) {
      awards.push({
        id: "sponsor",
        title: "หมูแจกแต้ม",
        playerName: sponsor.player.name,
        playerAvatar: sponsor.player,
        detail: `${sponsor.sessionScore.toLocaleString()} แต้ม`,
      });
    }

    // 3. แตกหนักสุด (Single round worst loss)
    let worstPlayerId: string | null = null;
    let worstScore = 0;
    for (const [id, score] of Object.entries(worstSingleRound)) {
      if (score < worstScore) {
        worstScore = score;
        worstPlayerId = id;
      }
    }
    if (worstPlayerId) {
      const p = allPlayers.find((pl) => pl.id === worstPlayerId);
      if (p) {
        awards.push({
          id: "biggest_loss",
          title: "แตกหนักสุด",
          playerName: p.name,
          playerAvatar: p,
          detail: `${worstScore.toLocaleString()} ในรอบเดียว`,
        });
      }
    }

    // 4. รอบกินเต็ม (Single round best win)
    let bestPlayerId: string | null = null;
    let bestScore = 0;
    for (const [id, score] of Object.entries(bestSingleRound)) {
      if (score > bestScore) {
        bestScore = score;
        bestPlayerId = id;
      }
    }
    if (bestPlayerId) {
      const p = allPlayers.find((pl) => pl.id === bestPlayerId);
      if (p) {
        awards.push({
          id: "biggest_win",
          title: "รอบกินเต็ม",
          playerName: p.name,
          playerAvatar: p,
          detail: `+${bestScore.toLocaleString()} ในรอบเดียว`,
        });
      }
    }

    // 5. สายประคอง (Closest score to 0, played >= 2 rounds)
    const candidates = standings.filter((s) => s.roundsPlayed >= 2);
    if (candidates.length > 0) {
      candidates.sort(
        (a, b) => Math.abs(a.sessionScore) - Math.abs(b.sessionScore),
      );
      const steady = candidates[0];
      if (steady) {
        awards.push({
          id: "steady",
          title: "สายประคอง",
          playerName: steady.player.name,
          playerAvatar: steady.player,
          detail:
            steady.sessionScore === 0
              ? "เสมอตัว 0 แต้ม"
              : `${steady.sessionScore > 0 ? "+" : ""}${steady.sessionScore.toLocaleString()} แต้ม`,
        });
      }
    }
  }

  return {
    sessionRounds,
    totalRounds,
    durationFormatted,
    avgSpeedFormatted,
    standings,
    chartData,
    awards,
    activePlayers,
  };
}
