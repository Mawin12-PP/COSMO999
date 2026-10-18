"use client";

// Round preview. Confirmation step between score entry and the write.
// Mobile-first iOS guidelines: min 44x44px touch targets on close icon & 48px buttons,
// active:scale-95 feedback, and backdrop blur.
import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { RoundScoreResult } from "@/lib/scoring";
import type { Player } from "@/types/models";

function netTone(net: number): string {
  if (net > 0) return "text-[#34C759]";
  if (net < 0) return "text-[#FF3B30]";
  return "text-[#8E8E93]";
}

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
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[20px] border border-black/[0.04] bg-white p-0 text-[#1C1C1E] shadow-2xl backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="preview-title" className="text-lg font-semibold tracking-tight text-[#1C1C1E]">
              ตรวจสอบคะแนนก่อนบันทึก
            </h2>
            <p className="mt-0.5 text-xs text-[#8E8E93] tabular-nums">
              ตัวคูณรอบนี้ <span className="font-semibold text-[#007AFF]">x{multiplier}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="ปิด"
            className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center -mr-2 -mt-2 rounded-full text-[#8E8E93] transition-all duration-200 ease-out active:scale-[0.97] hover:bg-black/[0.04] hover:text-[#1C1C1E]"
          >
            <X className="size-5" />
          </button>
        </div>

        <ul className="flex flex-col rounded-[16px] border border-black/[0.04] divide-y divide-gray-100/80 overflow-hidden bg-white shadow-2xs">
          {players.map((player) => {
            const net = result.netScores[player.id] ?? 0;
            const raw = rawScores[player.id] ?? 0;
            const sign = net > 0 ? "+" : "";
            return (
              <li
                key={player.id}
                className="flex min-h-[48px] items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-gray-50/60"
              >
                <PlayerAvatar player={player} className="size-9 text-sm shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1C1C1E]">
                  {player.name}
                </span>
                <span className="shrink-0 text-right text-xs text-[#8E8E93] tabular-nums">
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

        <div className="flex items-center justify-between rounded-2xl border border-black/[0.04] bg-black/[0.02] px-4 py-3">
          <span className="text-sm font-semibold text-[#1C1C1E]">รวมสุทธิ</span>
          <span className="text-base font-bold tabular-nums text-[#8E8E93]">
            {result.totalNetScore}
          </span>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-sm text-[#FF3B30] backdrop-blur-sm"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2.5 sm:flex-row-reverse pt-1">
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 ease-out active:scale-[0.97] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="size-4.5" />
            {saving ? "กำลังบันทึก..." : "ปิดจ๊อบ! ประจานเลย"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            disabled={saving}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-black/[0.06] bg-white px-6 py-3 text-base font-semibold text-[#1C1C1E] shadow-xs transition-all duration-200 ease-out active:scale-[0.97] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            กลับไปแก้
          </button>
        </div>
      </div>
    </dialog>
  );
}
