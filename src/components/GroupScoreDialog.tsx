"use client";

// Per-group leaderboard dialog. Ported from legacy showGroupScore
// (reference/legacy-prototype.sanitized.html L1484-1526).
// Mobile-first iOS guidelines: min 44px+ touch targets on close button, min 48px close action,
// active:scale-95 feedback, and iOS Grouped List.
import { useEffect, useMemo, useRef } from "react";
import {
  BarChart2,
  Crown,
  Gamepad2,
  PiggyBank,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { formatNumber } from "@/lib/format";
import { computeGroupStats } from "@/lib/groupStats";
import type { Group, HistoryEntry, Player } from "@/types/models";

function scoreTone(score: number): string {
  if (score > 0) return "text-[#34C759]";
  if (score < 0) return "text-[#FF3B30]";
  return "text-[#8E8E93]";
}

function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  return `${score}`;
}

function rankTone(rank: number): string {
  if (rank === 1) return "text-[#007AFF] font-bold";
  if (rank === 2) return "text-[#8E8E93] font-semibold";
  if (rank === 3) return "text-[#C4975A] font-semibold";
  return "text-[#8E8E93]";
}

function Badge({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon;
  label: string;
  className: string;
}) {
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold leading-tight ${className}`}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}

export function GroupScoreDialog({
  group,
  players,
  history,
  onClose,
}: {
  group: Group;
  players: Player[];
  history: HistoryEntry[] | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stats = useMemo(
    () => (history ? computeGroupStats(group, history) : null),
    [group, history],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  function dismiss() {
    dialogRef.current?.close();
    onClose();
  }

  const ranked = group.playerIds
    .map((pId) => {
      const player = players.find((p) => p.id === pId) ?? null;
      const score = group.scores[pId] ?? 0;
      return { pId, player, score };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
      aria-labelledby="group-score-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(26rem,calc(100vw-2rem))] overflow-y-auto rounded-[20px] border border-black/[0.04] bg-white p-0 text-[#1C1C1E] shadow-2xl backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-full bg-blue-50 text-[#007AFF] shadow-xs">
                <BarChart2 className="size-4 shrink-0" aria-hidden />
              </span>
              <h2 id="group-score-title" className="text-base font-semibold leading-snug text-[#1C1C1E]">
                คะแนนรวมกลุ่ม: {group.name}
              </h2>
            </div>
            {stats ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[#8E8E93]">
                <Gamepad2 className="size-3.5 shrink-0" aria-hidden />
                ดวลกันไปแล้วทั้งหมด {formatNumber(stats.totalRounds)} รอบ
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="ปิด"
            className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center -mr-2 -mt-2 rounded-full text-[#8E8E93] transition-all duration-200 ease-out active:scale-[0.97] hover:bg-black/[0.04] hover:text-[#1C1C1E]"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Ranked iOS Grouped List */}
        <ol className="rounded-[16px] border border-black/[0.04] bg-white shadow-2xs overflow-hidden divide-y divide-gray-100/80">
          {ranked.map(({ pId, player, score }, index) => {
            const rank = index + 1;
            const record = stats?.records[pId];
            const isLeader = stats?.leaderIds.includes(pId) ?? false;
            const isLastPlace = stats?.lastPlaceIds.includes(pId) ?? false;
            const isNemesis = stats?.nemesisIds.includes(pId) ?? false;
            return (
              <li
                key={pId}
                className="flex min-h-[52px] items-center gap-3 p-3.5 transition-colors hover:bg-gray-50/60 active:bg-gray-100/60"
              >
                {/* Rank number */}
                <span
                  className={`w-5 shrink-0 text-center text-sm tabular-nums ${rankTone(rank)}`}
                >
                  {rank}
                </span>

                {/* Avatar */}
                {player ? (
                  <PlayerAvatar player={player} className="size-9 text-xs shrink-0" />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-black/[0.04] text-xs text-[#8E8E93]">
                    ?
                  </span>
                )}

                {/* Name, nickname badges, win/loss record */}
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#1C1C1E]">
                    {player ? player.name : "(ถูกลบ)"}
                  </span>
                  {isLeader || isLastPlace || isNemesis ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {isLeader ? (
                        <Badge
                          icon={Crown}
                          label="เจ้ามือประจำกลุ่ม"
                          className="bg-blue-50/80 border border-blue-500/20 text-[#007AFF]"
                        />
                      ) : null}
                      {isLastPlace ? (
                        <Badge
                          icon={PiggyBank}
                          label="หมูแจกแต้ม"
                          className="bg-red-50/80 border border-red-500/20 text-[#FF3B30]"
                        />
                      ) : null}
                      {isNemesis ? (
                        <Badge
                          icon={Target}
                          label="มือปราบแชมป์"
                          className="bg-black/[0.04] text-[#1C1C1E]"
                        />
                      ) : null}
                    </div>
                  ) : null}
                  {record ? (
                    <p className="mt-0.5 text-xs tabular-nums text-[#8E8E93]">
                      ชนะ {record.wins} • แพ้ {record.losses}
                      {record.winRate !== null
                        ? ` (${Math.round(record.winRate)}%)`
                        : ""}
                    </p>
                  ) : null}
                </div>

                {/* Score */}
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${scoreTone(score)}`}
                >
                  {formatScore(score)}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Close button */}
        <button
          type="button"
          onClick={dismiss}
          className="flex min-h-[48px] w-full items-center justify-center rounded-full border border-black/[0.06] bg-white px-6 py-3 text-base font-semibold text-[#1C1C1E] shadow-xs transition-all duration-200 ease-out active:scale-[0.97] hover:bg-gray-50"
        >
          ปิด
        </button>
      </div>
    </dialog>
  );
}
