"use client";

// Stats page client component. Ported from legacy openStatsModal /
// renderPlayerStats (reference/legacy-prototype.sanitized.html L1175-1419).
// Mobile-first iOS guidelines: min 44x44px touch targets on dropdowns,
// white rectangular cards (bg-white rounded-2xl p-4 shadow-sm),
// and responsive grid layouts (2 columns on mobile, 3 on iPad/desktop).
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart2,
  Loader2,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useHistory } from "@/hooks/useHistory";
import { usePlayers } from "@/hooks/usePlayers";
import { formatSignedScore } from "@/lib/format";
import { computePlayerStats } from "@/lib/stats";

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
    <div className="flex flex-col gap-1.5 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">{label}</span>
      <span className={`${valueClassName} ${toneClass}`}>{children}</span>
    </div>
  );
}

export function Stats() {
  const { history, loading: hLoading, error: hError } = useHistory();
  const { players, loading: pLoading } = usePlayers();

  const [selectedId, setSelectedId] = useState<string>("");

  const loading = hLoading || pLoading;

  const stats = useMemo(() => {
    if (!selectedId || !history.length) return null;
    return computePlayerStats(selectedId, history);
  }, [selectedId, history]);

  const selectedPlayer = players.find((p) => p.id === selectedId) ?? null;

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
          {/* Player selector with min 48px height */}
          <div className="mb-6 flex flex-col gap-2">
            <label htmlFor="stats-player-select" className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
              เลือกผู้เล่น
            </label>
            <select
              id="stats-player-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="flex min-h-[48px] w-full rounded-2xl border border-black/[0.06] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] px-4 py-3 text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs focus:border-[#007AFF] focus:outline-none sm:max-w-xs"
            >
              <option value="">เลือกผู้เล่น</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
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
                <TrendingUp className="size-7" aria-hidden />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">ยังไม่มีประวัติการเล่น</p>
                <p className="mt-1 text-sm text-[#8E8E93] dark:text-[#98989D]">บันทึกรอบแรกเพื่อเริ่มติดตามสถิติ</p>
              </div>
            </div>
          ) : (
            <div className="reveal flex flex-col gap-6">
              {/* Profile header */}
              {selectedPlayer ? (
                <div className="flex items-center gap-4 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <PlayerAvatar player={selectedPlayer} className="size-14 text-xl shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">ข้อมูลสถิติของ</p>
                    <p className="text-lg font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">{selectedPlayer.name}</p>
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

              {/* Stat cards grid (2 cols on mobile, 3 cols on iPad/desktop) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                <StatCard label="Win Rate">
                  <span
                    className={
                      stats.winRate >= 50 ? "text-[#34C759]" : "text-[#FF3B30]"
                    }
                  >
                    {stats.winRate.toFixed(1)}%
                  </span>
                </StatCard>
                <StatCard label="จำนวนเกม">
                  <AnimatedNumber value={stats.totalRounds} showSign={false} />
                </StatCard>
                <StatCard label="สูงสุดที่เคยทำ" tone="positive">
                  <AnimatedNumber value={stats.bestRound} />
                </StatCard>
                <StatCard label="ต่ำสุดที่เคยทำ" tone="negative">
                  <AnimatedNumber value={stats.worstRound} />
                </StatCard>
                <StatCard label="ชนะ / แพ้" tone="neutral">
                  <span className="text-xl font-bold">
                    <span className="text-[#34C759]">{stats.wins}</span>
                    <span className="text-[#8E8E93] dark:text-[#98989D] text-sm"> / </span>
                    <span className="text-[#FF3B30]">{stats.losses}</span>
                  </span>
                </StatCard>
                <StatCard
                  label="ตัวคูณที่ชนะ (ครั้ง)"
                  valueClassName="flex flex-wrap gap-1.5 text-xs font-semibold tabular-nums"
                >
                  {stats.multiplierWins.length > 0 ? (
                    stats.multiplierWins.map(({ multiplier, count }) => (
                      <span
                        key={multiplier}
                        className="rounded-full bg-blue-50/80 border border-blue-500/20 px-2.5 py-1 text-[#007AFF] dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-[#2E8BFF]"
                      >
                        x{multiplier} ({count})
                      </span>
                    ))
                  ) : (
                    <span className="text-2xl font-bold text-[#8E8E93] dark:text-[#98989D]">-</span>
                  )}
                </StatCard>
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
