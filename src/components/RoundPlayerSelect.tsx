"use client";

// Multi-select grid of players for the current round.
// Touch-optimized for iPhone/iPad: min 52px height per button, generous p-3 padding,
// active:scale-95 feedback, and clear selection states.
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const prevSelectedRef = useRef<string[]>(selectedIds);

  const recentPlayers = players.slice(0, 6);
  const otherPlayers = players.slice(6);

  // If newly selected player comes from otherPlayers (e.g. preset loaded), auto-expand
  useEffect(() => {
    const hasNewlySelectedOther = otherPlayers.some(
      (p) => selectedIds.includes(p.id) && !prevSelectedRef.current.includes(p.id),
    );
    if (hasNewlySelectedOther) {
      setIsExpanded(true);
    }
    prevSelectedRef.current = selectedIds;
  }, [selectedIds, otherPlayers]);

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

  const renderPlayerItem = (player: Player) => {
    const selected = selectedIds.includes(player.id);
    return (
      <li key={player.id}>
        <button
          type="button"
          onClick={() => onToggle(player.id)}
          aria-pressed={selected}
          className={`flex min-h-[48px] sm:min-h-[52px] w-full items-center gap-2.5 rounded-2xl border-2 p-2 sm:p-2.5 text-left transition-all duration-200 ease-out active:scale-[0.97] hover:opacity-95 cursor-pointer ${
            selected
              ? "border-[#007AFF] bg-blue-50/60 dark:bg-blue-950/30 shadow-xs"
              : "border-black/[0.05] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] shadow-2xs hover:bg-gray-50 dark:hover:bg-[#2C2C2E]"
          }`}
        >
          <PlayerAvatar player={player} className="size-9 sm:size-10 text-sm shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1C1C1E] dark:text-[#F2F2F7]">
            {player.name}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-2.5">
      <ul className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {recentPlayers.map(renderPlayerItem)}
      </ul>

      {otherPlayers.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="flex min-h-[42px] sm:min-h-[44px] w-full items-center justify-between rounded-xl border border-black/[0.06] dark:border-[#38383A] bg-black/[0.02] dark:bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-[#1C1C1E] dark:text-[#F2F2F7] transition-all duration-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-[0.99] cursor-pointer"
          >
            <span>ผู้เล่นคนอื่น</span>
            <ChevronDown
              className={`size-4 text-[#8E8E93] dark:text-[#98989D] transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {isExpanded && (
            <ul className="grid grid-cols-2 gap-2 sm:gap-2.5 max-h-[240px] overflow-y-auto pr-0.5">
              {otherPlayers.map(renderPlayerItem)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
