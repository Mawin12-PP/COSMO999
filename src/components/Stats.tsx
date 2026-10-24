"use client";

// Stats page client component.
// Mobile-first iOS guidelines: min 44x44px touch targets on dropdowns,
// white rectangular cards (bg-white rounded-[20px] p-4 shadow-sm),
// and balanced responsive grid layouts (2 columns on mobile, 3 on iPad/desktop).
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart2,
  CalendarX,
  Loader2,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { InteractiveSegmentedControl } from "@/components/InteractiveSegmentedControl";
import { PeriodDropdownPicker } from "@/components/PeriodDropdownPicker";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerDropdownPicker } from "@/components/PlayerDropdownPicker";
import { useHistory } from "@/hooks/useHistory";
import { usePlayers } from "@/hooks/usePlayers";
import { formatSignedScore } from "@/lib/format";
import { getCurrentPeriod, listPeriodsInHistory } from "@/lib/periods";
import { computePlayerStats, type HeadToHeadStat } from "@/lib/stats";
import type { Player } from "@/types/models";

const StatsCharts = dynamic(
  () => import("@/components/StatsCharts").then((m) => m.StatsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-6">
        <div className="h-64 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-4 animate-pulse shadow-sm" />
        <div className="h-64 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-4 animate-pulse shadow-sm" />
      </div>
    ),
  },
);

