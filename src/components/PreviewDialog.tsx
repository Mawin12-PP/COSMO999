"use client";

// Round preview. Confirmation step between score entry and the write.
// Mobile-first iOS guidelines: min 44x44px touch targets on close icon & 48px buttons,
// active:scale-95 feedback, and backdrop blur.
import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/Button";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { scoreTone as netTone } from "@/lib/format";
import type { RoundScoreResult } from "@/lib/scoring";
import type { Player } from "@/types/models";

export function PreviewDialog({
  players,
  rawScores,
  result,
  multiplier,
  saving,
  error,
  onClose,
  onConfirm,
}: {
  players: Player[];
  rawScores: Record<string, number>;
  result: RoundScoreResult;
  multiplier: number;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  function dismiss() {
    if (saving) return;
    dialogRef.current?.close();
    onClose();
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
      aria-labelledby="preview-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-0 text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="preview-title" className="text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">
              ตรวจสอบคะแนนก่อนบันทึก
            </h2>
            <p className="mt-0.5 text-xs text-[#8E8E93] dark:text-[#98989D] tabular-nums">
              ตัวคูณรอบนี้ <span className="font-semibold text-[#007AFF] dark:text-[#2E8BFF]">x{multiplier}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="ปิด"
            className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center -mr-2 -mt-2 rounded-full text-[#8E8E93] dark:text-[#98989D] transition-all duration-200 ease-out active:scale-[0.97] hover:bg-black/[0.04] hover:text-[#1C1C1E] dark:hover:bg-white/[0.06] dark:hover:text-[#F2F2F7]"
          >
            <X className="size-5" />
          </button>
        </div>

        <ul className="flex flex-col rounded-[16px] border border-black/[0.04] dark:border-[#38383A] divide-y divide-gray-100/80 dark:divide-[#38383A] overflow-hidden bg-white dark:bg-[#1C1C1E] shadow-2xs">
          {players.map((player) => {
            const net = result.netScores[player.id] ?? 0;
            const raw = rawScores[player.id] ?? 0;
            const sign = net > 0 ? "+" : "";
            return (
              <li
                key={player.id}
                className="flex min-h-[48px] items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.04]"
              >
                <PlayerAvatar player={player} className="size-9 text-sm shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                  {player.name}
                </span>
                <span className="shrink-0 text-right text-xs text-[#8E8E93] dark:text-[#98989D] tabular-nums">
                  ดิบ {raw}
                </span>
                <span
                  className={`w-16 shrink-0 text-right text-sm font-bold tabular-nums ${netTone(net)}`}
                >
                  {sign}
                  {net}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between rounded-2xl border border-black/[0.04] dark:border-[#38383A] bg-black/[0.02] dark:bg-[#2C2C2E] px-4 py-3">
          <span className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">รวมสุทธิ</span>
          <span className="text-base font-bold tabular-nums text-[#8E8E93] dark:text-[#98989D]">
            {result.totalNetScore}
          </span>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-200/80 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/10 p-3 text-sm text-[#FF3B30] dark:text-[#FF453A] backdrop-blur-sm"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2.5 sm:flex-row-reverse pt-1">
          <Button onClick={onConfirm} disabled={saving} className="flex-1">
            <Check className="size-4.5" />
            {saving ? "กำลังบันทึก..." : "ยืนยันบันทึก"}
          </Button>
          <Button variant="secondary" onClick={dismiss} disabled={saving} className="flex-1">
            แก้ไข
          </Button>
        </div>
      </div>
    </dialog>
  );
}
