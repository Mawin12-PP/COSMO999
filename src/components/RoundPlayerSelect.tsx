"use client";

// Multi-select grid of players for the current round.
// Touch-optimized for iPhone/iPad: min 52px height per button, generous p-3 padding,
// active:scale-95 feedback, and clear selection states.
import { Check, Loader2 } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Player } from "@/types/models";

export function RoundPlayerSelect({
  players,
  loading,
  selectedIds,
  onToggle,
}: {
  players: Player[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2.5 py-4 text-sm text-[#8E8E93]">
        <Loader2 className="size-4.5 animate-spin text-[#007AFF]" />
        กำลังโหลดรายชื่อผู้เล่น...
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <p className="rounded-2xl border border-black/[0.04] dark:border-[#38383A] bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl p-5 text-center text-sm text-[#8E8E93] dark:text-[#98989D]">
        ยังไม่มีผู้เล่น สร้างโปรไฟล์ก่อนเริ่มเกม
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:gap-2.5">
      {players.map((player) => {
        const selected = selectedIds.includes(player.id);
        return (
          <li key={player.id}>
            <button
              type="button"
              onClick={() => onToggle(player.id)}
              aria-pressed={selected}
              className={`flex min-h-[52px] sm:min-h-[56px] w-full items-center gap-2 sm:gap-3 rounded-2xl border p-2.5 sm:p-3 text-left transition-all duration-200 ease-out active:scale-[0.97] hover:opacity-95 cursor-pointer ${
                selected
                  ? "border-[#007AFF] bg-blue-50/80 dark:bg-blue-950/40 shadow-sm ring-1 ring-[#007AFF]/25"
                  : "border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] shadow-xs hover:bg-gray-50 dark:hover:bg-[#2C2C2E]"
              }`}
            >
              <PlayerAvatar player={player} className="size-9 sm:size-11 text-sm sm:text-base shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm sm:text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                {player.name}
              </span>
              <span
                aria-hidden
                className={`flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out ${
                  selected
                    ? "border-0 bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-xs"
                    : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1C1E] text-transparent"
                }`}
              >
                <Check className="size-3.5 stroke-[3]" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
