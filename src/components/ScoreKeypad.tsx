"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Delete,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Player } from "@/types/models";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function ScoreKeypad({
  activePlayer,
  activePlayerName,
  displayValue,
  hasPrev,
  nextPlayerName,
  isNegative,
  onDigit,
  onBackspace,
  onToggleSign,
  onPrev,
  onNext,
  onClose,
}: {
  activePlayer?: Player;
  activePlayerName: string;
  displayValue: string;
  hasPrev: boolean;
  nextPlayerName?: string;
  isNegative: boolean;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onToggleSign: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-[18px] border border-black/[0.06] dark:border-[#38383A] bg-[#F2F2F7]/90 dark:bg-[#2C2C2E]/90 p-3 backdrop-blur-xl shadow-inner select-none">
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
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`min-w-[3.25rem] rounded-lg px-2 py-0.5 text-right text-base font-bold tabular-nums ${
              isNegative
                ? "bg-[#FF3B30]/12 text-[#FF3B30] dark:bg-[#FF453A]/15 dark:text-[#FF453A]"
                : "bg-black/[0.04] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-[#F2F2F7]"
            }`}
          >
            {displayValue || (isNegative ? "-0" : "0")}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="ซ่อนแป้นพิมพ์"
            className="flex md:hidden size-8 items-center justify-center rounded-lg text-[#8E8E93] dark:text-[#98989D] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* 3x4 iOS Number Grid */}
      <div className="grid grid-cols-3 gap-2">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => onDigit(digit)}
            className="flex h-12 items-center justify-center rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-white dark:bg-[#3A3A3C] text-xl font-bold tabular-nums text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs transition-all duration-100 active:scale-[0.95] active:bg-gray-100 dark:active:bg-[#48484A] cursor-pointer"
          >
            {digit}
          </button>
        ))}

        {/* Bottom-left: Sign Toggle (+/-) */}
        <button
          type="button"
          onClick={onToggleSign}
          aria-pressed={isNegative}
          className={`flex h-12 items-center justify-center gap-1 rounded-xl border text-base font-bold transition-all duration-100 active:scale-[0.95] cursor-pointer ${
            isNegative
              ? "border-[#FF3B30]/35 bg-[#FF3B30]/15 text-[#FF3B30] dark:border-[#FF453A]/40 dark:bg-[#FF453A]/20 dark:text-[#FF453A]"
              : "border-[#34C759]/30 bg-[#34C759]/12 text-[#34C759] dark:border-[#34C759]/35 dark:bg-[#34C759]/20"
          }`}
        >
          <Plus className="size-4 stroke-[2.75]" />
          <span className="text-xs opacity-60">/</span>
          <Minus className="size-4 stroke-[2.75]" />
        </button>

        {/* Bottom-center: 0 */}
        <button
          type="button"
          onClick={() => onDigit("0")}
          className="flex h-12 items-center justify-center rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-white dark:bg-[#3A3A3C] text-xl font-bold tabular-nums text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs transition-all duration-100 active:scale-[0.95] active:bg-gray-100 dark:active:bg-[#48484A] cursor-pointer"
        >
          0
        </button>

        {/* Bottom-right: Backspace */}
        <button
          type="button"
          onClick={onBackspace}
          aria-label="ลบตัวเลข"
          className="flex h-12 items-center justify-center rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] transition-all duration-100 active:scale-[0.95] active:bg-gray-300 dark:active:bg-[#48484A] cursor-pointer"
        >
          <Delete className="size-5" />
        </button>
      </div>

      {/* Player Up / Down Navigation Row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="ผู้เล่นคนก่อนหน้า (ด้านบน)"
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#3A3A3C] px-4 text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
        >
          <ChevronUp className="size-4.5 stroke-[2.5]" />
          <span>คนบน</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex h-12 flex-1 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-4 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-all duration-150 active:scale-[0.98] cursor-pointer"
        >
          {nextPlayerName ? (
            <>
              <span className="truncate">ถัดไป: {nextPlayerName}</span>
              <ChevronDown className="size-4.5 stroke-[2.5] shrink-0" />
            </>
          ) : (
            <>
              <Check className="size-4.5 stroke-[2.5] shrink-0" />
              <span>เสร็จสิ้น</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
