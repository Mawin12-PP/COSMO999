"use client";

import { useMemo } from "react";
import { Trophy, TrendingUp } from "lucide-react";
import { useTheme } from "next-themes";
import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
} from "recharts";
import type { RoundDataPoint, CumulativeDataPoint } from "@/lib/stats";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Colour for a single-round score based on sign.
function roundDotColour(score: number): string {
  if (score > 0) return "#34C759";
  if (score < 0) return "#FF3B30";
  return "#8E8E93";
}

// Custom dot renderer for the round-score line chart.
function RoundDot(props: {
  cx?: number;
  cy?: number;
  payload?: unknown;
}) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  const p = payload as RoundDataPoint;
  const fill = roundDotColour(p.score);
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill={fill}
      strokeWidth={2}
      className="stroke-white dark:stroke-[#1C1C1E]"
    />
  );
}

// Interactive tooltip popup for per-round scores on hover, touch, or click.
function RoundScoreTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: RoundDataPoint }>;
  label?: string | number;
}) {
  if (!active || !payload || !payload.length || payload[0]?.value === undefined) {
    return null;
  }
  const score = payload[0].value;
  return (
    <div className="pointer-events-none flex flex-col gap-1 rounded-2xl border border-black/[0.06] dark:border-[#38383A] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md px-3.5 py-2 shadow-lg">
      <span className="text-xs font-semibold text-[#8E8E93] dark:text-[#98989D]">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${
          score > 0
            ? "text-[#34C759]"
            : score < 0
              ? "text-[#FF3B30]"
              : "text-[#8E8E93] dark:text-[#98989D]"
        }`}
      >
        {score > 0 ? `+${score.toLocaleString()}` : score.toLocaleString()} คะแนน
      </span>
    </div>
  );
}

// Custom active dot renderer for cumulative score chart on hover/touch (blue for >=0, red for <0).
function CumulativeActiveDot(props: {
  cx?: number;
  cy?: number;
  payload?: unknown;
}) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  const p = payload as CumulativeDataPoint;
  const fill = (p.cumulative ?? 0) >= 0 ? "#007AFF" : "#FF3B30";
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={fill}
      strokeWidth={2}
      className="stroke-white dark:stroke-[#1C1C1E]"
    />
  );
}

// Interactive tooltip popup for cumulative scores on hover, touch, or click.
function CumulativeScoreTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: CumulativeDataPoint }>;
  label?: string | number;
}) {
  if (!active || !payload || !payload.length || payload[0]?.value === undefined) {
    return null;
  }
  const cumulative = payload[0].value;
  return (
    <div className="pointer-events-none flex flex-col gap-1 rounded-2xl border border-black/[0.06] dark:border-[#38383A] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md px-3.5 py-2 shadow-lg">
      <span className="text-xs font-semibold text-[#8E8E93] dark:text-[#98989D]">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${
          cumulative > 0
            ? "text-[#007AFF] dark:text-[#2E8BFF]"
            : cumulative < 0
              ? "text-[#FF3B30]"
              : "text-[#8E8E93] dark:text-[#98989D]"
        }`}
      >
        สะสม: {cumulative > 0 ? `+${cumulative.toLocaleString()}` : cumulative.toLocaleString()} คะแนน
      </span>
    </div>
  );
}

export interface StatsChartsProps {
  roundData: RoundDataPoint[];
  cumulativeData: CumulativeDataPoint[];
  totalRounds: number;
  totalScore: number;
}

