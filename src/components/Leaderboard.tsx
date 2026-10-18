"use client";

// Real-time leaderboard: top-3 podium (Kahoot-style), a roast callout for
// the lowest scorer, and an iOS Grouped List for everyone else.
// Mobile-first iOS guidelines: min 44px touch targets on tabs and controls,
// active:scale-95 feedback, and iOS Grouped List.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CalendarX,
  Crown,
  Medal,
  PiggyBank,
  Shield,
  ShieldAlert,
  Spade,
  Sparkles,
  Sun,
  Target,
  TriangleAlert,
  Trophy,
  Users,
  Flame,
  Banknote,
  Ghost,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { HallOfFameCard } from "@/components/HallOfFameCard";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { usePlayers } from "@/hooks/usePlayers";
import { useHistory } from "@/hooks/useHistory";
import { getHallOfFame, getTrophyCounts, type PeriodResult } from "@/lib/honors";
import { aggregatePeriod } from "@/lib/leaderboard";
import { getCurrentPeriod, listPeriodsInHistory } from "@/lib/periods";
import {
  computePeriodPlayerStats,
  getPersonalTitle,
  type PersonalTitle,
  type TitleIcon,
} from "@/lib/titles";
import type { Player } from "@/types/models";

const PULSE_DURATION_MS = 520;

function scoreTone(score: number): string {
  if (score > 0) return "text-[#34C759]";
  if (score < 0) return "text-[#FF3B30]";
  return "text-[#8E8E93]";
}

function formatSigned(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

function usePulseOnChange(
  scores: Record<string, number>,
  viewKey: string,
): Set<string> {
  const prevScoresRef = useRef<Record<string, number>>({});
  const prevViewKeyRef = useRef<string>(viewKey);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [pulsingIds, setPulsingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const viewChanged = prevViewKeyRef.current !== viewKey;
    prevViewKeyRef.current = viewKey;

    if (!viewChanged) {
      const previous = prevScoresRef.current;
      const changedIds = Object.keys(scores).filter((id) => {
        const before = previous[id];
        return before !== undefined && before !== scores[id];
      });

      if (changedIds.length > 0) {
        setPulsingIds((current) => new Set([...current, ...changedIds]));
        for (const id of changedIds) {
          clearTimeout(timersRef.current[id]);
          timersRef.current[id] = setTimeout(() => {
            setPulsingIds((current) => {
              const next = new Set(current);
              next.delete(id);
              return next;
            });
          }, PULSE_DURATION_MS);
        }
      }
    }

    prevScoresRef.current = scores;
  }, [scores, viewKey]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of Object.values(timers)) clearTimeout(timer);
    };
  }, []);

  return pulsingIds;
}

function LatestScoreLabel({ latestScore }: { latestScore: number | null }) {
  if (latestScore == null) {
    return (
      <p className="text-xs text-[#8E8E93]">รอบล่าสุด ยังไม่ได้เล่น</p>
    );
  }
  return (
    <p className="text-xs text-[#8E8E93]">
      รอบล่าสุด{" "}
      <span className={`font-semibold ${scoreTone(latestScore)}`}>
        {formatSigned(latestScore)}
      </span>
    </p>
  );
}

function TrophyBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="flex shrink-0 items-center gap-1 rounded-full bg-blue-50/80 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-[#007AFF]"
      aria-label={`เป็นเซียนไพ่ประจำงวดสะสม ${count} ครั้ง`}
    >
      <Crown className="size-3 fill-current" aria-hidden /> x{count}
    </span>
  );
}

const TITLE_ICON_MAP: Record<TitleIcon, React.ComponentType<{ className?: string }>> = {
  Crown,
  PiggyBank,
  Target,
  Flame,
  Zap,
  Activity,
  Sparkles,
  Shield,
  ShieldAlert,
  Sun,
  Ghost,
};

