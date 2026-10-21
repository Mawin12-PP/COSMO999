"use client";

// Step two of starting a round: type each player's raw score, check it, then
// confirm to atomically save it (players + group + history) to Firebase.
// Mobile-first for iPhone/iPad: 48px+ touch targets, generous p-4 padding,
// active:scale-[0.98] feedback, and crisp iOS typography.
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ClipboardCheck,
  Crown,
  Dices,
  Flame,
  PartyPopper,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PreviewDialog } from "@/components/PreviewDialog";
import { generateRoundCommentary } from "@/lib/commentary";
import { saveRound } from "@/lib/rounds";
import { calculateRoundScores, type RoundScoreResult } from "@/lib/scoring";
import { useHistory } from "@/hooks/useHistory";
import type { Player } from "@/types/models";

const MULTIPLIER_CANDIDATES = [1, 2, 4, 5, 8, 10, 20, 50];

function getMultiplierTheme(m: number) {
  if (m >= 50) return { name: "x50", Icon: Crown };
  if (m >= 10) return { name: `x${m}`, Icon: Flame };
  if (m >= 4) return { name: `x${m}`, Icon: Zap };
  if (m >= 2) return { name: `x${m}`, Icon: Sparkles };
  return { name: "ปกติ", Icon: Target };
}

async function fireConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 9999 });
}

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; commentary: string }
  | { status: "error"; message: string };

