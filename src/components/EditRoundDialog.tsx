"use client";

// Edit one saved round: change the multiplier and each player's raw score.
// History only stores net scores, so the raw scores shown are the equivalent
// set recovered by deriveRawScores (same net result, lowest score = 0).
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
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
  const playerIds = useMemo(() => Object.keys(entry.playerScores), [entry]);

  const [multiplier, setMultiplier] = useState(entry.multiplier);
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const raw = deriveRawScores(entry.playerScores, entry.multiplier);
    return Object.fromEntries(
      playerIds.map((id) => [id, raw[id] === 0 ? "" : String(raw[id])]),
    );
  });
  const [negatives, setNegatives] = useState<Record<string, boolean>>({});
  const [activePlayerId, setActivePlayerId] = useState<string>(
    () => playerIds[0] ?? "",
  );
  const [isMobileKeypadOpen, setIsMobileKeypadOpen] = useState<boolean>(false);
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

  function selectPlayer(id: string) {
    setActivePlayerId(id);
    setIsMobileKeypadOpen(true);
  }

  function updateScore(id: string, value: string) {
    const digits = value.replace(/\D+/g, "").replace(/^0+(?=\d)/, "");
    setInputs((current) => ({ ...current, [id]: digits }));
    if (error) setError(null);
  }

  function toggleSign(id: string) {
    setNegatives((current) => ({ ...current, [id]: !current[id] }));
    if (error) setError(null);
  }

  function goToPrevPlayer(index: number) {
    const prevId = playerIds[index - 1];
    if (prevId) {
      setActivePlayerId(prevId);
      setIsMobileKeypadOpen(true);
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

  function advanceFromPlayer(index: number) {
    const nextId = playerIds[index + 1];
    if (nextId) {
      setActivePlayerId(nextId);
      setIsMobileKeypadOpen(true);
    }
  }

  // Physical keyboard support on desktop without triggering iOS focus-scroll jumps
  useEffect(() => {
    if (!activePlayerId || busy) return;
    function onWindowKeyDown(event: KeyboardEvent) {
      const index = playerIds.findIndex((id) => id === activePlayerId);
      if (index < 0) return;
      const id = playerIds[index];

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        const currentDigits = inputs[id] ?? "";
        const digits = `${currentDigits}${event.key}`
          .replace(/\D+/g, "")
          .replace(/^0+(?=\d)/, "");
        setInputs((current) => ({ ...current, [id]: digits }));
        if (error) setError(null);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        const currentDigits = inputs[id] ?? "";
        setInputs((current) => ({
          ...current,
          [id]: currentDigits.slice(0, -1),
        }));
        if (error) setError(null);
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        setNegatives((current) => ({ ...current, [id]: !current[id] }));
        if (error) setError(null);
        return;
      }
      if (event.key === "+") {
        event.preventDefault();
        setNegatives((current) => ({ ...current, [id]: false }));
        if (error) setError(null);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        const prevId = playerIds[index - 1];
        if (prevId) setActivePlayerId(prevId);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextId = playerIds[index + 1];
        if (nextId) setActivePlayerId(nextId);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const nextId = playerIds[index + 1];
        if (nextId) setActivePlayerId(nextId);
        else if (changed && !busy) void handleSave();
      }
    }
    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlayerId, busy, changed, error, inputs, playerIds]);

  const activeIndex = Math.max(
    0,
    playerIds.findIndex((id) => id === activePlayerId),
  );
  const activeId = playerIds[activeIndex] ?? playerIds[0];
  const activePlayer = activeId
    ? players.find((p) => p.id === activeId)
    : undefined;
  const nextId = playerIds[activeIndex + 1];
  const currentDigits = activeId ? (inputs[activeId] ?? "") : "";
  const activeIsNegative = activeId ? Boolean(negatives[activeId]) : false;
  const activeDisplay =
    currentDigits && currentDigits !== "0"
      ? activeIsNegative
        ? `-${currentDigits}`
        : currentDigits
      : currentDigits;

  const keypadElement = activeId ? (
    <ScoreKeypad
      activePlayer={activePlayer}
      activePlayerName={activePlayer ? activePlayer.name : "(ถูกลบ)"}
      displayValue={activeDisplay}
      hasPrev={activeIndex > 0}
      hasNext={Boolean(nextId)}
      isNegative={activeIsNegative}
      onDigit={(digit) => updateScore(activeId, `${currentDigits}${digit}`)}
      onBackspace={() => updateScore(activeId, currentDigits.slice(0, -1))}
      onToggleSign={() => toggleSign(activeId)}
      onPrev={() => goToPrevPlayer(activeIndex)}
      onNext={() => advanceFromPlayer(activeIndex)}
    />
  ) : null;

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
      className="m-auto max-h-[92dvh] w-[min(26rem,calc(100vw-1.5rem))] md:w-[min(46rem,calc(100vw-3rem))] overflow-y-auto rounded-[24px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-0 text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-md"
    >
      <div className="flex flex-col gap-4 sm:gap-5 p-5 sm:p-6">
        {/* 1. Full-Width Top Header (Close button at actual top-right corner) */}
        <div className="flex items-center justify-between gap-3">
          <h2
            id="edit-round-title"
            className="text-base sm:text-lg font-semibold leading-snug tracking-tight"
          >
            แก้ไขรอบนี้
          </h2>
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            aria-label="ปิด"
            className="flex size-10 min-h-[40px] min-w-[40px] items-center justify-center -mr-1.5 rounded-full text-[#8E8E93] dark:text-[#98989D] transition-all duration-200 ease-out active:scale-[0.97] hover:bg-black/[0.04] hover:text-[#1C1C1E] dark:hover:bg-white/[0.06] dark:hover:text-[#F2F2F7] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 2. Full-Width Multiplier Bar (Single sleek row on iPad/PC, 4-col on iPhone) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D]">
            ตัวคูณ
          </span>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5 sm:gap-2">
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

        {/* 3. Symmetrical 2-Column Body on iPad/PC (Equal Height) */}
        <div className="grid gap-4 md:grid-cols-[1.08fr_1fr] md:items-stretch">
          <ul className="flex h-full flex-col overflow-hidden rounded-[18px] border border-black/[0.05] dark:border-[#38383A] divide-y divide-gray-100/80 dark:divide-[#38383A]">
            {playerIds.map((id) => {
              const player = players.find((p) => p.id === id);
              const net = result.netScores[id] ?? 0;
              const isNegative = Boolean(negatives[id]);
              const isActive = activeId === id;
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
                  onClick={() => selectPlayer(id)}
                  className={`flex flex-1 min-h-[58px] items-center gap-2.5 sm:gap-3 px-3.5 py-2.5 transition-colors cursor-pointer ${
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
                  <input
                    id={`edit-score-${id}`}
                    type="text"
                    readOnly
                    inputMode="none"
                    autoComplete="off"
                    placeholder={isNegative ? "-0" : "0"}
                    value={displayValue}
                    onClick={() => selectPlayer(id)}
                    className={`h-11 w-28 rounded-xl border bg-white dark:bg-[#2C2C2E] px-3.5 py-1.5 text-right text-base font-bold tabular-nums outline-none shadow-xs transition-all cursor-pointer select-none shrink-0 ${
                      isNegative
                        ? `border-[#FF3B30]/45 dark:border-[#FF453A]/50 text-[#FF3B30] dark:text-[#FF453A] placeholder:text-[#FF3B30]/45 dark:placeholder:text-[#FF453A]/45 ${
                            isActive ? "border-[#FF3B30] ring-2 ring-red-500/20" : ""
                          }`
                        : `border-black/[0.06] dark:border-[#38383A] text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93]/60 dark:placeholder:text-[#98989D]/60 ${
                            isActive ? "border-[#007AFF] ring-2 ring-blue-500/20" : ""
                          }`
                    }`}
                  />
                </li>
              );
            })}
          </ul>

          {/* Mobile Keypad (stacked below players on iPhone) */}
          {isMobileKeypadOpen ? (
            <div className="md:hidden">{keypadElement}</div>
          ) : null}

          {/* iPad / PC Keypad (Right Column, Equal Height with Player List) */}
          <div className="hidden md:block h-full">{keypadElement}</div>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-200/80 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/10 p-3 text-sm text-[#FF3B30] dark:text-[#FF453A]"
          >
            {error}
          </p>
        ) : null}

        {/* 4. Full-Width Symmetrical Footer */}
        <div className="flex flex-col-reverse gap-2.5 sm:grid sm:grid-cols-2 sm:gap-4 border-t border-black/[0.04] dark:border-[#38383A] pt-4">
          <Button variant="secondary" onClick={dismiss} disabled={busy}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} disabled={busy || !changed}>
            {busy ? <Loader2 className="size-4.5 animate-spin" aria-hidden /> : null}
            {busy ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
