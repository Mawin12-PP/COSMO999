// Atomic round save and mutation helpers. Ported from the legacy prototype's
// confirmAndSaveRound (reference/legacy-prototype.sanitized.html L889-993),
// undoMatch (L1044-1090), and recalculateScoresFromHistory (L1092-1122).
// Every write uses runTransaction on DB_PATHS.root so players / groups /
// history are always consistent and no write ever touches a hardcoded path.
import { ref, runTransaction } from "firebase/database";
import { database, DB_PATHS, isConfigured } from "./firebase";
import { initializeLocalRoom, normalizeRoom, setLocalRoom } from "./localRoom";
import { applyRoundEdit } from "./roundEdit";
import type { Group, HistoryEntry, Player, RoomData } from "@/types/models";

export { normalizeRoom };

export interface SaveRoundArgs {
  // Ids of the players in this round, in selection order (not sorted - the
  // group id/name below sort them the same way the legacy code does).
  playerIds: string[];
  // Net score per player id, from calculateRoundScores.
  netScores: Record<string, number>;
  multiplier: number;
  // Pre-computed by generateRoundCommentary; "" means no roast this round.
  commentary: string;
  sessionId?: string;
}

export interface SaveRoundResult {
  committed: boolean;
}

function applyRound(room: RoomData, args: SaveRoundArgs): RoomData {
  const { playerIds, netScores, multiplier, commentary, sessionId } = args;

  const players = [...room.players];
  for (const id of playerIds) {
    const net = netScores[id];
    const index = players.findIndex((player) => player.id === id);
    // Guard, matching legacy's `pIndex > -1`: a player removed from the
    // roster mid-round has nothing to add totals to, but the round is still
    // recorded in the group and history below.
    if (index > -1) {
      players[index] = {
        ...players[index],
        // `?? 0` matches legacy's `(safePlayers[pIndex].totalScore || 0)`: a
        // row read back from RTDB without this field would otherwise turn
        // the sum into NaN and Firebase would reject the whole write.
        totalScore: (players[index].totalScore ?? 0) + net,
        latestScore: net,
      };
    }
  }

  const groups = [...room.groups];
  const sortedIds = [...playerIds].sort();
  const groupId = sortedIds.join("_");
  let groupIndex = groups.findIndex((group) => group.id === groupId);

  if (groupIndex === -1) {
    const initialScores: Record<string, number> = {};
    for (const id of sortedIds) initialScores[id] = 0;
    const groupName = sortedIds
      .map((id) => players.find((player) => player.id === id)?.name ?? "ไม่ทราบชื่อ")
      .join(" + ");
    groups.push({ id: groupId, name: groupName, playerIds: sortedIds, scores: initialScores });
    groupIndex = groups.length - 1;
  }

  const group: Group = { ...groups[groupIndex], scores: { ...groups[groupIndex].scores } };
  for (const id of playerIds) {
    group.scores[id] = (group.scores[id] ?? 0) + netScores[id];
  }
  groups[groupIndex] = group;

  const matchId = Date.now().toString();
  const historyEntry: HistoryEntry = {
    id: matchId,
    timestamp: new Date().toISOString(),
    groupName: group.name,
    groupId,
    multiplier,
    playerScores: netScores,
    commentary,
    ...(sessionId ? { sessionId } : {}),
  };

  return {
    players,
    groups,
    history: { ...room.history, [matchId]: historyEntry },
  };
}

/**
 * Save one round: player totals, the group's running score, and a history
 * entry all update in a single transaction on DB_PATHS.root.
 * In local dev mode (!isConfigured), persists atomically to localStorage.
 */
