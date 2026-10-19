"use client";

// Reusable player picker dropdown styled as iOS 18 collapsible grid.
// Features: Sleek trigger button showing selected player avatar + name,
// 2-column card grid with active states and internal scroll,
// auto-collapses immediately upon selection ("พอเลือกเสร็จก็หายไป").
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Player } from "@/types/models";

export function PlayerDropdownPicker({
  players,
  selectedId,
  onSelect,
  placeholder = "เลือกผู้เล่น",
  className = "",
}: {
  players: Player[];
  selectedId: string;
  onSelect: (playerId: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPlayer = players.find((p) => p.id === selectedId) || null;

  // Click outside to collapse
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  function handlePick(playerId: string) {
    onSelect(playerId);
    setIsOpen(false); // พอเลือกเสร็จก็หายไป
  }

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-2.5 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex min-h-[42px] sm:min-h-[44px] w-full items-center justify-between rounded-xl border border-black/[0.06] dark:border-[#38383A] bg-[#F2F2F7]/60 dark:bg-[#2C2C2E]/60 px-3.5 py-2 text-sm font-medium text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] active:scale-[0.99] cursor-pointer transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedPlayer ? (
            <>
              <PlayerAvatar player={selectedPlayer} className="size-6 text-xs shrink-0" />
              <span className="truncate text-sm font-medium">{selectedPlayer.name}</span>
            </>
          ) : (
            <span className="text-sm font-medium text-[#8E8E93] dark:text-[#98989D]">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`size-4 text-[#8E8E93] dark:text-[#98989D] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded Grid of Players */}
      {isOpen && (
        <ul className="grid grid-cols-2 gap-2 sm:gap-2.5 max-h-[240px] overflow-y-auto pr-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {players.map((player) => {
            const isSelected = player.id === selectedId;
            return (
              <li key={player.id}>
                <button
                  type="button"
                  onClick={() => handlePick(player.id)}
                  aria-pressed={isSelected}
                  className={`flex min-h-[48px] sm:min-h-[52px] w-full items-center gap-2.5 rounded-2xl border-2 p-2 sm:p-2.5 text-left transition-all duration-200 ease-out active:scale-[0.97] hover:opacity-95 cursor-pointer ${
                    isSelected
                      ? "border-[#007AFF] bg-blue-50/60 dark:bg-blue-950/30 shadow-xs"
                      : "border-black/[0.05] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] shadow-2xs hover:bg-gray-50 dark:hover:bg-[#2C2C2E]"
                  }`}
                >
                  <PlayerAvatar player={player} className="size-9 sm:size-10 text-sm shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1C1C1E] dark:text-[#F2F2F7]">
                    {player.name}
                  </span>
                  {isSelected && (
                    <span className="text-xs font-bold text-[#007AFF] dark:text-[#2E8BFF] shrink-0">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
