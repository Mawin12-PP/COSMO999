"use client";

import { useTheme } from "next-themes";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Player } from "@/types/models";
import type { LiveSessionChartPoint } from "@/types/session";

const PLAYER_COLORS = [
  "#2563EB", // Classic Blue
  "#0D9488", // Deep Teal / Sage
  "#7C3AED", // Violet
  "#D97706", // Amber
  "#475569", // Slate
  "#E11D48", // Rose
  "#0284C7", // Sky
  "#4B5563", // Zinc
];

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string | number;
  players: Player[];
}

function LiveChartTooltip({
  active,
  payload,
  label,
  players,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const validPayload = payload.filter(
    (entry) =>
      entry.value !== null &&
      entry.value !== undefined &&
      !Number.isNaN(Number(entry.value)),
  );
  if (!validPayload.length) return null;

  return (
    <div className="pointer-events-none flex flex-col gap-1.5 rounded-2xl border border-black/[0.08] dark:border-[#38383A] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md p-3 shadow-xl">
      <span className="text-[11px] font-semibold text-[#8E8E93] dark:text-[#98989D]">
        {label}
      </span>
      <div className="flex flex-col gap-1">
        {validPayload.map((entry) => {
          const player = players.find((p) => p.id === entry.dataKey);
          const score = Number(entry.value);
          return (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium text-[#1C1C1E] dark:text-[#F2F2F7]">
                  {player?.name ?? entry.name}
                </span>
              </div>
              <span
                className={`font-bold tabular-nums ${
                  score > 0
                    ? "text-[#34C759]"
                    : score < 0
                      ? "text-[#FF3B30]"
                      : "text-[#8E8E93] dark:text-[#98989D]"
                }`}
              >
                {score > 0 ? `+${score.toLocaleString()}` : score.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LiveSessionChart({
  chartData,
  players,
  height = 240,
}: {
  chartData: LiveSessionChartPoint[];
  players: Player[];
  height?: number;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridColour = isDark ? "#38383A" : "#E5E5EA";
  const mutedColour = isDark ? "#98989D" : "#8E8E93";
  const noAnimate = prefersReducedMotion();

  if (chartData.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-black/[0.02] dark:bg-white/[0.02] p-4 text-center"
        style={{ height }}
      >
        <span className="text-xs text-[#8E8E93] dark:text-[#98989D]">
          บันทึกรอบแรกเพื่อเริ่มดูกราฟคะแนนรายรอบ
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="touch-pan-y" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 16, bottom: 4, left: -16 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColour}
              opacity={0.6}
            />
            <XAxis
              dataKey="roundLabel"
              tick={{ fill: mutedColour, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              padding={{ left: 24, right: 24 }}
            />
            <YAxis
              tick={{ fill: mutedColour, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val: number) => `${val}`}
            />
            <ReferenceLine y={0} stroke={mutedColour} strokeDasharray="3 2" />
            <Tooltip
              content={<LiveChartTooltip players={players} />}
              cursor={{
                stroke: gridColour,
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
            />
            {players.map((player, idx) => {
              const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
              return (
                <Line
                  key={player.id}
                  type="monotone"
                  dataKey={player.id}
                  name={player.name}
                  stroke={color}
                  strokeWidth={2.2}
                  connectNulls={false}
                  dot={{
                    r: 3,
                    fill: color,
                    stroke: isDark ? "#1C1C1E" : "#FFFFFF",
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 5,
                    fill: color,
                    stroke: isDark ? "#1C1C1E" : "#FFFFFF",
                    strokeWidth: 2,
                  }}
                  isAnimationActive={!noAnimate}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Minimalist Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-1">
        {players.map((player, idx) => {
          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
          return (
            <div key={player.id} className="flex items-center gap-1.5 text-[11px]">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium text-[#1C1C1E] dark:text-[#F2F2F7] truncate max-w-[90px]">
                {player.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
