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

// Read a CSS custom property value from the document root at call time.
function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

// Whether the visitor has requested reduced motion.
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Colour for a single-round score based on sign.
function roundDotColour(score: number): string {
  if (score > 0) return cssVar("--color-success", "#3ecf7f");
  if (score < 0) return cssVar("--color-danger", "#c62330");
  return cssVar("--color-ivory-400", "#a8a291");
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
      r={5}
      fill={fill}
      stroke={cssVar("--color-felt-900", "#0a2318")}
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
    <div className="pointer-events-none flex flex-col gap-1 rounded-lg border border-border-strong bg-surface-raised px-3 py-2 shadow-card">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${
          score > 0
            ? "text-success"
            : score < 0
              ? "text-danger"
              : "text-text-muted"
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
    <div className="pointer-events-none flex flex-col gap-1 rounded-lg border border-border-strong bg-surface-raised px-3 py-2 shadow-card">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${
          cumulative > 0
            ? "text-success"
            : cumulative < 0
              ? "text-danger"
              : "text-text-muted"
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
  totalScore,
}: StatsChartsProps) {
  const borderColour = cssVar("--color-felt-700", "#14472f");
  const successColour = cssVar("--color-success", "#3ecf7f");
  const dangerColour = cssVar("--color-danger", "#c62330");
  const mutedColour = cssVar("--color-ivory-400", "#a8a291");
  const goldColour = cssVar("--color-gold-400", "#e6c878");
  const feltColour = cssVar("--color-felt-900", "#0a2318");
  const noAnimate = prefersReducedMotion();

  const cumulativeTone = totalScore >= 0 ? successColour : dangerColour;

  return (
    <div className="flex flex-col gap-6">
      {/* Chart 1: Per-round scores */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="size-4 text-accent" aria-hidden />
          <h2 className="text-sm font-semibold">คะแนนรายรอบ</h2>
          {roundData.length < totalRounds ? (
            <span className="ml-auto text-xs text-text-muted">
              {roundData.length} รอบล่าสุด
            </span>
          ) : null}
        </div>
        <div className="touch-pan-y">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={roundData}
              margin={{ top: 20, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={borderColour}
                opacity={0.4}
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
                  stroke: borderColour,
                  strokeWidth: 1.5,
                  strokeDasharray: "3 3",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={mutedColour}
                strokeWidth={2}
                dot={<RoundDot />}
                activeDot={{
                  r: 7,
                  fill: goldColour,
                  stroke: feltColour,
                  strokeWidth: 2,
                }}
                isAnimationActive={!noAnimate}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chart 2: Cumulative */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="size-4 text-accent" aria-hidden />
          <h2 className="text-sm font-semibold">คะแนนสะสม</h2>
        </div>
        <div className="touch-pan-y">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={cumulativeData}
              margin={{ top: 20, right: 16, bottom: 8, left: 0 }}
            >
              <defs>
                <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={cumulativeTone}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={cumulativeTone}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={borderColour}
                opacity={0.4}
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
                  stroke: borderColour,
                  strokeWidth: 1.5,
                  strokeDasharray: "3 3",
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={cumulativeTone}
                strokeWidth={3}
                fill="url(#cumGradient)"
                dot={{
                  fill: goldColour,
                  stroke: feltColour,
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  r: 7,
                  fill: goldColour,
                  stroke: feltColour,
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
