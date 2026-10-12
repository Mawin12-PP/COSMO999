/* eslint-disable @typescript-eslint/no-unused-vars */
// Commentary generator - disabled to remove mocking and taunting texts.
import type { HistoryEntry, Player } from "@/types/models";

/**
 * Produces commentary for the round just played.
 * Returns empty string so no mocking commentary is generated.
 */
export function generateRoundCommentary(
  _netScores: Record<string, number>,
  _players: Player[],
  _priorHistory: HistoryEntry[],
): string {
  return "";
}