function StatCard({
  label,
  children,
  tone,
  valueClassName = "text-2xl font-bold tabular-nums",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "positive" | "negative" | "neutral";
  valueClassName?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-[#34C759]"
      : tone === "negative"
        ? "text-[#FF3B30]"
        : "text-[#1C1C1E] dark:text-[#F2F2F7]";

  return (
    <div className="flex flex-col justify-between gap-1.5 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
        {label}
      </span>
      <span className={`${valueClassName} ${toneClass}`}>{children}</span>
    </div>
  );
}

function HeadToHeadCard({
  label,
  stat,
  playersMap,
}: {
  label: string;
  stat: HeadToHeadStat | null;
  playersMap: Map<string, Player>;
}) {
  const matchedPlayer = stat ? (playersMap.get(stat.playerId) ?? null) : null;

  return (
    <div className="flex flex-col justify-between gap-2.5 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
        {label}
      </span>

      {stat && matchedPlayer ? (
        <div className="flex items-center gap-2.5 min-w-0">
          <PlayerAvatar player={matchedPlayer} className="size-8 text-xs shrink-0" />
          <span className="truncate text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
            {matchedPlayer.name}
          </span>
        </div>
      ) : (
        <span className="text-2xl font-bold text-[#8E8E93] dark:text-[#98989D]">
          -
        </span>
      )}
    </div>
  );
}

export function Stats() {
  const { history, loading: hLoading, error: hError } = useHistory();
  const { players, loading: pLoading } = usePlayers();

  const currentPeriod = getCurrentPeriod();
  const [selectedId, setSelectedId] = useState<string>("");
  const [viewKey, setViewKey] = useState<string>("all");

  const loading = hLoading || pLoading;

  // Only include history entries where the selected player actually participated.
  const playerHistory = useMemo(
    () =>
      selectedId
        ? history.filter((m) => m.playerScores[selectedId] !== undefined)
        : [],
    [history, selectedId],
  );

  // Only list periods in which the selected player has recorded stats.
  const playerPeriods = useMemo(
    () => listPeriodsInHistory(playerHistory),
    [playerHistory],
  );
  const hasCurrentPeriod = useMemo(
    () => playerPeriods.some((period) => period.key === currentPeriod.key),
    [playerPeriods, currentPeriod.key],
  );
  const pastPeriods = useMemo(
    () => playerPeriods.filter((period) => period.key !== currentPeriod.key),
    [playerPeriods, currentPeriod.key],
  );
  const activePeriod =
    playerPeriods.find((period) => period.key === viewKey) ?? null;

  const isPastPeriodActive =
    viewKey !== "all" && viewKey !== currentPeriod.key;

  const viewItems = useMemo(
    () =>
      hasCurrentPeriod
        ? [
            { key: "all", label: "ตลอดกาล" },
            { key: currentPeriod.key, label: "งวดนี้" },
          ]
        : [{ key: "all", label: "ตลอดกาล" }],
    [hasCurrentPeriod, currentPeriod.key],
  );

  const playersMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );

  const stats = useMemo(() => {
    if (!selectedId || !playerHistory.length) return null;
    return computePlayerStats(selectedId, playerHistory, viewKey);
  }, [selectedId, playerHistory, viewKey]);

  const hasAnyHistory = playerHistory.length > 0;

  const selectedPlayer = playersMap.get(selectedId) ?? null;

  return (
    <div className="mx-auto max-w-2xl px-1 sm:px-4 py-4 sm:py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7] sm:text-3xl">
          สถิติ
        </h1>
      </div>

      {/* Global loading / error */}
      {loading ? (
        <div
          className="flex flex-col items-center gap-3 py-20 text-[#8E8E93] dark:text-[#98989D]"
          aria-live="polite"
        >
          <Loader2 className="size-8 animate-spin text-[#007AFF] dark:text-[#2E8BFF]" aria-hidden />
          <span className="text-sm font-medium">กำลังโหลดข้อมูล...</span>
        </div>
      ) : hError ? (
        <div className="flex flex-col items-center gap-3 py-20 text-[#FF3B30] dark:text-[#FF453A]" role="alert">
          <TriangleAlert className="size-8" aria-hidden />
          <p className="text-sm font-semibold">โหลดประวัติไม่สำเร็จ</p>
          <p className="text-xs text-[#8E8E93] dark:text-[#98989D]">กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้า</p>
        </div>
      ) : (
        <>
          {/* Player selector & Period switcher */}
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
                เลือกผู้เล่น
              </label>
              <PlayerDropdownPicker
                players={players}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setViewKey("all");
                }}
                placeholder="เลือกผู้เล่น"
              />
            </div>

            {selectedId && hasAnyHistory && (hasCurrentPeriod || pastPeriods.length > 0) ? (
              <div className="relative z-20 flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <InteractiveSegmentedControl
                  items={viewItems}
                  activeKey={isPastPeriodActive ? null : viewKey}
                  onChange={setViewKey}
                  className="w-fit"
                  buttonClassName="min-w-[88px] sm:min-w-[100px]"
                />

                {pastPeriods.length > 0 ? (
                  <PeriodDropdownPicker
                    periods={pastPeriods}
                    selectedKey={isPastPeriodActive ? viewKey : null}
                    onSelect={setViewKey}
                    placeholder="ดูงวดย้อนหลัง..."
                    className="w-full sm:w-auto sm:min-w-[190px]"
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          {/* No player selected yet */}
          {!selectedId ? (
            <div className="flex flex-col items-center gap-4 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-12 text-center text-[#8E8E93] dark:text-[#98989D] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="grid size-14 place-items-center rounded-full bg-blue-50 dark:bg-blue-500/15 text-[#007AFF] dark:text-[#2E8BFF] shadow-xs">
                <BarChart2 className="size-7" aria-hidden />
              </div>
              <p className="text-base font-medium">เลือกผู้เล่นด้านบนเพื่อดูสถิติ</p>
            </div>
          ) : stats === null ? (
            <div className="flex flex-col items-center gap-4 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-12 text-center text-[#8E8E93] dark:text-[#98989D] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="grid size-14 place-items-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] dark:text-[#98989D]">
                {hasAnyHistory && viewKey !== "all" ? (
                  <CalendarX className="size-7" aria-hidden />
                ) : (
                  <TrendingUp className="size-7" aria-hidden />
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                  {hasAnyHistory && viewKey !== "all"
                    ? "ไม่พบรอบในงวดที่เลือก"
                    : "ยังไม่มีประวัติการเล่น"}
                </p>
                <p className="mt-1 text-sm text-[#8E8E93] dark:text-[#98989D]">
                  {hasAnyHistory && viewKey !== "all"
                    ? `ไม่มีประวัติการเล่นในช่วง ${activePeriod?.label ?? ""}`
                    : "บันทึกรอบแรกเพื่อเริ่มติดตามสถิติ"}
                </p>
              </div>
            </div>
          ) : (
            <div className="reveal flex flex-col gap-4 sm:gap-5">
              {/* Profile header */}
              {selectedPlayer ? (
                <div className="flex items-center gap-4 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <PlayerAvatar player={selectedPlayer} className="size-14 text-xl shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
                        ข้อมูลสถิติของ
                      </p>
                      {viewKey !== "all" && activePeriod?.label ? (
                        <span className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D]">
                          {activePeriod.label}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-lg font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                      {selectedPlayer.name}
                    </p>
                    <p
                      className={`text-base font-bold tabular-nums ${
                        stats.totalScore > 0
                          ? "text-[#34C759]"
                          : stats.totalScore < 0
                            ? "text-[#FF3B30]"
                            : "text-[#8E8E93] dark:text-[#98989D]"
                      }`}
                    >
                      <AnimatedNumber value={stats.totalScore} grouped /> คะแนน
                    </p>
                    <p className="text-xs tabular-nums text-[#8E8E93] dark:text-[#98989D]">
                      (คะแนนดิบ: {formatSignedScore(stats.rawTotal)})
                    </p>
                  </div>
                </div>
              ) : null}

              {/* 6-Card Core Metrics Grid (2 cols on mobile, 3 cols on desktop) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                <StatCard label="จำนวนเกม">
                  <AnimatedNumber value={stats.totalRounds} showSign={false} />
                </StatCard>

                <StatCard label="อัตราชนะ">
                  <span
                    className={
                      stats.winRate >= 25 ? "text-[#34C759]" : "text-[#FF3B30]"
                    }
                  >
                    {stats.winRate.toFixed(1)}%
                  </span>
                </StatCard>

                <StatCard label="สูงสุดต่อรอบ" tone="positive">
                  <AnimatedNumber value={stats.bestRound} grouped />
                </StatCard>

                <StatCard label="ต่ำสุดต่อรอบ" tone="negative">
                  <AnimatedNumber value={stats.worstRound} grouped />
                </StatCard>

                <StatCard
                  label="ชนะติดต่อกันสูงสุด"
                  tone={stats.maxWinStreak > 0 ? "positive" : "neutral"}
                >
                  {stats.maxWinStreak}
                </StatCard>

                <StatCard
                  label="บ๊วยติดต่อกันสูงสุด"
                  tone={stats.maxLoseStreak > 0 ? "negative" : "neutral"}
                >
                  {stats.maxLoseStreak}
                </StatCard>
              </div>

              {/* 100% Result Breakdown Card */}
              <div className="flex flex-col gap-3.5 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
                  สัดส่วนผลการเล่น
                </span>

                {/* Segmented 100% Bar */}
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                  {stats.wins > 0 ? (
                    <div
                      className="h-full bg-[#34C759] transition-all duration-300"
                      style={{ width: `${stats.winRate}%` }}
                    />
                  ) : null}
                  {stats.zeros > 0 ? (
                    <div
                      className="h-full bg-[#8E8E93]/60 dark:bg-[#98989D]/60 transition-all duration-300"
                      style={{ width: `${stats.middleRate}%` }}
                    />
                  ) : null}
                  {stats.losses > 0 ? (
                    <div
                      className="h-full bg-[#FF3B30] transition-all duration-300"
                      style={{ width: `${stats.lossRate}%` }}
                    />
                  ) : null}
                </div>

                {/* 3 Columns: ชนะรอบ / กลางตาราง / บ๊วย */}
                <div className="grid grid-cols-3 divide-x divide-black/[0.06] dark:divide-white/[0.08]">
                  <div className="flex flex-col gap-0.5 pr-3">
                    <span className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D]">
                      ชนะรอบ
                    </span>
                    <span className="text-lg sm:text-xl font-bold tabular-nums text-[#34C759]">
                      {stats.wins}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5 px-3">
                    <span className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D]">
                      กลางตาราง
                    </span>
                    <span className="text-lg sm:text-xl font-bold tabular-nums text-[#1C1C1E] dark:text-[#F2F2F7]">
                      {stats.zeros}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5 pl-3">
                    <span className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D]">
                      บ๊วย
                    </span>
                    <span className="text-lg sm:text-xl font-bold tabular-nums text-[#FF3B30]">
                      {stats.losses}
                    </span>
                  </div>
                </div>
              </div>

              {/* Head-to-Head: คู่ปรับ & ขนมกรุบ */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <HeadToHeadCard
                  label="คู่ปรับ"
                  stat={stats.nemesis}
                  playersMap={playersMap}
                />
                <HeadToHeadCard
                  label="ขนมกรุบ"
                  stat={stats.prey}
                  playersMap={playersMap}
                />
              </div>

              {/* Multiplier Wins (Full-width card so it never skews grid row height) */}
              <div className="flex flex-col gap-2.5 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
                  ตัวคูณที่ชนะ (ครั้ง)
                </span>
                {stats.multiplierWins.length > 0 ? (
                  <div className="flex flex-wrap gap-2 text-xs font-semibold tabular-nums">
                    {stats.multiplierWins.map(({ multiplier, count }) => (
                      <span
                        key={multiplier}
                        className="rounded-full bg-blue-50/80 border border-blue-500/20 px-3 py-1 text-[#007AFF] dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-[#2E8BFF]"
                      >
                        x{multiplier} ({count})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-[#8E8E93] dark:text-[#98989D]">
                    -
                  </span>
                )}
              </div>

              <StatsCharts
                roundData={stats.roundData}
                cumulativeData={stats.cumulativeData}
                totalRounds={stats.totalRounds}
                totalScore={stats.totalScore}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
