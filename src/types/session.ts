import type { Player } from "@/types/models";

export interface LiveSession {
  id: string;
  isActive: boolean;
  startTime: string; // ISO 8601 string
  endTime?: string | null;
  playerIds?: string[];
  title?: string;
}

export interface SessionPlayerStanding {
  player: Player;
  sessionScore: number;
  periodRank: number | null;
  periodScore: number;
  roundsPlayed: number;
}

export interface FunAwardItem {
  id: "leader" | "sponsor" | "biggest_loss" | "biggest_win" | "steady";
  title: string;
  playerName: string;
  playerAvatar: Player;
  detail: string;
}

export interface LiveSessionChartPoint {
  roundLabel: string;
  roundIndex: number;
  [playerId: string]: number | string | null | undefined;
}