function PersonalTitleBadge({
  title,
  className = "",
}: {
  title: PersonalTitle;
  className?: string;
}) {
  const Icon = TITLE_ICON_MAP[title.iconName] ?? Sparkles;
  const toneClasses = {
    accent: "bg-blue-50/80 border border-blue-500/20 text-[#007AFF]",
    danger: "bg-red-50/80 border border-red-500/20 text-[#FF3B30]",
    success: "bg-green-50/80 border border-green-500/20 text-[#34C759]",
    muted: "bg-black/[0.04] text-[#8E8E93]",
  }[title.tone];

  return (
    <span
      title={title.description}
      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold leading-tight ${toneClasses} ${className}`}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      <span>{title.title}</span>
    </span>
  );
}

const PODIUM_STYLE: Record<
  1 | 2 | 3,
  { pedestal: string; height: string; avatar: string; ring: string }
> = {
  1: {
    pedestal: "bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] shadow-md shadow-blue-500/20",
    height: "h-28 sm:h-36",
    avatar: "size-20 text-2xl sm:size-24",
    ring: "ring-4 ring-blue-500/20 shadow-xs",
  },
  2: {
    pedestal: "bg-gradient-to-b from-[#A0A0A5] to-[#8E8E93] shadow-sm",
    height: "h-20 sm:h-24",
    avatar: "size-16 text-xl sm:size-20",
    ring: "ring-2 ring-gray-300 shadow-xs",
  },
  3: {
    pedestal: "bg-gradient-to-b from-[#D4A366] to-[#B38344] shadow-sm",
    height: "h-16 sm:h-20",
    avatar: "size-16 text-xl sm:size-20",
    ring: "ring-2 ring-amber-300 shadow-xs",
  },
};

function PodiumCard({
  rank,
  player,
  score,
  championCount,
  personalTitle,
  showLatestScore,
  pulsing,
}: {
  rank: 1 | 2 | 3;
  player: Player;
  score: number;
  championCount: number;
  personalTitle: PersonalTitle;
  showLatestScore: boolean;
  pulsing: boolean;
}) {
  const style = PODIUM_STYLE[rank];
  return (
    <div
      className="reveal flex w-24 flex-col items-center gap-2 sm:w-28"
      style={{ animationDelay: `${(rank - 1) * 100}ms` }}
    >
      <div className="flex flex-col items-center gap-1 relative">
        {rank === 1 ? (
          <Crown className="size-6 text-[#007AFF] fill-[#007AFF] drop-shadow-sm" />
        ) : (
          <span className="h-6" aria-hidden />
        )}
        <span className={`rounded-full ${style.ring}`}>
          <PlayerAvatar player={player} className={style.avatar} />
        </span>
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <p className="w-full truncate text-center text-sm font-semibold tracking-tight text-[#1C1C1E] sm:text-base">
          {player.name}
        </p>
        <TrophyBadge count={championCount} />
        <PersonalTitleBadge title={personalTitle} className="text-center" />
      </div>
      <AnimatedNumber
        value={score}
        className={`text-lg font-bold tabular-nums sm:text-xl ${scoreTone(score)}`}
      />
      {showLatestScore ? (
        <LatestScoreLabel latestScore={player.latestScore} />
      ) : null}

      <div
        className={`flex w-full items-center justify-center rounded-t-2xl shadow-sm ${style.pedestal} ${style.height} ${pulsing ? "pulse-highlight" : ""}`}
      >
        <span className="text-2xl font-black text-white">{rank}</span>
      </div>
    </div>
  );
}

function Podium({
  entries,
  pulsingIds,
  showLatestScore,
}: {
  entries: Array<{
    player: Player;
    score: number;
    championCount: number;
    personalTitle: PersonalTitle;
  }>;
  pulsingIds: Set<string>;
  showLatestScore: boolean;
}) {
  const slots: Array<1 | 2 | 3> = [2, 1, 3];
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6 pt-3 pb-1">
      {slots.map((rank) => {
        const entry = entries[rank - 1];
        if (!entry) return null;
        return (
          <PodiumCard
            key={entry.player.id}
            rank={rank}
            player={entry.player}
            score={entry.score}
            championCount={entry.championCount}
            personalTitle={entry.personalTitle}
            showLatestScore={showLatestScore}
            pulsing={pulsingIds.has(entry.player.id)}
          />
        );
      })}
    </div>
  );
}

function RoastCallout({
  player,
  score,
  pulsing,
}: {
  player: Player;
  score: number;
  pulsing: boolean;
}) {
  return (
    <div
      className={`reveal flex items-center gap-3.5 rounded-3xl border border-red-200/80 bg-white/80 backdrop-blur-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${pulsing ? "pulse-highlight" : ""}`}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red-50 text-[#FF3B30] shadow-2xs">
        <Banknote className="size-5" />
      </span>
      <PlayerAvatar player={player} className="size-11 text-lg shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-[#FF3B30]">
          หมูแจกแต้ม
        </p>
        <p className="truncate font-bold text-[#1C1C1E]">{player.name}</p>
      </div>
      <AnimatedNumber
        value={score}
        className={`text-lg font-bold tabular-nums ${scoreTone(score)}`}
      />
    </div>
  );
}

function LeaderboardRow({
  player,
  score,
  championCount,
  rank,
  personalTitle,
  showLatestScore,
  pulsing,
}: {
  player: Player;
  score: number;
  championCount: number;
  rank: number;
  personalTitle: PersonalTitle;
  showLatestScore: boolean;
  pulsing: boolean;
}) {
  return (
    <div
      className={`flex min-h-[56px] items-center gap-3.5 p-3.5 sm:px-4 sm:py-3 transition-colors hover:bg-black/[0.02] active:bg-black/[0.04] ${pulsing ? "pulse-highlight" : ""}`}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-black/[0.04] text-xs font-bold text-[#8E8E93]">
        {rank}
      </span>
      <PlayerAvatar player={player} className="size-10 text-base shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="truncate font-semibold text-[#1C1C1E]">{player.name}</p>
          <TrophyBadge count={championCount} />
          <PersonalTitleBadge title={personalTitle} />
        </div>
        {showLatestScore ? (
          <LatestScoreLabel latestScore={player.latestScore} />
        ) : null}
      </div>
      <AnimatedNumber
        value={score}
        className={`text-base font-bold tabular-nums ${scoreTone(score)}`}
      />
    </div>
  );
}

function StateMessage({
  icon: Icon,
  title,
  description,
  tone = "accent",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "accent" | "danger";
}) {
  return (
    <div className="reveal flex min-h-[45dvh] flex-col items-center justify-center gap-4 rounded-3xl border border-black/[0.04] bg-white/80 backdrop-blur-2xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <span
        className={`grid size-16 place-items-center rounded-full ${
          tone === "danger"
            ? "bg-red-50 text-[#FF3B30]"
            : "bg-blue-50 text-[#007AFF]"
        }`}
      >
        <Icon className="size-8" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-[#1C1C1E]">{title}</h2>
        <p className="mx-auto max-w-xs text-sm text-[#8E8E93]">
          {description}
        </p>
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="reveal flex flex-col gap-6">
      <p className="text-sm text-[#8E8E93]">กำลังโหลดอันดับ...</p>
      <div className="flex items-end justify-center gap-3 sm:gap-5">
        {([2, 1, 3] as const).map((rank) => (
          <div key={rank} className="flex w-24 flex-col items-center gap-2 sm:w-28">
            <div className="size-16 animate-pulse rounded-full bg-black/[0.06] sm:size-20" />
            <div className="h-3 w-16 animate-pulse rounded-full bg-black/[0.06]" />
            <div
              className={`w-full animate-pulse rounded-t-2xl bg-black/[0.06] ${PODIUM_STYLE[rank].height}`}
            />
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-black/[0.04] bg-white/80 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden divide-y divide-black/[0.04]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse bg-black/[0.02]" />
        ))}
      </div>
    </div>
  );
}

function ViewSwitcher({
  viewKey,
  onChange,
  currentPeriodKey,
  pastPeriods,
}: {
  viewKey: string;
  onChange: (key: string) => void;
  currentPeriodKey: string;
  pastPeriods: Array<{ key: string; label: string }>;
}) {
  const isPastPeriodActive =
    viewKey !== "all" && viewKey !== currentPeriodKey;

  return (
    <div className="reveal flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex w-fit gap-1 rounded-full bg-black/[0.06] p-1 shadow-2xs">
        <button
          type="button"
          aria-pressed={viewKey === currentPeriodKey}
          onClick={() => onChange(currentPeriodKey)}
          className={`flex min-h-[44px] items-center rounded-full px-5 py-2 text-sm font-semibold transition-all active:scale-95 ${
            viewKey === currentPeriodKey
              ? "bg-white text-[#1C1C1E] shadow-sm"
              : "text-[#8E8E93] hover:text-[#1C1C1E]"
          }`}
        >
          งวดนี้
        </button>
        <button
          type="button"
          aria-pressed={viewKey === "all"}
          onClick={() => onChange("all")}
          className={`flex min-h-[44px] items-center rounded-full px-5 py-2 text-sm font-semibold transition-all active:scale-95 ${
            viewKey === "all"
              ? "bg-white text-[#1C1C1E] shadow-sm"
              : "text-[#8E8E93] hover:text-[#1C1C1E]"
          }`}
        >
          ตลอดกาล
        </button>
      </div>

      {pastPeriods.length > 0 ? (
        <select
          aria-label="ดูงวดย้อนหลัง"
          value={isPastPeriodActive ? viewKey : ""}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          className="min-h-[44px] rounded-full border border-black/[0.06] bg-white px-5 py-2 text-sm font-semibold text-[#1C1C1E] shadow-xs focus:border-[#007AFF] focus:outline-none"
        >
          <option value="">ดูงวดย้อนหลัง...</option>
          {pastPeriods.map((period) => (
            <option key={period.key} value={period.key}>
              {period.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

type LeaderboardTab = "ranking" | "hall-of-fame";

function TabSwitcher({
  activeTab,
  onChange,
}: {
  activeTab: LeaderboardTab;
  onChange: (tab: LeaderboardTab) => void;
}) {
  const tabs: Array<{ key: LeaderboardTab; label: string; icon: LucideIcon }> = [
    { key: "ranking", label: "อันดับ", icon: Trophy },
    { key: "hall-of-fame", label: "ทำเนียบเกียรติยศ", icon: Medal },
  ];

  return (
    <div className="reveal inline-flex w-full gap-1 rounded-full bg-black/[0.06] p-1 shadow-2xs sm:w-fit">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          aria-pressed={activeTab === key}
          onClick={() => onChange(key)}
          className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 sm:flex-none ${
            activeTab === key
              ? "bg-white text-[#1C1C1E] shadow-sm"
              : "text-[#8E8E93] hover:text-[#1C1C1E]"
          }`}
        >
          <Icon className="size-4.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

function HallOfFame({
  results,
  players,
}: {
  results: PeriodResult[];
  players: Player[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="reveal">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1E] sm:text-3xl">
          ทำเนียบเกียรติยศ
        </h1>
        <p className="mt-1 text-sm text-[#8E8E93]">
          แชมป์และอันดับสุดท้ายประจำแต่ละงวดที่จบแล้ว เรียงจากล่าสุด
        </p>
      </header>

      {results.length === 0 ? (
        <StateMessage
          icon={Medal}
          title="ยังไม่มีงวดที่จบ"
          description="รอให้งวดปัจจุบันจบก่อน แล้วทำเนียบเกียรติยศจะแสดงที่นี่"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((result, index) => (
            <HallOfFameCard
              key={result.period.key}
              result={result}
              players={players}
              delayMs={index * 60}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export function Leaderboard() {
  const { players, loading: playersLoading, error: playersError } = usePlayers();
  const { history, loading: historyLoading, error: historyError } = useHistory();
  const loading = playersLoading || historyLoading;
  const error = playersError ?? historyError;

  const [activeTab, setActiveTab] = useState<LeaderboardTab>("ranking");
  const [viewKey, setViewKey] = useState<string>(() => getCurrentPeriod().key);
  const currentPeriod = getCurrentPeriod();

  const periodsInHistory = useMemo(
    () => listPeriodsInHistory(history),
    [history],
  );
  const pastPeriods = periodsInHistory.filter(
    (period) => period.key !== currentPeriod.key,
  );
  const selectablePeriods = periodsInHistory.some(
    (period) => period.key === currentPeriod.key,
  )
    ? periodsInHistory
    : [currentPeriod, ...periodsInHistory];
  const activePeriod =
    selectablePeriods.find((period) => period.key === viewKey) ?? null;

  const scores = useMemo(
    () => aggregatePeriod(history, viewKey),
    [history, viewKey],
  );
  const visiblePlayers = useMemo(
    () =>
      viewKey === "all"
        ? players
        : players.filter((player) => scores[player.id] !== undefined),
    [players, scores, viewKey],
  );
  const isViewEmpty =
    viewKey === "all"
      ? Object.keys(scores).length === 0
      : visiblePlayers.length === 0;
  const trophyCounts = useMemo(() => getTrophyCounts(history), [history]);
  const hallOfFame = useMemo(() => getHallOfFame(history), [history]);
  const periodStats = useMemo(
    () => computePeriodPlayerStats(history, viewKey),
    [history, viewKey],
  );

  const pulsingIds = usePulseOnChange(scores, viewKey);

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  if (error) {
    return (
      <StateMessage
        icon={TriangleAlert}
        title="เชื่อมต่อกระดานคะแนนไม่ได้"
        description="หลุดการเชื่อมต่อกับฐานข้อมูล ลองรีเฟรชหน้าใหม่อีกครั้ง"
        tone="danger"
      />
    );
  }

  if (players.length === 0) {
    return (
      <StateMessage
        icon={Users}
        title="ยังไม่มีผู้เล่น"
        description="ไปเพิ่มผู้เล่นที่หน้าเล่นก่อน แล้วอันดับจะขึ้นตรงนี้"
      />
    );
  }

  const tabSwitcher = (
    <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />
  );

  if (activeTab === "hall-of-fame") {
    return (
      <div className="flex flex-col gap-6">
        {tabSwitcher}
        <HallOfFame results={hallOfFame} players={players} />
      </div>
    );
  }

  const viewSwitcher = (
    <ViewSwitcher
      viewKey={viewKey}
      onChange={setViewKey}
      currentPeriodKey={currentPeriod.key}
      pastPeriods={pastPeriods}
    />
  );

  if (isViewEmpty) {
    return (
      <div className="flex flex-col gap-6">
        {tabSwitcher}
        <header className="reveal">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1E] sm:text-3xl">
            อันดับ
          </h1>
        </header>
        {viewSwitcher}
        {viewKey === "all" || history.length === 0 ? (
          <StateMessage
            icon={Spade}
            title="ยังไม่มีใครลงมือเล่น"
            description="เริ่มรอบแรกกันเลย พอมีคะแนนแล้วอันดับจะเรียงให้อัตโนมัติ"
          />
        ) : (
          <StateMessage
            icon={CalendarX}
            title="ไม่พบรอบในงวดที่เลือก"
            description={`ยังไม่มีการบันทึกคะแนนในช่วง ${activePeriod?.label ?? ""} ลองดูงวดอื่นหรือสลับไปดูตลอดกาล`}
          />
        )}
      </div>
    );
  }

  const showLatestScore = viewKey === "all";
  const roundsList = Object.values(periodStats).map((s) => s.roundsPlayed);
  const maxRoundsInGroup = roundsList.length > 0 ? Math.max(...roundsList) : 0;
  const isAllTime = viewKey === "all";
  const trophyCountsValues = Object.values(trophyCounts).map((t) => t.championCount);
  const maxChampionCountInGroup =
    trophyCountsValues.length > 0 ? Math.max(...trophyCountsValues) : 0;

  const preScored = visiblePlayers.map((player) => ({
    player,
    score: scores[player.id] ?? 0,
    championCount: trophyCounts[player.id]?.championCount ?? 0,
  }));
  const sorted = [...preScored].sort((a, b) => b.score - a.score);
  const totalRanked = sorted.length;

  const scoredWithTitles = sorted.map((entry, index) => {
    const rank = index + 1;
    const personalTitle = getPersonalTitle(
      periodStats[entry.player.id],
      rank,
      totalRanked,
      maxRoundsInGroup,
      {
        isAllTime,
        championCount: entry.championCount,
        maxChampionCountInGroup,
      },
    );
    return {
      ...entry,
      rank,
      personalTitle,
    };
  });

  const podiumEntries = scoredWithTitles.slice(0, 3);
  const restEntries = scoredWithTitles.slice(3);
  const lowestEntry = scoredWithTitles[scoredWithTitles.length - 1];
  const showRoast = scoredWithTitles.length >= 2;

  return (
    <div className="flex flex-col gap-6">
      {tabSwitcher}
      <header className="reveal">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1E] sm:text-3xl">
          อันดับ
        </h1>
        <p className="mt-1 text-sm text-[#8E8E93]">
          {viewKey === "all"
            ? "จัดอันดับสายไพ่ประจำวง เรียงจากคะแนนรวมมากไปน้อย"
            : `งวด ${activePeriod?.label ?? ""}`}
        </p>
      </header>

      {viewSwitcher}

      <Podium
        entries={podiumEntries}
        pulsingIds={pulsingIds}
        showLatestScore={showLatestScore}
      />

      {showRoast ? (
        <RoastCallout
          player={lowestEntry.player}
          score={lowestEntry.score}
          pulsing={pulsingIds.has(lowestEntry.player.id)}
        />
      ) : null}

      {restEntries.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] px-1">
            อันดับอื่น ๆ
          </h2>
          <div className="rounded-3xl border border-black/[0.04] bg-white/80 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden divide-y divide-black/[0.04]">
            {restEntries.map((entry, index) => (
              <LeaderboardRow
                key={entry.player.id}
                player={entry.player}
                score={entry.score}
                championCount={entry.championCount}
                rank={index + 4}
                personalTitle={entry.personalTitle}
                showLatestScore={showLatestScore}
                pulsing={pulsingIds.has(entry.player.id)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
