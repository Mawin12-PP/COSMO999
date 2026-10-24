"use client";

// History page client component. Shows all match history entries sorted
// newest-first. Converted to an "iOS Grouped List": a single white container
// (bg-white rounded-2xl overflow-hidden) separated by thin dividers (divide-y divide-gray-200).
// Mobile-first iOS guidelines: min 44x44px touch targets on buttons, active states,
// responsive padding, and clean typography.
import { useState } from "react";
import {
  ChevronDown,
  ClipboardList,
  Clock,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EditRoundDialog } from "@/components/EditRoundDialog";
import { getPlayerGridCols } from "@/components/LatestRoundCard";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useHistory } from "@/hooks/useHistory";
import { usePlayers } from "@/hooks/usePlayers";
import { undoRound, recalculateScores } from "@/lib/rounds";
import type { HistoryEntry, Player } from "@/types/models";
import { scoreTone } from "@/lib/format";

function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  return `${score}`;
}

function HistoryRow({
  entry,
  players,
  onUndo,
  onEdit,
}: {
  entry: HistoryEntry;
  players: Player[];
  onUndo: (matchId: string) => void;
  onEdit: (entry: HistoryEntry) => void;
}) {
  const timeStr = new Date(entry.timestamp).toLocaleString("th-TH");

  return (
    <article className="flex flex-col gap-3.5 p-4 sm:p-5 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]">
      {/* Header row: time + multiplier badge + trash button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-[#8E8E93] dark:text-[#98989D]">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          <time dateTime={entry.timestamp} className="tabular-nums font-medium">
            {timeStr}
          </time>
        </div>

        {/* Right side: multiplier badge + trash button */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center rounded-full bg-[#007AFF]/10 dark:bg-[#007AFF]/20 border border-[#007AFF]/25 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#007AFF]">
            x{entry.multiplier}
          </span>
          <button
            type="button"
            title="แก้ไขรอบนี้"
            aria-label="แก้ไขรอบนี้"
            onClick={() => onEdit(entry)}
            className="flex size-8 sm:size-8.5 min-h-[32px] min-w-[32px] items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#98989D] shadow-2xs transition-all duration-200 ease-out active:scale-90 hover:border-blue-200 dark:hover:border-blue-900/40 hover:bg-blue-50/80 dark:hover:bg-blue-950/30 hover:text-[#007AFF] dark:hover:text-[#2E8BFF] cursor-pointer"
          >
            <Pencil className="size-3.5 sm:size-4" aria-hidden />
          </button>
          <button
            type="button"
            title="ลบ / ยกเลิกผลรอบนี้"
            aria-label="ลบหรือยกเลิกผลรอบนี้"
            onClick={() => onUndo(entry.id)}
            className="flex size-8 sm:size-8.5 min-h-[32px] min-w-[32px] items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#98989D] shadow-2xs transition-all duration-200 ease-out active:scale-90 hover:border-red-200 dark:hover:border-red-900/40 hover:bg-red-50/80 dark:hover:bg-red-950/30 hover:text-[#FF3B30] dark:hover:text-[#FF453A] cursor-pointer"
          >
            <Trash2 className="size-3.5 sm:size-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Per-player score chips */}
      <ul className={`grid gap-2 ${getPlayerGridCols(Object.keys(entry.playerScores).length)}`}>
        {Object.entries(entry.playerScores).map(([pId, score]) => {
          const player = players.find((p) => p.id === pId);
          return (
            <li
              key={pId}
              className="flex min-h-[36px] sm:min-h-[38px] items-center justify-between gap-1.5 sm:gap-2 rounded-full border border-black/[0.04] dark:border-white/[0.06] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2.5 sm:px-3 py-1.5 shadow-2xs transition-transform active:scale-[0.98] min-w-0"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                {player ? (
                  <PlayerAvatar player={player} className="size-6 text-xs shrink-0" />
                ) : null}
                <span className="truncate text-xs font-medium text-[#1C1C1E] dark:text-[#F2F2F7]">
                  {player ? player.name : "(ถูกลบ)"}
                </span>
              </div>
              <span
                className={`text-xs font-bold tabular-nums shrink-0 ${scoreTone(score)}`}
              >
                {formatScore(score)}
              </span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

const INITIAL_LIMIT = 5;
const PAGE_SIZE = 5;

export function History() {
  const { history, loading, error } = useHistory();
  const { players } = usePlayers();

  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT);
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);

  const [undoPending, setUndoPending] = useState<string | null>(null);
  const [undoBusy, setUndoBusy] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  const [recalcPending, setRecalcPending] = useState(false);
  const [recalcBusy, setRecalcBusy] = useState(false);
  const [recalcError, setRecalcError] = useState<string | null>(null);

  const sorted = [...history].sort((a, b) => b.id.localeCompare(a.id));
  const visibleHistory = sorted.slice(0, visibleCount);
  const hasMore = sorted.length > visibleCount;
  const remainingCount = sorted.length - visibleCount;

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
    <div className="mx-auto max-w-2xl px-3 sm:px-6 py-4 sm:py-6">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7] sm:text-3xl">
            ประวัติการเล่น
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#8E8E93] dark:text-[#98989D]">
            {sorted.length > 0
              ? hasMore
                ? `แสดง ${visibleHistory.length} จากทั้งหมด ${sorted.length} รอบ`
                : `${sorted.length} รอบ`
              : "\u00a0"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setRecalcError(null);
            setRecalcPending(true);
          }}
          className="inline-flex min-h-[40px] sm:min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] px-4 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#007AFF] shadow-2xs transition-all duration-200 ease-out active:scale-95 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] cursor-pointer"
        >
          <RefreshCw className="size-3.5 sm:size-4" aria-hidden />
          <span>คำนวณคะแนนใหม่จากประวัติ</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div
          className="flex flex-col items-center gap-3 py-20 text-[#8E8E93] dark:text-[#98989D]"
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
          <p className="text-xs text-[#8E8E93] dark:text-[#98989D]">
            กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้า
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[20px] border border-black/[0.05] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-12 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none">
          <div className="grid size-16 place-items-center rounded-full bg-black/[0.03] dark:bg-white/[0.06] text-[#8E8E93] dark:text-[#98989D]">
            <ClipboardList className="size-8" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-base sm:text-lg text-[#1C1C1E] dark:text-[#F2F2F7]">ยังไม่มีประวัติการเล่น</p>
            <p className="mt-1 text-xs sm:text-sm text-[#8E8E93] dark:text-[#98989D]">
              บันทึกรอบแรกจากหน้าหลักเพื่อเริ่มติดตามคะแนน
            </p>
          </div>
        </div>
      ) : (
        /* iOS Grouped List */
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-[20px] border border-black/[0.05] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] divide-y divide-gray-100 dark:divide-white/[0.06]">
            {visibleHistory.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                players={players}
                onUndo={handleUndoRequest}
                onEdit={setEditingEntry}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore ? (
            <div className="flex flex-col items-center gap-2 pt-1 pb-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                aria-label={`โหลดประวัติเพิ่มอีก ${Math.min(PAGE_SIZE, remainingCount)} รอบ`}
                className="group flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#007AFF] dark:text-[#2E8BFF] shadow-xs hover:bg-[#007AFF]/5 dark:hover:bg-[#007AFF]/10 active:scale-95 transition-all cursor-pointer"
              >
                <span>โหลดเพิ่ม</span>
                <span className="rounded-full bg-[#007AFF]/10 dark:bg-[#007AFF]/20 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#007AFF] dark:text-[#2E8BFF]">
                  +{Math.min(PAGE_SIZE, remainingCount)}
                </span>
                <ChevronDown className="size-4 shrink-0 transition-transform group-hover:translate-y-0.5" aria-hidden />
              </button>
              <span className="text-[11px] text-[#8E8E93] dark:text-[#98989D] tabular-nums">
                เหลืออีก {remainingCount} รอบ
              </span>
            </div>
          ) : sorted.length > INITIAL_LIMIT ? (
            <p className="text-center text-xs text-[#8E8E93] dark:text-[#98989D] py-2">
              แสดงประวัติทั้งหมดแล้ว ({sorted.length} รอบ)
            </p>
          ) : null}
        </div>
      )}

      {/* Edit round dialog */}
      {editingEntry ? (
        <EditRoundDialog
          key={editingEntry.id}
          entry={editingEntry}
          players={players}
          history={history}
          onClose={() => setEditingEntry(null)}
        />
      ) : null}

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
