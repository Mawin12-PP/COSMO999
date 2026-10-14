"use client";

// Stats page client component. Ported from legacy openStatsModal /
// renderPlayerStats (reference/legacy-prototype.sanitized.html L1175-1419).
// Chart colours are read from CSS custom properties at render time so they
// honour the theme tokens and never hardcode raw hex values.
// Recharts is loaded via next/dynamic with ssr:false because it uses browser
// APIs (ResizeObserver, SVG measurement) unavailable on the server.
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

// StatsCharts uses Recharts (browser SVG/ResizeObserver APIs), so it is loaded
// dynamically with ssr:false to avoid server render issues.
const StatsCharts = dynamic(
  () => import("@/components/StatsCharts").then((m) => m.StatsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-6">
        <div className="h-64 rounded-lg border border-border bg-surface p-4 animate-pulse" />
        <div className="h-64 rounded-lg border border-border bg-surface p-4 animate-pulse" />
      </div>
    ),
  },
);

// Stat card: label + large value. `valueClassName` swaps the big-number
// styling for cards whose value is a row of tags instead.
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
      ? "text-success"
      : tone === "negative"
        ? "text-danger"
        : "text-text";

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface-raised p-4">
      <span className="text-xs text-text-muted">{label}</span>
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">สถิติ</h1>
        <p className="mt-1 text-sm text-text-muted">
          ประวัติการเล่นและกราฟคะแนนรายผู้เล่น
        </p>
      </div>

      {/* Global loading / error */}
      {loading ? (
        <div
          className="flex flex-col items-center gap-3 py-20 text-text-muted"
          aria-live="polite"
        >
          <Loader2 className="size-8 animate-spin" aria-hidden />
          <span className="text-sm">กำลังโหลดข้อมูล...</span>
        </div>
      ) : hError ? (
        <div className="flex flex-col items-center gap-3 py-20 text-danger" role="alert">
          <TriangleAlert className="size-8" aria-hidden />
          <p className="text-sm font-medium">โหลดประวัติไม่สำเร็จ</p>
          <p className="text-xs text-text-muted">กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้า</p>
        </div>
      ) : (
        <>
          {/* Player selector */}
          <div className="mb-6 flex flex-col gap-2">
            <label htmlFor="stats-player-select" className="text-sm font-medium">
              เลือกผู้เล่น
            </label>
            <select
              id="stats-player-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text focus:border-border-strong focus:outline-none sm:max-w-xs"
            >
              <option value="">เลือกผู้เล่นเพื่อดูสถิติ...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* No player selected yet */}
          {!selectedId ? (
            <div className="flex flex-col items-center gap-4 py-20 text-text-muted">
              <BarChart2 className="size-12 text-border-strong" aria-hidden />
              <p className="text-sm">เลือกผู้เล่นด้านบนเพื่อดูสถิติ</p>
            </div>
          ) : stats === null ? (
            /* Player has no rounds yet */
            <div className="flex flex-col items-center gap-4 py-20 text-text-muted">
              <TrendingUp className="size-12 text-border-strong" aria-hidden />
              <div className="text-center">
                <p className="font-semibold text-text">ยังไม่มีประวัติการเล่น</p>
                <p className="mt-1 text-sm">บันทึกรอบแรกเพื่อเริ่มติดตามสถิติ</p>
              </div>
            </div>
          ) : (
            /* Stats dashboard */
            <div className="reveal flex flex-col gap-6">
              {/* Profile header */}
              {selectedPlayer ? (
                <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
                  <PlayerAvatar player={selectedPlayer} className="size-14 text-xl" />
                  <div>
                    <p className="text-xs text-text-muted">ข้อมูลสถิติของ</p>
                    <p className="text-lg font-bold">{selectedPlayer.name}</p>
                    <p
                      className={`text-base font-bold tabular-nums ${
                        stats.totalScore > 0
                          ? "text-success"
                          : stats.totalScore < 0
                            ? "text-danger"
                            : "text-text-muted"
                      }`}
                    >
                      <AnimatedNumber value={stats.totalScore} grouped /> คะแนน
                    </p>
                    <p className="text-xs tabular-nums text-text-muted">
                      (คะแนนดิบ: {formatSignedScore(stats.rawTotal)})
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Stat cards grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="Win Rate">
                  <span
                    className={
                      stats.winRate >= 50 ? "text-success" : "text-danger"
                    }
                  >
                    {stats.winRate.toFixed(1)}%
                  </span>
                </StatCard>
                <StatCard label="จำนวนเกม">
                  <AnimatedNumber value={stats.totalRounds} />
                </StatCard>
                <StatCard label="สูงสุดที่เคยทำ" tone="positive">
                  <AnimatedNumber value={stats.bestRound} />
                </StatCard>
                <StatCard label="ต่ำสุดที่เคยทำ" tone="negative">
                  <AnimatedNumber value={stats.worstRound} />
                </StatCard>
                <StatCard label="ชนะ / แพ้" tone="neutral">
                  <span className="text-xl">
                    <span className="text-success">{stats.wins}</span>
                    <span className="text-text-muted text-sm"> / </span>
                    <span className="text-danger">{stats.losses}</span>
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
                        className="rounded-full bg-accent/20 px-2 py-0.5 text-accent"
                      >
                        x{multiplier} ({count})
                      </span>
                    ))
                  ) : (
                    <span className="text-2xl font-bold text-text-muted">-</span>
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
