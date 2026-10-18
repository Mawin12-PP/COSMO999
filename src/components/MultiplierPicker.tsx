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
      <div className="flex flex-wrap gap-2.5">
        {MULTIPLIERS.map((m) => {
          const active = value === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              disabled={rolling}
              aria-pressed={active}
              className={`flex h-12 min-w-[54px] sm:min-w-[62px] items-center justify-center rounded-2xl px-3.5 py-2.5 text-base font-bold tabular-nums transition-all active:scale-95 disabled:opacity-50 ${
                active
                  ? "bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-md shadow-blue-500/20 border-0"
                  : "bg-white border border-gray-200 text-gray-800 shadow-sm active:bg-gray-100 hover:bg-gray-50"
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
          className={`flex h-12 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-base font-bold transition-all active:scale-95 disabled:opacity-70 ${
            isRandom
              ? "bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-md shadow-blue-500/20 border-0"
              : "bg-white border border-gray-200 text-[#007AFF] shadow-sm active:bg-blue-50 hover:bg-blue-50/50"
          }`}
        >
          <Dices key={rollId} className={`size-5 ${rolling ? "dice-tumble" : ""}`} />
          สุ่ม
        </button>
      </div>

      {rolling ? (
        <p className="text-xs font-medium text-[#8E8E93]">กำลังทอยลูกเต๋า...</p>
      ) : isRandom ? (
        <p className="text-xs text-[#8E8E93] tabular-nums">
          รอบนี้สุ่มตัวคูณเป็น <span className="font-bold text-[#007AFF]">x{value}</span>
        </p>
      ) : null}
    </div>
  );
}