export function StatsCharts({
  roundData,
  cumulativeData,
  totalRounds,
}: StatsChartsProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridColour = isDark ? "#38383A" : "#E5E5EA";
  const mutedColour = isDark ? "#98989D" : "#8E8E93";
  const iosBlue = "#007AFF";
  const iosRed = "#FF3B30";
  const noAnimate = prefersReducedMotion();

  const { off, isAllPositive, isAllNegative } = useMemo(() => {
    if (!cumulativeData || cumulativeData.length === 0) {
      return { off: 1, isAllPositive: true, isAllNegative: false };
    }
    const values = cumulativeData.map((d) => d.cumulative);
    const dataMax = Math.max(...values);
    const dataMin = Math.min(...values);

    if (dataMax <= 0 && dataMin < 0) {
      return { off: 0, isAllPositive: false, isAllNegative: true };
    }
    if (dataMin >= 0) {
      return { off: 1, isAllPositive: true, isAllNegative: false };
    }
    const range = dataMax - dataMin;
    const calculatedOff = range === 0 ? 0.5 : dataMax / range;
    return {
      off: Math.max(0, Math.min(1, calculatedOff)),
      isAllPositive: false,
      isAllNegative: false,
    };
  }, [cumulativeData]);

  const strokeColor = isAllPositive
    ? iosBlue
    : isAllNegative
      ? iosRed
      : "url(#cumStroke)";

  return (
    <div className="flex flex-col gap-6">
      {/* Chart 1: Per-round scores */}
      <section className="rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-blue-50 dark:bg-blue-500/15 text-[#007AFF] dark:text-[#2E8BFF] shadow-xs">
            <Trophy className="size-4" aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">คะแนนรายรอบ</h2>
          {roundData.length < totalRounds ? (
            <span className="ml-auto text-xs font-medium text-[#8E8E93] dark:text-[#98989D]">
              {roundData.length} รอบล่าสุด
            </span>
          ) : null}
        </div>
        <div className="touch-pan-y">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={roundData}
              margin={{ top: 20, right: 16, bottom: 8, left: 12 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColour}
                opacity={0.8}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: mutedColour, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: mutedColour, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(val: number) => `${val}`}
              />
              <ReferenceLine y={0} stroke={mutedColour} strokeDasharray="4 2" />
              <Tooltip
                content={<RoundScoreTooltip />}
                cursor={{
                  stroke: gridColour,
                  strokeWidth: 1.5,
                  strokeDasharray: "3 3",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={iosBlue}
                strokeWidth={2.5}
                dot={<RoundDot />}
                activeDot={{
                  r: 6,
                  fill: iosBlue,
                  stroke: isDark ? "#1C1C1E" : "#FFFFFF",
                  strokeWidth: 2,
                }}
                isAnimationActive={!noAnimate}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chart 2: Cumulative */}
      <section className="rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-blue-50 dark:bg-blue-500/15 text-[#007AFF] dark:text-[#2E8BFF] shadow-xs">
            <TrendingUp className="size-4" aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">คะแนนสะสม</h2>
        </div>
        <div className="touch-pan-y">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={cumulativeData}
              margin={{ top: 20, right: 16, bottom: 8, left: 12 }}
            >
              <defs>
                {isAllPositive ? (
                  <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={iosBlue} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={iosBlue} stopOpacity={0.0} />
                  </linearGradient>
                ) : isAllNegative ? (
                  <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={iosRed} stopOpacity={0.0} />
                    <stop offset="95%" stopColor={iosRed} stopOpacity={0.28} />
                  </linearGradient>
                ) : (
                  <>
                    <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={iosBlue} stopOpacity={0.28} />
                      <stop offset={`${off * 100}%`} stopColor={iosBlue} stopOpacity={0.02} />
                      <stop offset={`${off * 100}%`} stopColor={iosRed} stopOpacity={0.02} />
                      <stop offset="100%" stopColor={iosRed} stopOpacity={0.28} />
                    </linearGradient>
                    <linearGradient id="cumStroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={`${off * 100}%`} stopColor={iosBlue} />
                      <stop offset={`${off * 100}%`} stopColor={iosRed} />
                    </linearGradient>
                  </>
                )}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColour}
                opacity={0.8}
              />
              <XAxis
                dataKey="label"
                tick={false}
                axisLine={false}
                tickLine={false}
                height={6}
              />
              <YAxis
                tick={{ fill: mutedColour, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(val: number) => `${val}`}
              />
              <ReferenceLine y={0} stroke={mutedColour} strokeDasharray="4 2" />
              <Tooltip
                content={<CumulativeScoreTooltip />}
                cursor={{
                  stroke: gridColour,
                  strokeWidth: 1.5,
                  strokeDasharray: "3 3",
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                baseValue={0}
                stroke={strokeColor}
                strokeWidth={2.5}
                fill="url(#cumGradient)"
                dot={false}
                activeDot={<CumulativeActiveDot />}
                isAnimationActive={!noAnimate}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
