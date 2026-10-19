// Pure functions - derives personalized player titles from match history.
// Evaluates player performance per period and all-time.
// Strictly no emojis used in text or UI.
import { getPeriodOfTimestamp } from "@/lib/periods";
import { getRoundResult, toRawScore } from "@/lib/stats";
import type { HistoryEntry } from "@/types/models";

export interface PlayerPeriodStat {
  playerId: string;
  roundsPlayed: number;
  netScore: number;
  rawScore: number;
  wins: number;
  losses: number;
  zeros: number;
  winRate: number;
  bestRound: number;
  worstRound: number;
  highMultiplierWins: number;
  maxWinStreak: number;
  maxLoseStreak: number;
}

export type TitleIcon =
  | "Crown"
  | "PiggyBank"
  | "Target"
  | "Flame"
  | "Zap"
  | "Activity"
  | "Sparkles"
  | "Shield"
  | "ShieldAlert"
  | "Sun"
  | "Ghost";

export interface PersonalTitle {
  id: string;
  title: string;
  description: string;
  iconName: TitleIcon;
  tone: "accent" | "danger" | "success" | "muted";
}

export function computePeriodPlayerStats(
  history: HistoryEntry[],
  periodKey: string | "all",
): Record<string, PlayerPeriodStat> {
  const entries = history
    .filter((entry) => {
      if (periodKey === "all") return true;
      return getPeriodOfTimestamp(entry.timestamp).key === periodKey;
    })
    .sort((a, b) => Number(a.id) - Number(b.id));

  const statsMap: Record<string, PlayerPeriodStat> = {};
  const currentWinStreakMap: Record<string, number> = {};
  const currentLoseStreakMap: Record<string, number> = {};

  const ensureStat = (id: string): PlayerPeriodStat => {
    if (!statsMap[id]) {
      statsMap[id] = {
        playerId: id,
        roundsPlayed: 0,
        netScore: 0,
        rawScore: 0,
        wins: 0,
        losses: 0,
        zeros: 0,
        winRate: 0,
        bestRound: -Infinity,
        worstRound: Infinity,
        highMultiplierWins: 0,
        maxWinStreak: 0,
        maxLoseStreak: 0,
      };
      currentWinStreakMap[id] = 0;
      currentLoseStreakMap[id] = 0;
    }
    return statsMap[id];
  };

  for (const round of entries) {
    for (const [playerId, score] of Object.entries(round.playerScores)) {
      const stat = ensureStat(playerId);
      stat.roundsPlayed += 1;
      stat.netScore += score;
      stat.rawScore += toRawScore(score, round.multiplier);

      if (score > stat.bestRound) stat.bestRound = score;
      if (score < stat.worstRound) stat.worstRound = score;

      const result = getRoundResult(score, round.playerScores);
      if (result === "win") {
        stat.wins += 1;
        currentWinStreakMap[playerId] = (currentWinStreakMap[playerId] ?? 0) + 1;
        if (currentWinStreakMap[playerId] > stat.maxWinStreak) {
          stat.maxWinStreak = currentWinStreakMap[playerId];
        }
        currentLoseStreakMap[playerId] = 0;
        if (round.multiplier >= 20) {
          stat.highMultiplierWins += 1;
        }
      } else {
        currentWinStreakMap[playerId] = 0;
        if (result === "loss") {
          stat.losses += 1;
          currentLoseStreakMap[playerId] = (currentLoseStreakMap[playerId] ?? 0) + 1;
          if (currentLoseStreakMap[playerId] > stat.maxLoseStreak) {
            stat.maxLoseStreak = currentLoseStreakMap[playerId];
          }
        } else {
          stat.zeros += 1;
          currentLoseStreakMap[playerId] = 0;
        }
      }
    }
  }

  for (const stat of Object.values(statsMap)) {
    if (stat.bestRound === -Infinity) stat.bestRound = 0;
    if (stat.worstRound === Infinity) stat.worstRound = 0;
    stat.winRate =
      stat.roundsPlayed > 0 ? (stat.wins / stat.roundsPlayed) * 100 : 0;
  }

  return statsMap;
}

export interface PersonalTitleOptions {
  isAllTime?: boolean;
  championCount?: number;
  maxChampionCountInGroup?: number;
  maxBestRoundInGroup?: number;
  minWorstRoundInGroup?: number;
}

/**
 * Assigns a personalized title to a player based on performance and rank.
 * Strictly no emojis used in text or UI.
 */