export async function saveRound(args: SaveRoundArgs): Promise<SaveRoundResult> {
  if (!isConfigured) {
    try {
      const room = await initializeLocalRoom();
      const updated = applyRound(room, args);
      setLocalRoom(updated);
      return { committed: true };
    } catch {
      return { committed: false };
    }
  }

  try {
    const transactionPromise = runTransaction(
      ref(database, DB_PATHS.root),
      (currentData: unknown) => applyRound(normalizeRoom(currentData), args),
      { applyLocally: false },
    );
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout saving round")), 12000),
    );

    const result = (await Promise.race([
      transactionPromise,
      timeoutPromise,
    ])) as { committed: boolean };

    return { committed: result.committed };
  } catch {
    return { committed: false };
  }
}

/**
 * Undo one history entry: subtract the round's player scores from each
 * player's totalScore and from the group's scores, then delete the history
 * entry.
 * In local dev mode (!isConfigured), persists atomically to localStorage.
 */
export async function undoRound(matchId: string): Promise<SaveRoundResult> {
  if (!isConfigured) {
    try {
      const room = await initializeLocalRoom();
      const log = room.history[matchId];
      if (!log) return { committed: true };

      const players = [...room.players];
      const groups = [...room.groups];

      for (const [pId, scoreToRevert] of Object.entries(log.playerScores)) {
        const pIndex = players.findIndex((p) => p.id === pId);
        if (pIndex > -1) {
          players[pIndex] = {
            ...players[pIndex],
            totalScore: (players[pIndex].totalScore ?? 0) - scoreToRevert,
          };
        }

        const gIndex = groups.findIndex((g) => g.id === log.groupId);
        if (gIndex > -1 && groups[gIndex].scores) {
          const updatedGroup: Group = {
            ...groups[gIndex],
            scores: { ...groups[gIndex].scores },
          };
          updatedGroup.scores[pId] = (updatedGroup.scores[pId] ?? 0) - scoreToRevert;
          groups[gIndex] = updatedGroup;
        }
      }

      const newHistory = { ...room.history };
      delete newHistory[matchId];

      setLocalRoom({ players, groups, history: newHistory });
      return { committed: true };
    } catch {
      return { committed: false };
    }
  }

  try {
    const transactionPromise = runTransaction(
      ref(database, DB_PATHS.root),
      (currentData: unknown) => {
        if (currentData === null || typeof currentData !== "object") {
          return currentData;
        }
        const raw = currentData as Record<string, unknown>;
        const rawHistory = raw.history;
        if (
          rawHistory === null ||
          typeof rawHistory !== "object" ||
          !(matchId in (rawHistory as Record<string, unknown>))
        ) {
          return currentData;
        }

        const room = normalizeRoom(currentData);
        const log = room.history[matchId];

        const players = [...room.players];
        const groups = [...room.groups];

        for (const [pId, scoreToRevert] of Object.entries(log.playerScores)) {
          const pIndex = players.findIndex((p) => p.id === pId);
          if (pIndex > -1) {
            players[pIndex] = {
              ...players[pIndex],
              totalScore: (players[pIndex].totalScore ?? 0) - scoreToRevert,
            };
          }

          const gIndex = groups.findIndex((g) => g.id === log.groupId);
          if (gIndex > -1 && groups[gIndex].scores) {
            const updatedGroup: Group = {
              ...groups[gIndex],
              scores: { ...groups[gIndex].scores },
            };
            updatedGroup.scores[pId] = (updatedGroup.scores[pId] ?? 0) - scoreToRevert;
            groups[gIndex] = updatedGroup;
          }
        }

        const newHistory = { ...room.history };
        delete newHistory[matchId];

        return { players, groups, history: newHistory };
      },
      { applyLocally: false },
    );
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout undoing round")), 12000),
    );

    const result = (await Promise.race([
      transactionPromise,
      timeoutPromise,
    ])) as { committed: boolean };

    return { committed: result.committed };
  } catch {
    return { committed: false };
  }
}

/**
 * Edit one history entry's scores / multiplier in a single transaction,
 * keeping player totals and group scores consistent (see applyRoundEdit).
 * In local dev mode (!isConfigured), persists atomically to localStorage.
 */
