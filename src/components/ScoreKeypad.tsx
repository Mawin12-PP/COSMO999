"use client";

import {
  ChevronDown,
  ChevronUp,
  Delete,
  Minus,
  Plus,
} from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Player } from "@/types/models";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function ScoreKeypad({
  activePlayer,
  activePlayerName,
  displayValue,
  hasPrev,
  hasNext,
  isNegative,
  onDigit,
  onBackspace,
  onToggleSign,
  onPrev,
  onNext,
}: {
  activePlayer?: Player;
  activePlayerName: string;
  displayValue: string;
  hasPrev: boolean;
  hasNext: boolean;
  isNegative: boolean;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onToggleSign: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-between gap-2.5 rounded-[18px] border border-black/[0.06] dark:border-[#38383A] bg-[#F2F2F7]/90 dark:bg-[#2C2C2E]/90 p-3 backdrop-blur-xl shadow-inner select-none">
      {/* Keypad Top Bar: Shows current player + live input value */}
      <div className="flex items-center justify-between gap-2 rounded-xl bg-white/80 dark:bg-[#1C1C1E]/80 px-3 py-2 border border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          {activePlayer ? (
            <PlayerAvatar player={activePlayer} className="size-7 text-xs shrink-0" />
          ) : (
            <span className="size-2.5 rounded-full bg-[#007AFF] shrink-0" />
          )}
          <span className="truncate text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
            {activePlayerName}
          </span>
        </div>
        <span
          className={`min-w-[3.25rem] shrink-0 rounded-lg px-2 py-0.5 text-right text-base font-bold tabular-nums ${
            isNegative
              ? "bg-[#FF3B30]/12 text-[#FF3B30] dark:bg-[#FF453A]/15 dark:text-[#FF453A]"
              : "bg-black/[0.04] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-[#F2F2F7]"
          }`}
        >
          {displayValue || (isNegative ? "-0" : "0")}
        </span>
      </div>

      {/* 3x4 iOS Number Grid */}
      <div className="grid flex-1 grid-cols-3 gap-2">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => onDigit(digit)}
            className="flex min-h-[48px] items-center justify-center rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-white dark:bg-[#3A3A3C] text-xl font-bold tabular-nums text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs transition-all duration-100 active:scale-[0.95] active:bg-gray-100 dark:active:bg-[#48484A] cursor-pointer"
          >
            {digit}
          </button>
        ))}

        {/* Bottom-left: Sign Toggle (+/-) */}
        <button
          type="button"
          onClick={onToggleSign}
          aria-pressed={isNegative}
          aria-label="สลับเครื่องหมายบวกลบ"
          className="flex min-h-[48px] items-center justify-center gap-1 rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-[#E5E5EA] dark:bg-[#2C2C2E] text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] transition-all duration-100 active:scale-[0.95] active:bg-gray-300 dark:active:bg-[#48484A] cursor-pointer"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span className="text-xs opacity-50">/</span>
          <Minus className="size-4 stroke-[2.5]" />
        </button>

        {/* Bottom-center: 0 */}
        <button
          type="button"
          onClick={() => onDigit("0")}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-white dark:bg-[#3A3A3C] text-xl font-bold tabular-nums text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs transition-all duration-100 active:scale-[0.95] active:bg-gray-100 dark:active:bg-[#48484A] cursor-pointer"
        >
          0
        </button>

        {/* Bottom-right: Backspace */}
        <button
          type="button"
          onClick={onBackspace}
          aria-label="ลบตัวเลข"
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] transition-all duration-100 active:scale-[0.95] active:bg-gray-300 dark:active:bg-[#48484A] cursor-pointer"
        >
          <Delete className="size-5" />
        </button>
      </div>

      {/* Symmetrical Up / Down Navigation Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="เลื่อนขึ้น"
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#3A3A3C] px-4 text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs transition-all duration-150 active:scale-[0.97] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronUp className="size-4.5 stroke-[2.5]" />
          <span>ขึ้น</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="เลื่อนลง"
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#3A3A3C] px-4 text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs transition-all duration-150 active:scale-[0.97] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronDown className="size-4.5 stroke-[2.5]" />
          <span>ลง</span>
        </button>
      </div>
    </div>
  );
}
