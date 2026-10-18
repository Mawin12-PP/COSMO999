"use client";

// One Hall of Fame card: period title and two summary pills on top, then a
// VS split view - the period champion on the left, the last-place finisher on
// the right, and the score gap between them in the middle. Read-only; every
// number comes from PeriodResult (lib/honors.ts).
import { Crown, Gamepad2, PiggyBank, Users, type LucideIcon } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { formatNumber, formatSignedScore } from "@/lib/format";
import type { PeriodResult } from "@/lib/honors";
import type { Player } from "@/types/models";

function MetaPill({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-black/[0.04] bg-white/70 px-2.5 py-1 text-xs font-medium text-[#8E8E93] shadow-2xs">
      <Icon className="size-3.5" aria-hidden />
      {text}
    </span>
  );
}

function HonoreeAvatar({
  player,
  tone,
  className,
}: {
  player: Player | undefined;
  tone: "champion" | "last";
  className: string;
}) {
  const avatar = player ? (
    <PlayerAvatar player={player} className={className} />
  ) : (
    <span
      aria-hidden
      className={`${className} flex shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-black/[0.04] text-[#8E8E93]`}
    >
      ?
    </span>
  );

  if (tone === "champion") {
    return (
      <span className="rounded-full ring-4 ring-blue-500/20 shadow-xs">{avatar}</span>
    );
  }
  return (
    <span className="rounded-full ring-2 ring-red-300/80">
      <span className="block rounded-full grayscale opacity-80">{avatar}</span>
    </span>
  );
}

function Honoree({
  tone,
  icon: Icon,
  label,
  ids,
  players,
  score,
}: {
  tone: "champion" | "last";
  icon: LucideIcon;
  label: string;
  ids: string[];
  players: Player[];
  score: number;
}) {
  const isChampion = tone === "champion";
  const avatarSize =
    ids.length > 1 ? "size-10 text-base" : "size-14 text-xl sm:size-16";

  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <p
        className={`flex flex-wrap items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
          isChampion ? "text-[#007AFF]" : "text-[#FF3B30]"
        }`}
      >
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {ids.map((id) => (
          <HonoreeAvatar
            key={id}
            player={players.find((p) => p.id === id)}
            tone={tone}
            className={avatarSize}
          />
        ))}
      </div>
      <div className="flex w-full min-w-0 flex-col items-center">
        {ids.map((id) => (
          <p key={id} className="w-full truncate text-sm font-semibold text-[#1C1C1E]">
            {players.find((p) => p.id === id)?.name ?? "(ถูกลบ)"}
          </p>
        ))}
      </div>
      <p
        className={`text-sm font-bold tabular-nums ${
          isChampion ? "text-[#34C759]" : "text-[#FF3B30]"
        }`}
      >
        {formatSignedScore(score)} แต้ม
      </p>
    </div>
  );
}

export function HallOfFameCard({
  result,
  players,
  delayMs,
}: {
  result: PeriodResult;
  players: Player[];
  delayMs: number;
}) {
  const gap = result.championScore - result.lastPlaceScore;

  return (
    <li
      className="reveal flex flex-col gap-4 rounded-[20px] border border-black/[0.04] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.04] pb-3">
        <h3 className="text-base font-semibold tracking-tight text-[#1C1C1E]">งวด {result.period.label}</h3>
        <div className="flex items-center gap-2">
          <MetaPill icon={Gamepad2} text={`${formatNumber(result.roundCount)} รอบ`} />
          <MetaPill icon={Users} text={`${formatNumber(result.playerCount)} คน`} />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 py-2">
        <Honoree
          tone="champion"
          icon={Crown}
          label="แชมป์ประจำงวด"
          ids={result.championIds}
          players={players}
          score={result.championScore}
        />
        <div className="flex flex-col items-center gap-0.5 text-center px-2">
          <span className="text-base font-black tracking-widest text-[#007AFF]">VS</span>
          <span className="text-[11px] text-[#8E8E93]">
            ผลต่าง{" "}
            <span className="font-semibold whitespace-nowrap text-[#1C1C1E]">{formatNumber(gap)}</span>
          </span>
        </div>
        <Honoree
          tone="last"
          icon={PiggyBank}
          label="หมูแจกแต้ม"
          ids={result.lastPlaceIds}
          players={players}
          score={result.lastPlaceScore}
        />
      </div>
    </li>
  );
}