export async function editRound(
  matchId: string,
  netScores: Record<string, number>,
  multiplier: number,
  commentary: string,
): Promise<SaveRoundResult> {
  if (!isConfigured) {
    try {
      const room = await initializeLocalRoom();
      if (!room.history[matchId]) return { committed: false };
      setLocalRoom(applyRoundEdit(room, matchId, netScores, multiplier, commentary));
      return { committed: true };
    } catch {
      return { committed: false };
    }
  }

  try {
    const transactionPromise = runTransaction(
      ref(database, DB_PATHS.root),
      (currentData: unknown) => {
        if (currentData === null || typeof currentData !== "object") {
          return currentData;
        }
        const room = normalizeRoom(currentData);
        if (!room.history[matchId]) return currentData;
        return applyRoundEdit(room, matchId, netScores, multiplier, commentary);
      },
      { applyLocally: false },
    );
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout editing round")), 12000),
    );

    const result = (await Promise.race([
      transactionPromise,
      timeoutPromise,
    ])) as { committed: boolean };

    return { committed: result.committed };
  } catch {
    return { committed: false };
  }
}

/**
 * Recalculate all player and group scores from scratch by replaying every history entry.
 */
export async function recalculateScores(): Promise<SaveRoundResult> {
  if (!isConfigured) {
    try {
      const room = await initializeLocalRoom();
      const players: Player[] = room.players.map((p) => ({
        ...p,
        totalScore: 0,
        latestScore: null,
      }));

      const groups: Group[] = room.groups.map((g) => {
        const zeroed: Record<string, number> = {};
        for (const key of Object.keys(g.scores)) zeroed[key] = 0;
        return { ...g, scores: zeroed };
      });

      for (const log of Object.values(room.history)) {
        for (const [pId, score] of Object.entries(log.playerScores)) {
          const pIndex = players.findIndex((p) => p.id === pId);
          if (pIndex > -1) {
            players[pIndex] = {
              ...players[pIndex],
              totalScore: (players[pIndex].totalScore ?? 0) + score,
            };
          }

          const gIndex = groups.findIndex((g) => g.id === log.groupId);
          if (gIndex > -1) {
            const updatedGroup: Group = {
              ...groups[gIndex],
              scores: { ...groups[gIndex].scores },
            };
            updatedGroup.scores[pId] = (updatedGroup.scores[pId] ?? 0) + score;
            groups[gIndex] = updatedGroup;
          }
        }
      }

      setLocalRoom({ players, groups, history: room.history });
      return { committed: true };
    } catch {
      return { committed: false };
    }
  }

  try {
    const result = await runTransaction(
      ref(database, DB_PATHS.root),
      (currentData: unknown) => {
        const room = normalizeRoom(currentData);

        // Zero out every player's running totals before replaying history.
        const players: Player[] = room.players.map((p) => ({
          ...p,
          totalScore: 0,
          latestScore: null,
        }));

        // Zero out every group's per-player score buckets before replaying.
        const groups: Group[] = room.groups.map((g) => {
          const zeroed: Record<string, number> = {};
          for (const key of Object.keys(g.scores)) zeroed[key] = 0;
          return { ...g, scores: zeroed };
        });

        // Replay every history entry in insertion order
        for (const log of Object.values(room.history)) {
          for (const [pId, score] of Object.entries(log.playerScores)) {
            const pIndex = players.findIndex((p) => p.id === pId);
            if (pIndex > -1) {
              players[pIndex] = {
                ...players[pIndex],
                totalScore: (players[pIndex].totalScore ?? 0) + score,
              };
            }

            const gIndex = groups.findIndex((g) => g.id === log.groupId);
            if (gIndex > -1) {
              const updatedGroup: Group = {
                ...groups[gIndex],
                scores: { ...groups[gIndex].scores },
              };
              updatedGroup.scores[pId] = (updatedGroup.scores[pId] ?? 0) + score;
              groups[gIndex] = updatedGroup;
            }
          }
        }

        return { players, groups, history: room.history };
      },
      { applyLocally: false },
    );
    return { committed: result.committed };
  } catch {
    return { committed: false };
  }
}
