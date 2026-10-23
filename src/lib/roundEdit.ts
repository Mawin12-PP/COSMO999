// Pure edit of one saved round. No Firebase here so it can be unit tested;
// rounds.ts wraps it in the same transaction / localStorage path as save and undo.
import type { Group, HistoryEntry, RoomData } from "@/types/models";

/**
 * Replace a saved round's scores and multiplier. The old round is subtracted
 * from each player's total and the group's scores, then the new one is added,
 * so totals stay equal to a full replay of history. The round keeps its id and
 * timestamp. latestScore is only touched when the edited round is the newest.
 * Returns the room unchanged if the round does not exist.
 */
export function applyRoundEdit(
  room: RoomData,
  matchId: string,
  netScores: Record<string, number>,
  multiplier: number,
  commentary: string,
): RoomData {
  const log = room.history[matchId];
  if (!log) return room;

  const isNewest = Object.keys(room.history).every((id) => id <= matchId);

  const players = [...room.players];
  const groups = [...room.groups];
  const gIndex = groups.findIndex((g) => g.id === log.groupId);
  const group: Group | null =
    gIndex > -1 ? { ...groups[gIndex], scores: { ...groups[gIndex].scores } } : null;

  for (const [pId, oldScore] of Object.entries(log.playerScores)) {
    const pIndex = players.findIndex((p) => p.id === pId);
    if (pIndex > -1) {
      players[pIndex] = {
        ...players[pIndex],
        totalScore: (players[pIndex].totalScore ?? 0) - oldScore,
      };
    }
    if (group) group.scores[pId] = (group.scores[pId] ?? 0) - oldScore;
  }

  for (const [pId, newScore] of Object.entries(netScores)) {
    const pIndex = players.findIndex((p) => p.id === pId);
    if (pIndex > -1) {
      players[pIndex] = {
        ...players[pIndex],
        totalScore: (players[pIndex].totalScore ?? 0) + newScore,
        ...(isNewest ? { latestScore: newScore } : {}),
      };
    }
    if (group) group.scores[pId] = (group.scores[pId] ?? 0) + newScore;
  }

  if (group) groups[gIndex] = group;

  const updated: HistoryEntry = {
    ...log,
    multiplier,
    playerScores: netScores,
    commentary,
  };

  return { players, groups, history: { ...room.history, [matchId]: updated } };
}
