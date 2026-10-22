"use client";

// Round score multiplier.
// Ultra-Premium iOS 18 Aesthetic:
// - Inactive pills: bg-white border border-gray-200 text-gray-800 shadow-sm
// - Active pill: vibrant blue gradient (from-[#2E8BFF] to-[#007AFF]) with white text, no border, and soft shadow
// - Sized at h-12 (min 48px), rounded-2xl, and active:scale-95 feedback.
import { Dices } from "lucide-react";

export const MULTIPLIERS = [1, 2, 4, 5, 8, 10, 20, 50] as const;

export function MultiplierPicker({
  value,
  onChange,
  onRandomize,
  isRandom,
}: {
  value: number;
  onChange: (value: number) => void;
  onRandomize: () => void;
  isRandom: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {MULTIPLIERS.map((m) => {
          const active = !isRandom && value === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              aria-pressed={active}
              className={`flex h-10 sm:h-11 w-full items-center justify-center rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold tabular-nums transition-all duration-150 ease-out ios-spring-button cursor-pointer ${
                active
                  ? "bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-md shadow-blue-500/20 border-0 hover:opacity-90"
                  : "bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-[#38383A] text-gray-800 dark:text-[#F2F2F7] shadow-2xs hover:bg-gray-50 dark:hover:bg-[#2C2C2E]"
              }`}
            >
              x{m}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onRandomize}
          aria-pressed={isRandom}
          className={`col-span-2 flex h-10 sm:h-11 w-full items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl px-2 text-sm sm:text-base font-semibold transition-all duration-150 ease-out ios-spring-button cursor-pointer ${
            isRandom
              ? "bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-md shadow-blue-500/20 border-0 hover:opacity-90"
              : "bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-[#38383A] text-[#007AFF] shadow-2xs hover:bg-blue-50/50 dark:hover:bg-blue-950/30 active:bg-blue-50 dark:active:bg-blue-950/50"
          }`}
        >
          <Dices className="size-4 sm:size-4.5 shrink-0" />
          <span>สุ่ม</span>
        </button>
      </div>
    </div>
  );
}
