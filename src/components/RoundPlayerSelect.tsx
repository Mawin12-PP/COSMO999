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
      <p className="rounded-2xl border border-black/[0.04] bg-white/60 backdrop-blur-xl p-5 text-center text-sm text-[#8E8E93]">
        ยังไม่มีผู้เล่น สร้างโปรไฟล์ก่อนเริ่มเกม
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((player) => {
        const selected = selectedIds.includes(player.id);
        return (
          <li key={player.id}>
            <button
              type="button"
              onClick={() => onToggle(player.id)}
              aria-pressed={selected}
              className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.98] ${
                selected
                  ? "border-[#007AFF] bg-blue-50/70 shadow-sm ring-1 ring-[#007AFF]/25"
                  : "border-black/[0.04] bg-white/70 backdrop-blur-md shadow-xs active:bg-gray-100 hover:border-black/[0.08]"
              }`}
            >
              <PlayerAvatar player={player} className="size-11 text-base shrink-0" />
              <span className="min-w-0 flex-1 truncate text-base font-semibold text-[#1C1C1E]">
                {player.name}
              </span>
              <span
                aria-hidden
                className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-all ${
                  selected
                    ? "border-0 bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-xs"
                    : "border border-gray-300 bg-white text-transparent"
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