export function getPersonalTitle(
  stat: PlayerPeriodStat | undefined,
  rank: number,
  totalRanked: number,
  maxRoundsInGroup?: number,
  options?: PersonalTitleOptions,
): PersonalTitle {
  const isAllTime = options?.isAllTime ?? false;
  const championCount = options?.championCount ?? 0;
  const maxChampionCountInGroup = options?.maxChampionCountInGroup ?? 0;
  const maxBestRoundInGroup = options?.maxBestRoundInGroup ?? 0;
  const minWorstRoundInGroup = options?.minWorstRoundInGroup ?? 0;

  // ผู้เล่นที่ยังไม่ได้ลงสนาม
  if (!stat || stat.roundsPlayed === 0) {
    return {
      id: "spectator",
      title: "รอดูเชิง",
      description: "ยังไม่ได้ลงสนาม นั่งสังเกตการณ์เพื่อนร่วมวง",
      iconName: "Ghost",
      tone: "muted",
    };
  }

  // 1. อันดับ 1: หัวตาราง (ตลอดกาล / งวด)
  if (isAllTime && rank === 1 && stat.netScore > 0) {
    return {
      id: "all_time_leader",
      title: "หัวตารางตลอดกาล",
      description: "คะแนนสะสมรวมสูงสุด ยืนหนึ่งยาวนาน",
      iconName: "Crown",
      tone: "accent",
    };
  }

  if (!isAllTime && rank === 1 && stat.netScore > 0) {
    return {
      id: "period_leader",
      title: "กินรอบวง",
      description: "อันดับหนึ่งประจำงวด แต้มนำโด่ง",
      iconName: "Crown",
      tone: "accent",
    };
  }

  // 2. ตู้โชว์ถ้วย (เฉพาะ all-time)
  if (isAllTime && championCount >= 2 && championCount === maxChampionCountInGroup) {
    return {
      id: "trophy_master",
      title: "ตู้โชว์ถ้วย",
      description: `กวาดแชมป์งวดไปครองเยอะสุด ${championCount} สมัย`,
      iconName: "Crown",
      tone: "accent",
    };
  }

  // 3. ท้ายตาราง: หมูแจกแต้ม (คนที่ได้น้อยสุดของอันดับ โดยไม่มีเงื่อนไขขั้นต่ำของจำนวนตา)
  if (isAllTime && totalRanked >= 2 && rank === totalRanked) {
    return {
      id: "all_time_sponsor",
      title: "หมูแจกแต้ม",
      description: "อันดับโหล่ตลอดกาล จ่ายแต้มให้เพื่อนเยอะสุด",
      iconName: "PiggyBank",
      tone: "danger",
    };
  }

  if (!isAllTime && totalRanked >= 2 && rank === totalRanked) {
    return {
      id: "period_last",
      title: "หมูแจกแต้ม",
      description: "อันดับโหล่ประจำงวด รับจบจ่ายรอบโต๊ะ",
      iconName: "PiggyBank",
      tone: "danger",
    };
  }

  // 4. สถิติตาเดียวสุดพีค: ดอกเดียวอิ่ม / ดอกเดียวจุก (ได้หรือเสียมากที่สุดของงวดนั้นๆ หรือ all time)
  if (maxBestRoundInGroup > 0 && stat.bestRound === maxBestRoundInGroup) {
    return {
      id: "best_round",
      title: "ดอกเดียวอิ่ม",
      description: isAllTime
        ? `ทำแต้มในตาเดียวสูงสุดตลอดกาล (+${stat.bestRound})`
        : `ทำแต้มในตาเดียวสูงสุดประจำงวด (+${stat.bestRound})`,
      iconName: "Sparkles",
      tone: "accent",
    };
  }

  if (minWorstRoundInGroup < 0 && stat.worstRound === minWorstRoundInGroup) {
    return {
      id: "worst_round",
      title: "ดอกเดียวจุก",
      description: isAllTime
        ? `เสียแต้มในตาเดียวหนักสุดตลอดกาล (${stat.worstRound})`
        : `เสียแต้มในตาเดียวหนักสุดประจำงวด (${stat.worstRound})`,
      iconName: "ShieldAlert",
      tone: "danger",
    };
  }

  // 5. สถิติจังหวะฝีมือ: ชนะรอบตัวคูณ x20 ขึ้นไป 5 รอบขึ้นไป
  if (stat.highMultiplierWins >= 5) {
    return {
      id: "high_multiplier",
      title: "สายคูณหนัก",
      description: `ชอบของแรง ชนะในรอบตัวคูณ x20 ขึ้นไปสะสม ${stat.highMultiplierWins} รอบ`,
      iconName: "Zap",
      tone: "accent",
    };
  }

  // 6. สถานะทั่วไปตามคะแนน: ทรงยังดี / ติดลบนิดหน่อย
  if (stat.netScore > 0) {
    return {
      id: "positive_score",
      title: "ทรงยังดี",
      description: `แต้มรวมสุทธิเป็นบวก (+${stat.netScore}) มีกำไรติดมือ`,
      iconName: "Sparkles",
      tone: "accent",
    };
  }

  if (stat.netScore < 0) {
    return {
      id: "negative_score",
      title: "ติดลบนิดหน่อย",
      description: `แต้มรวมติดลบ (${stat.netScore}) ยังพอแก้ตัวได้`,
      iconName: "PiggyBank",
      tone: "danger",
    };
  }

  return {
    id: "spectator",
    title: "รอดูเชิง",
    description: "ยังไม่ได้ลงสนาม นั่งสังเกตการณ์เพื่อนร่วมวง",
    iconName: "Ghost",
    tone: "muted",
  };
}
