"use client";

// History page client component. Shows all match history entries sorted
// newest-first. Converted to an "iOS Grouped List": a single white container
// (bg-white rounded-2xl overflow-hidden) separated by thin dividers (divide-y divide-gray-200).
// Mobile-first iOS guidelines: min 44x44px touch targets on buttons, active states,
// responsive padding, and clean typography.
import { useState } from "react";
import {
  ClipboardList,
  Loader2,
  RefreshCw,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useHistory } from "@/hooks/useHistory";
import { usePlayers } from "@/hooks/usePlayers";
import { undoRound, recalculateScores } from "@/lib/rounds";
import type { HistoryEntry, Player } from "@/types/models";

function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  return `${score}`;
}

function scoreTone(score: number): string {
  if (score > 0) return "text-[#34C759]";
  if (score < 0) return "text-[#FF3B30]";
  return "text-[#8E8E93]";
}

function HistoryRow({
  entry,
  players,
  onUndo,
}: {
  entry: HistoryEntry;
  players: Player[];
  onUndo: (matchId: string) => void;
}) {
  const timeStr = new Date(entry.timestamp).toLocaleString("th-TH");

  return (
    <article className="flex flex-col gap-3.5 p-4 sm:p-5 transition-colors hover:bg-gray-50/60">
      {/* Header row: time + group name + multiplier badge */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <time
            dateTime={entry.timestamp}
            className="text-xs text-[#8E8E93] tabular-nums"
          >
            {timeStr}
          </time>
          <span className="text-base font-semibold text-[#1C1C1E]">{entry.groupName}</span>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50/80 border border-blue-500/20 px-3 py-1 text-xs font-semibold tabular-nums text-[#007AFF]">
          x{entry.multiplier}
        </span>
      </div>

      {/* Per-player score chips */}
      <ul className="flex flex-wrap gap-2">
        {Object.entries(entry.playerScores).map(([pId, score]) => {
          const player = players.find((p) => p.id === pId);
          return (
            <li
              key={pId}
              className="flex min-h-[36px] items-center gap-2 rounded-xl border border-black/[0.04] bg-white px-3 py-1.5 shadow-2xs"
            >
              {player ? (
                <PlayerAvatar player={player} className="size-6 text-xs shrink-0" />
              ) : null}
              <span className="text-xs font-semibold text-[#1C1C1E]">
                {player ? player.name : "(ถูกลบ)"}
              </span>
              <span
                className={`text-xs font-bold tabular-nums ${scoreTone(score)}`}
              >
                {formatScore(score)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Undo button for this round (min 44px height for iOS touch guideline) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => onUndo(entry.id)}
          className="flex min-h-[44px] items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 py-2 text-xs font-semibold text-[#8E8E93] shadow-2xs transition-all duration-200 ease-out active:scale-[0.97] hover:border-red-200 hover:bg-red-50 hover:text-[#FF3B30]"
        >
          <Undo2 className="size-4" aria-hidden />
          ยกเลิกผลรอบนี้
        </button>
      </div>
    </article>
  );
}

export function History() {
  const { history, loading, error } = useHistory();
  const { players } = usePlayers();

  const [undoPending, setUndoPending] = useState<string | null>(null);
  const [undoBusy, setUndoBusy] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  const [recalcPending, setRecalcPending] = useState(false);
  const [recalcBusy, setRecalcBusy] = useState(false);
  const [recalcError, setRecalcError] = useState<string | null>(null);

  const sorted = [...history].sort((a, b) => b.id.localeCompare(a.id));

  function handleUndoRequest(matchId: string) {
    setUndoError(null);
    setUndoPending(matchId);
  }

  async function handleUndoConfirm() {
    if (!undoPending) return;
    setUndoBusy(true);
    setUndoError(null);
    const { committed } = await undoRound(undoPending);
    setUndoBusy(false);
    if (committed) {
      setUndoPending(null);
    } else {
      setUndoError("ยกเลิกรอบไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    }
  }

  function handleUndoClose() {
    if (undoBusy) return;
    setUndoPending(null);
    setUndoError(null);
  }

  async function handleRecalcConfirm() {
    setRecalcBusy(true);
    setRecalcError(null);
    const { committed } = await recalculateScores();
    setRecalcBusy(false);
    if (committed) {
      setRecalcPending(false);
    } else {
      setRecalcError("คำนวณใหม่ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    }
  }

  function handleRecalcClose() {
    if (recalcBusy) return;
    setRecalcPending(false);
    setRecalcError(null);
  }

  return (
    <div className="mx-auto max-w-2xl px-1 sm:px-4 py-4 sm:py-6">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1E] sm:text-3xl">
            ประวัติการเล่น
          </h1>
          <p className="mt-1 text-sm text-[#8E8E93]">
            {sorted.length > 0
              ? `${sorted.length} รอบ — เรียงล่าสุดก่อน`
              : "\u00a0"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setRecalcError(null);
            setRecalcPending(true);
          }}
          className="flex min-h-[44px] items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 py-2.5 text-xs font-semibold text-[#8E8E93] shadow-xs transition-all duration-200 ease-out active:scale-[0.97] hover:bg-gray-50 hover:text-[#1C1C1E]"
        >
          <RefreshCw className="size-4" aria-hidden />
          คำนวณคะแนนใหม่จากประวัติ
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div
          className="flex flex-col items-center gap-3 py-20 text-[#8E8E93]"
          aria-live="polite"
          aria-label="กำลังโหลด"
        >
          <Loader2 className="size-8 animate-spin text-[#007AFF]" aria-hidden />
          <span className="text-sm font-medium">กำลังโหลดประวัติ...</span>
        </div>
      ) : error ? (
        <div
          className="flex flex-col items-center gap-3 py-20 text-[#FF3B30]"
          role="alert"
        >
          <TriangleAlert className="size-8" aria-hidden />
          <p className="text-sm font-semibold">โหลดประวัติไม่สำเร็จ</p>
          <p className="text-xs text-[#8E8E93]">
            กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้า
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[20px] border border-black/[0.04] bg-white p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="grid size-14 place-items-center rounded-full bg-black/[0.04] text-[#8E8E93]">
            <ClipboardList className="size-7" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-[#1C1C1E]">ยังไม่มีประวัติการเล่น</p>
            <p className="mt-1 text-sm text-[#8E8E93]">
              บันทึกรอบแรกจากหน้าหลักเพื่อเริ่มติดตามคะแนน
            </p>
          </div>
        </div>
      ) : (
        /* iOS Grouped List */
        <div className="rounded-[20px] border border-black/[0.04] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden divide-y divide-gray-100/80">
          {sorted.map((entry) => (
            <HistoryRow
              key={entry.id}
              entry={entry}
              players={players}
              onUndo={handleUndoRequest}
            />
          ))}
        </div>
      )}

      {/* Undo confirm dialog */}
      {undoPending !== null ? (
        <ConfirmDialog
          title="ยกเลิกผลรอบนี้?"
          description="คะแนนของรอบนี้จะถูกหักออกจากคะแนนรวมของทุกคนที่เล่นในรอบนั้น และรายการในประวัติจะถูกลบออก"
          confirmLabel="ยืนยันยกเลิก"
          destructive
          busy={undoBusy}
          error={undoError}
          onConfirm={handleUndoConfirm}
          onClose={handleUndoClose}
        />
      ) : null}

      {/* Recalculate confirm dialog */}
      {recalcPending ? (
        <ConfirmDialog
          title="คำนวณคะแนนใหม่จากประวัติ?"
          description="คะแนนรวมและคะแนนกลุ่มของทุกคนจะถูกคำนวณใหม่ทั้งหมดจากประวัติ เพื่อให้ตรงกับผลรวมจริง"
          confirmLabel="คำนวณใหม่"
          busy={recalcBusy}
          error={recalcError}
          onConfirm={handleRecalcConfirm}
          onClose={handleRecalcClose}
        />
      ) : null}
    </div>
  );
}
