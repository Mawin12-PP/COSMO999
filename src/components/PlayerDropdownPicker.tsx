"use client";

// Reusable 1-column Player Dropdown Menu for iOS 18.
// Features:
// - 1 column list (1 Profile per row)
// - Max-height with smooth vertical scrollbar (overflow-y: auto)
// - Smooth Open animation (Slide down / Expand + Fade in)
// - Row hover highlight & active micro-scale click response
// - Smooth Close animation (Slide up / Collapse + Fade out) on selection or click-outside
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedPlayer = players.find((p) => p.id === selectedId) || null;

  const triggerClose = useCallback(() => {
    if (!isOpen || isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 180);
  }, [isOpen, isClosing]);

  function handleToggle() {
    if (isOpen) {
      triggerClose();
    } else {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setIsClosing(false);
      setIsOpen(true);
    }
  }

  // Click outside to collapse with smooth slide-up + fade-out animation
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        triggerClose();
      }
    }
    if (isOpen && !isClosing) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isClosing, triggerClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  function handlePick(playerId: string) {
    onSelect(playerId);
    triggerClose();
  }

  return (
    <div ref={containerRef} className={`relative flex flex-col ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        className="flex min-h-[44px] sm:min-h-[46px] w-full items-center justify-between rounded-xl border border-black/[0.06] dark:border-[#38383A] bg-[#F2F2F7]/60 dark:bg-[#2C2C2E]/60 px-3.5 py-2.5 text-sm font-medium text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] active:scale-[0.99] cursor-pointer transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedPlayer ? (
            <>
              <PlayerAvatar player={selectedPlayer} className="size-6 text-xs shrink-0" />
              <span className="truncate text-sm font-semibold">{selectedPlayer.name}</span>
            </>
          ) : (
            <span className="text-sm font-medium text-[#8E8E93] dark:text-[#98989D]">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`size-4 text-[#8E8E93] dark:text-[#98989D] shrink-0 transition-transform duration-200 ${
            isOpen && !isClosing ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown Menu: 1 Column List with Slide Down/Up + Fade In/Out */}
      {(isOpen || isClosing) && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-40 overflow-hidden rounded-2xl border border-black/[0.08] dark:border-[#38383A] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl shadow-xl transition-all duration-180 ease-out ${
            isClosing
              ? "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none"
              : "opacity-100 translate-y-0 scale-100 animate-in fade-in-0 slide-in-from-top-2 duration-200"
          }`}
          style={{ transformOrigin: "top" }}
        >
          <ul className="flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.04] max-h-[260px] sm:max-h-[280px] overflow-y-auto p-1.5 overscroll-contain">
            {players.map((player) => {
              const isSelected = player.id === selectedId;
              return (
                <li key={player.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(player.id)}
                    aria-pressed={isSelected}
                    className={`group flex min-h-[46px] sm:min-h-[48px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-150 ease-out cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? "bg-blue-50/90 dark:bg-blue-950/50 text-[#007AFF] dark:text-[#2E8BFF] font-semibold"
                        : "text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-gray-100/80 dark:hover:bg-[#2C2C2E]/80"
                    }`}
                  >
                    <PlayerAvatar
                      player={player}
                      className="size-8 sm:size-8.5 text-xs shrink-0 transition-transform group-hover:scale-105"
                    />
                    <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-medium">
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
        </div>
      )}
    </div>
  );
}
