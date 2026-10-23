"use client";

// Edit one saved round: change the multiplier and each player's raw score.
// History only stores net scores, so the raw scores shown are the equivalent
// set recovered by deriveRawScores (same net result, lowest score = 0).
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/Button";
import { MULTIPLIERS } from "@/components/MultiplierPicker";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ScoreKeypad } from "@/components/ScoreKeypad";
import { generateRoundCommentary } from "@/lib/commentary";
import { editRound } from "@/lib/rounds";
import { calculateRoundScores, deriveRawScores } from "@/lib/scoring";
import type { HistoryEntry, Player } from "@/types/models";
import { scoreTone as netTone } from "@/lib/format";

function parseScore(value: string, isNegative = false): number {
  const digits = value.replace(/\D+/g, "");
  const parsed = Number.parseInt(digits, 10);
  if (Number.isNaN(parsed) || parsed === 0) return 0;
  return isNegative ? -parsed : parsed;
}

function formatNet(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

export function EditRoundDialog({
  entry,
  players,
  history,
  onClose,
}: {
  entry: HistoryEntry;
  players: Player[];
  history: HistoryEntry[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const playerIds = useMemo(() => Object.keys(entry.playerScores), [entry]);

  const [multiplier, setMultiplier] = useState(entry.multiplier);
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const raw = deriveRawScores(entry.playerScores, entry.multiplier);
    return Object.fromEntries(
      playerIds.map((id) => [id, raw[id] === 0 ? "" : String(raw[id])]),
    );
  });
  const [negatives, setNegatives] = useState<Record<string, boolean>>({});
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  const result = useMemo(() => {
    const raw: Record<string, number> = {};
    for (const id of playerIds) {
      raw[id] = parseScore(inputs[id] ?? "", Boolean(negatives[id]));
    }
    return calculateRoundScores(playerIds, raw, multiplier);
  }, [playerIds, inputs, negatives, multiplier]);

  function updateScore(id: string, value: string) {
    const digits = value.replace(/\D+/g, "").replace(/^0+(?=\d)/, "");
    setInputs((current) => ({ ...current, [id]: digits }));
    if (error) setError(null);
  }

  function toggleSign(id: string) {
    setNegatives((current) => ({ ...current, [id]: !current[id] }));
    if (error) setError(null);
  }

  function advanceFromPlayer(index: number) {
    const nextId = playerIds[index + 1];
    if (nextId) {
      setActivePlayerId(nextId);
      inputRefs.current[nextId]?.focus();
    } else {
      setActivePlayerId(null);
      const currentId = playerIds[index];
      if (currentId) inputRefs.current[currentId]?.blur();
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    id: string,
    index: number,
  ) {
    if (event.key === "-") {
      event.preventDefault();
      toggleSign(id);
      return;
    }
    if (event.key === "+") {
      event.preventDefault();
      setNegatives((current) => ({ ...current, [id]: false }));
      if (error) setError(null);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      advanceFromPlayer(index);
    }
  }

  const changed =
    multiplier !== entry.multiplier ||
    playerIds.some((id) => result.netScores[id] !== entry.playerScores[id]);

  function dismiss() {
    if (busy) return;
    dialogRef.current?.close();
    onClose();
  }

  async function handleSave() {
    if (busy || !changed) return;
    setBusy(true);
    setError(null);
    const others = history.filter((h) => h.id !== entry.id);
    const commentary = generateRoundCommentary(
      result.netScores,
      players,
      others,
    );
    const { committed } = await editRound(
      entry.id,
      result.netScores,
      multiplier,
      commentary,
    );
    setBusy(false);
    if (committed) {
      dismiss();
    } else {
      setError("บันทึกการแก้ไขไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
      aria-labelledby="edit-round-title"
      className="m-auto max-h-[92dvh] w-[min(26rem,calc(100vw-2rem))] overflow-y-auto rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-0 text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2
            id="edit-round-title"
            className="text-base font-semibold leading-snug"
          >
            แก้ไขรอบนี้
          </h2>
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            aria-label="ปิด"
            className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center -mr-2 -mt-2 rounded-full text-[#8E8E93] dark:text-[#98989D] transition-all duration-200 ease-out active:scale-[0.97] hover:bg-black/[0.04] hover:text-[#1C1C1E] dark:hover:bg-white/[0.06] dark:hover:text-[#F2F2F7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Multiplier */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D]">
            ตัวคูณ
          </span>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {MULTIPLIERS.map((m) => {
              const active = multiplier === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMultiplier(m)}
                  aria-pressed={active}
                  className={`flex h-10 items-center justify-center rounded-xl text-sm font-semibold tabular-nums transition-all duration-150 ease-out cursor-pointer ${
                    active
                      ? "bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-md shadow-blue-500/20"
                      : "border border-black/[0.08] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] text-gray-800 dark:text-[#F2F2F7] shadow-2xs hover:bg-gray-50 dark:hover:bg-[#2C2C2E]"
                  }`}
                >
                  x{m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Raw scores with live net preview */}
        <ul className="overflow-hidden rounded-[16px] border border-black/[0.04] dark:border-[#38383A] divide-y divide-gray-100/80 dark:divide-[#38383A]">
          {playerIds.map((id, index) => {
            const player = players.find((p) => p.id === id);
            const net = result.netScores[id] ?? 0;
            const isNegative = Boolean(negatives[id]);
            const isActive = activePlayerId === id;
            const digits = inputs[id] ?? "";
            const displayValue =
              digits && digits !== "0"
                ? isNegative
                  ? `-${digits}`
                  : digits
                : digits;
            return (
              <li
                key={id}
                onClick={() => {
                  setActivePlayerId(id);
                  inputRefs.current[id]?.focus();
                }}
                className={`flex min-h-[56px] items-center gap-2.5 sm:gap-3 px-3.5 py-2.5 transition-colors cursor-pointer ${
                  isActive
                    ? "bg-blue-50/40 dark:bg-blue-950/25"
                    : "hover:bg-gray-50/60 dark:hover:bg-[#2C2C2E]/40"
                }`}
              >
                {player ? (
                  <PlayerAvatar player={player} className="size-9 text-sm shrink-0" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`edit-score-${id}`}
                    className="block truncate text-sm font-semibold cursor-pointer"
                  >
                    {player ? player.name : "(ถูกลบ)"}
                  </label>
                  <span className={`text-xs font-bold tabular-nums ${netTone(net)}`}>
                    {formatNet(net)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActivePlayerId(id);
                      toggleSign(id);
                    }}
                    aria-pressed={isNegative}
                    aria-label={
                      isNegative
                        ? `คะแนนลบ (${player ? player.name : id}) กดเพื่อเปลี่ยนเป็นบวก`
                        : `คะแนนบวก (${player ? player.name : id}) กดเพื่อเปลี่ยนเป็นลบ`
                    }
                    className={`grid size-11 place-items-center rounded-xl border transition-all duration-150 active:scale-[0.94] cursor-pointer select-none ${
                      isNegative
                        ? "border-[#FF3B30]/30 bg-[#FF3B30]/12 text-[#FF3B30] dark:border-[#FF453A]/35 dark:bg-[#FF453A]/15 dark:text-[#FF453A]"
                        : "border-[#34C759]/25 bg-[#34C759]/10 text-[#34C759] dark:border-[#34C759]/30 dark:bg-[#34C759]/15"
                    }`}
                  >
                    {isNegative ? (
                      <Minus className="size-5 stroke-[2.75]" />
                    ) : (
                      <Plus className="size-5 stroke-[2.75]" />
                    )}
                  </button>
                  <input
                    id={`edit-score-${id}`}
                    ref={(node) => {
                      inputRefs.current[id] = node;
                    }}
                    type="text"
                    inputMode="none"
                    autoComplete="off"
                    placeholder={isNegative ? "-0" : "0"}
                    value={displayValue}
                    onFocus={() => setActivePlayerId(id)}
                    onChange={(event) => updateScore(id, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(event, id, index)}
                    className={`h-11 w-24 rounded-xl border bg-white dark:bg-[#2C2C2E] px-3 py-1.5 text-right text-base font-bold tabular-nums outline-none shadow-xs transition-all ${
                      isNegative
                        ? `border-[#FF3B30]/35 dark:border-[#FF453A]/40 text-[#FF3B30] dark:text-[#FF453A] placeholder:text-[#FF3B30]/45 dark:placeholder:text-[#FF453A]/45 ${
                            isActive ? "border-[#FF3B30] ring-2 ring-red-500/20" : ""
                          }`
                        : `border-black/[0.06] dark:border-[#38383A] text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93]/60 dark:placeholder:text-[#98989D]/60 ${
                            isActive ? "border-[#007AFF] ring-2 ring-blue-500/20" : ""
                          }`
                    }`}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        {(() => {
          const activeIndex = playerIds.findIndex((id) => id === activePlayerId);
          if (activeIndex < 0) return null;
          const activeId = playerIds[activeIndex];
          const activePlayer = players.find((p) => p.id === activeId);
          const nextId = playerIds[activeIndex + 1];
          const nextPlayer = nextId ? players.find((p) => p.id === nextId) : undefined;
          const currentDigits = inputs[activeId] ?? "";
          return (
            <ScoreKeypad
              activePlayerName={activePlayer ? activePlayer.name : "(ถูกลบ)"}
              nextPlayerName={nextId ? (nextPlayer ? nextPlayer.name : "(ถูกลบ)") : undefined}
              isNegative={Boolean(negatives[activeId])}
              onDigit={(digit) =>
                updateScore(activeId, `${currentDigits}${digit}`)
              }
              onBackspace={() =>
                updateScore(activeId, currentDigits.slice(0, -1))
              }
              onToggleSign={() => toggleSign(activeId)}
              onNext={() => advanceFromPlayer(activeIndex)}
              onClose={() => {
                setActivePlayerId(null);
                inputRefs.current[activeId]?.blur();
              }}
            />
          );
        })()}

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-200/80 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/10 p-3 text-sm text-[#FF3B30] dark:text-[#FF453A]"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button onClick={handleSave} disabled={busy || !changed} className="flex-1">
            {busy ? <Loader2 className="size-4.5 animate-spin" aria-hidden /> : null}
            {busy ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </Button>
          <Button variant="secondary" onClick={dismiss} disabled={busy} className="flex-1">
            ยกเลิก
          </Button>
        </div>
      </div>
    </dialog>
  );
}
