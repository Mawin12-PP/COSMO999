"use client";

// Round score multiplier.
// Ultra-Premium iOS 18 Aesthetic:
// - Inactive pills: bg-white border border-gray-200 text-gray-800 shadow-sm
// - Active pill: vibrant blue gradient (from-[#2E8BFF] to-[#007AFF]) with white text, no border, and soft shadow
// - Sized at h-12 (min 48px), rounded-2xl, and active:scale-95 feedback.
import { useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";

export const MULTIPLIERS = [1, 2, 4, 5, 8, 10, 20, 50] as const;

const ROLL_MS = 520;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

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
  const [rolling, setRolling] = useState(false);
  const [rollId, setRollId] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleRandomize() {
    if (rolling) return;

    if (prefersReducedMotion()) {
      onRandomize();
      return;
    }

    setRolling(true);
    setRollId((id) => id + 1);
    timerRef.current = setTimeout(() => {
      onRandomize();
      setRolling(false);
      timerRef.current = null;
    }, ROLL_MS);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {MULTIPLIERS.map((m) => {
          const active = value === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              disabled={rolling}
              aria-pressed={active}
              className={`flex h-10 sm:h-11 w-full items-center justify-center rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold tabular-nums transition-all duration-150 ease-out ios-spring-button disabled:opacity-50 cursor-pointer ${
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
          onClick={handleRandomize}
          disabled={rolling}
          aria-pressed={isRandom}
          className={`col-span-2 flex h-10 sm:h-11 w-full items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl px-2 text-sm sm:text-base font-semibold transition-all duration-150 ease-out ios-spring-button disabled:opacity-70 cursor-pointer ${
            isRandom
              ? "bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-md shadow-blue-500/20 border-0 hover:opacity-90"
              : "bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-[#38383A] text-[#007AFF] shadow-2xs hover:bg-blue-50/50 dark:hover:bg-blue-950/30 active:bg-blue-50 dark:active:bg-blue-950/50"
          }`}
        >
          <Dices key={rollId} className={`size-4 sm:size-4.5 shrink-0 ${rolling ? "dice-tumble" : ""}`} />
          <span>สุ่ม</span>
        </button>
      </div>

      {rolling ? (
        <p className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D]">กำลังทอยลูกเต๋า...</p>
      ) : isRandom ? (
        <p className="text-xs text-[#8E8E93] dark:text-[#98989D] tabular-nums">
          รอบนี้สุ่มตัวคูณเป็น <span className="font-bold text-[#007AFF]">x{value}</span>
        </p>
      ) : null}
    </div>
  );
}
