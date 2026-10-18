"use client";

import { Trophy, TrendingUp } from "lucide-react";
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
      stroke="#FFFFFF"
      strokeWidth={2}
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
    <div className="pointer-events-none flex flex-col gap-1 rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-md px-3.5 py-2 shadow-lg">
      <span className="text-xs font-semibold text-[#8E8E93]">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${
          score > 0
            ? "text-[#34C759]"
            : score < 0
              ? "text-[#FF3B30]"
              : "text-[#8E8E93]"
        }`}
      >
        {score > 0 ? `+${score.toLocaleString()}` : score.toLocaleString()} คะแนน
      </span>
    </div>
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
    <div className="pointer-events-none flex flex-col gap-1 rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-md px-3.5 py-2 shadow-lg">
      <span className="text-xs font-semibold text-[#8E8E93]">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${
          cumulative > 0
            ? "text-[#34C759]"
            : cumulative < 0
              ? "text-[#FF3B30]"
              : "text-[#8E8E93]"
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
  const gridColour = "#E5E5EA";
  const mutedColour = "#8E8E93";
  const iosBlue = "#007AFF";
  const noAnimate = prefersReducedMotion();

  return (
    <div className="flex flex-col gap-6">
      {/* Chart 1: Per-round scores */}
      <section className="rounded-[20px] border border-black/[0.04] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-blue-50 text-[#007AFF] shadow-xs">
            <Trophy className="size-4" aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-[#1C1C1E]">คะแนนรายรอบ</h2>
          {roundData.length < totalRounds ? (
            <span className="ml-auto text-xs font-medium text-[#8E8E93]">
              {roundData.length} รอบล่าสุด
            </span>
          ) : null}
        </div>
        <div className="touch-pan-y">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={roundData}
              margin={{ top: 20, right: 16, bottom: 8, left: 0 }}
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
              <YAxis hide />
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
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                isAnimationActive={!noAnimate}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chart 2: Cumulative */}
      <section className="rounded-[20px] border border-black/[0.04] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-blue-50 text-[#007AFF] shadow-xs">
            <TrendingUp className="size-4" aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-[#1C1C1E]">คะแนนสะสม</h2>
        </div>
        <div className="touch-pan-y">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={cumulativeData}
              margin={{ top: 20, right: 16, bottom: 8, left: 0 }}
            >
              <defs>
                <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={iosBlue}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={iosBlue}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
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
              <YAxis hide />
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
                stroke={iosBlue}
                strokeWidth={3}
                fill="url(#cumGradient)"
                dot={{
                  fill: iosBlue,
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                  r: 3.5,
                }}
                activeDot={{
                  r: 6,
                  fill: iosBlue,
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                isAnimationActive={!noAnimate}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