function parseScore(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

interface CheckedRound {
  rawScores: Record<string, number>;
  result: RoundScoreResult;
}

export function ScoreEntry({
  players,
  multiplier,
  triggerReveal = false,
  liveSessionActive = false,
  sessionId,
  onBack,
  onReset,
}: {
  players: Player[];
  multiplier: number;
  triggerReveal?: boolean;
  liveSessionActive?: boolean;
  sessionId?: string;
  onBack: () => void;
  onReset: () => void;
}) {
  const [displayMultiplier, setDisplayMultiplier] = useState<number>(
    triggerReveal ? 1 : multiplier,
  );
  const [isRevealing, setIsRevealing] = useState<boolean>(Boolean(triggerReveal));
  const [isLanded, setIsLanded] = useState<boolean>(!triggerReveal);
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<CheckedRound | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { history } = useHistory();

  // Multiplier Reveal Suspense Animation
  useEffect(() => {
    if (!triggerReveal) {
      setDisplayMultiplier(multiplier);
      setIsRevealing(false);
      setIsLanded(true);
      return;
    }

    setIsRevealing(true);
    setIsLanded(false);

    const steps = [
      { delay: 100 },
      { delay: 220 },
      { delay: 360 },
      { delay: 520 },
      { delay: 700 },
      { delay: 900 },
      { delay: 1120 },
      { delay: 1360, isFinal: true },
    ];

    const timers: NodeJS.Timeout[] = [];

    steps.forEach((step) => {
      const t = setTimeout(() => {
        if (step.isFinal) {
          setDisplayMultiplier(multiplier);
          setIsRevealing(false);
          setIsLanded(true);
        } else {
          const rand =
            MULTIPLIER_CANDIDATES[
              Math.floor(Math.random() * MULTIPLIER_CANDIDATES.length)
            ];
          setDisplayMultiplier(rand);
        }
      }, step.delay);
      timers.push(t);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [triggerReveal, multiplier]);

  const theme = getMultiplierTheme(displayMultiplier);

  useEffect(() => {
    if (isRevealing) return;
    const isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    if (!isTouch) {
      const firstId = players[0]?.id;
      if (firstId) inputRefs.current[firstId]?.focus();
    }
  }, [players, isRevealing]);

  function updateScore(id: string, value: string) {
    setRawInputs((current) => ({ ...current, [id]: value }));
    if (error) setError(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const nextId = players[index + 1]?.id;
    if (nextId) inputRefs.current[nextId]?.focus();
    else event.currentTarget.blur();
  }

  function handleCheck() {
    const rawScores: Record<string, number> = {};
    for (const player of players) {
      rawScores[player.id] = parseScore(rawInputs[player.id] ?? "");
    }

    const result = calculateRoundScores(
      players.map((player) => player.id),
      rawScores,
      multiplier,
    );

    if (result.totalNetScore !== 0) {
      setError(
        `ผลรวมคะแนนสุทธิไม่เท่ากับ 0 (ได้ ${result.totalNetScore}) กรุณาตรวจสอบคะแนนอีกครั้ง`,
      );
      return;
    }

    setError(null);
    setChecked({ rawScores, result });
  }

  async function handleConfirm() {
    if (!checked || saveState.status === "saving") return;

    setSaveState({ status: "saving" });
    const commentary = generateRoundCommentary(checked.result.netScores, players, history);

    const outcome = await saveRound({
      playerIds: players.map((player) => player.id),
      netScores: checked.result.netScores,
      multiplier,
      commentary,
      sessionId,
    });

    if (!outcome.committed) {
      setSaveState({
        status: "error",
        message: "บันทึกไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
      });
      return;
    }

    if (checked.result.hasPositive) void fireConfetti();
    setChecked(null);
    setSaveState({ status: "saved", commentary });
  }

  if (saveState.status === "saved") {
    return (
      <section className="reveal flex flex-col items-center gap-5 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
        <span className="grid size-16 place-items-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] shadow-xs">
          <PartyPopper className="size-8" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">บันทึกรอบแล้ว!</h2>
          <p className="text-sm text-[#8E8E93] dark:text-[#98989D]">{saveState.commentary}</p>
        </div>
        <div className="flex flex-col gap-2.5 w-full max-w-xs mt-3">
          <button
            type="button"
            onClick={onReset}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 ease-out ios-spring-button hover:opacity-90"
          >
            <RotateCcw className="size-4.5" />
            {liveSessionActive ? "กลับไปที่โต๊ะ (ดูผลรวม)" : "เริ่มรอบใหม่"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="reveal flex flex-col gap-5 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
      {/* Header with Title (Left) and Compact Multiplier Box (Right) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid size-9 sm:size-10 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] shadow-xs shrink-0">
            <ClipboardCheck className="size-4.5 sm:size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7] truncate">
              กรอกคะแนน
            </h2>
            <p className="text-xs text-[#8E8E93] dark:text-[#98989D]">
              ผู้เล่น {players.length} คน
            </p>
          </div>
        </div>

        {/* Compact Multiplier Frame (Placed at Top-Right, Default Project Theme) */}
        <div
          className={`flex items-center gap-2 rounded-2xl border border-black/[0.06] dark:border-[#38383A] bg-black/[0.03] dark:bg-white/[0.05] px-3 sm:px-3.5 py-1.5 shadow-xs transition-all duration-300 shrink-0 ${
            isLanded ? "ring-2 ring-blue-500/25 dark:ring-blue-500/30" : ""
          }`}
        >
          <span className="grid size-7 sm:size-8 place-items-center rounded-xl bg-white dark:bg-[#1C1C1E] text-[#007AFF] dark:text-[#2E8BFF] border border-black/[0.04] dark:border-white/5 shadow-xs">
            {isRevealing ? (
              <Dices className="size-3.5 sm:size-4 animate-spin text-[#007AFF]" />
            ) : (
              <theme.Icon className="size-3.5 sm:size-4 text-[#007AFF] dark:text-[#2E8BFF]" />
            )}
          </span>
          <span
            className={`text-base sm:text-lg font-black tabular-nums tracking-tight text-[#007AFF] dark:text-[#2E8BFF] transition-transform duration-300 ${
              isLanded ? "scale-105" : "scale-100"
            }`}
          >
            x{displayMultiplier}
          </span>
        </div>
      </div>

      <ul className="overflow-hidden rounded-[16px] border border-black/[0.04] dark:border-[#38383A] divide-y divide-gray-100/80 dark:divide-[#38383A] bg-white dark:bg-[#1C1C1E]">
        {players.map((player, index) => (
          <li
            key={player.id}
            className="flex min-h-[56px] items-center gap-3.5 px-4 py-3 transition-colors hover:bg-gray-50/60 dark:hover:bg-[#2C2C2E]/40 focus-within:bg-blue-50/20 dark:focus-within:bg-blue-950/20"
          >
            <PlayerAvatar player={player} className="size-10 text-sm shrink-0" />
            <label
              htmlFor={`score-${player.id}`}
              className="min-w-0 flex-1 truncate text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]"
            >
              {player.name}
            </label>
            <input
              id={`score-${player.id}`}
              ref={(node) => {
                inputRefs.current[player.id] = node;
              }}
              type="text"
              autoComplete="off"
              placeholder="0"
              value={rawInputs[player.id] ?? ""}
              onChange={(event) => updateScore(player.id, event.target.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className="h-11 w-28 rounded-xl border border-black/[0.06] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] px-3.5 py-1.5 text-right text-lg font-bold tabular-nums text-[#1C1C1E] dark:text-[#F2F2F7] outline-none shadow-xs transition-all placeholder:text-[#8E8E93]/60 dark:placeholder:text-[#98989D]/60 focus:border-[#007AFF] focus:ring-2 focus:ring-blue-500/20"
            />
          </li>
        ))}
      </ul>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200/80 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/30 p-4 text-sm font-medium text-[#FF3B30] backdrop-blur-sm"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2.5 sm:gap-3 border-t border-black/[0.04] dark:border-[#38383A] pt-5 sm:flex-row-reverse">
        <button
          type="button"
          onClick={handleCheck}
          className="flex min-h-[44px] sm:min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 ease-out active:scale-[0.97] hover:opacity-90 cursor-pointer"
        >
          <ClipboardCheck className="size-4.5" />
          บันทึกคะแนน
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[44px] sm:min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border border-black/[0.06] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs transition-all duration-200 ease-out active:scale-[0.97] hover:bg-gray-50 dark:hover:bg-[#38383A] cursor-pointer"
        >
          <ArrowLeft className="size-4.5" />
          ย้อนกลับ
        </button>
      </div>

      {checked ? (
        <PreviewDialog
          players={players}
          rawScores={checked.rawScores}
          result={checked.result}
          multiplier={multiplier}
          saving={saveState.status === "saving"}
          error={saveState.status === "error" ? saveState.message : null}
          onClose={() => {
            setChecked(null);
            setSaveState({ status: "idle" });
          }}
          onConfirm={handleConfirm}
        />
      ) : null}
    </section>
  );
}
