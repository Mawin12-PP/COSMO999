"use client";

// Edit group dialog: rename or delete a group shortcut. Ported from the
// legacy editGroup (reference/legacy-prototype.sanitized.html L1530-1546).
// Mobile-first iOS guidelines: min 44px+ touch targets on close button & actions,
// active:scale-95 feedback, and backdrop blur.
import { useEffect, useRef } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { Group } from "@/types/models";

export function EditGroupDialog({
  busy,
  error,
  onDelete,
  onClose,
}: {
  group?: Group;
  busy: boolean;
  error: string | null;
  onRename?: (newName: string) => void;
  onDelete: () => void;
  onClose: () => void;
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
    if (busy) return;
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
      aria-labelledby="delete-group-title"
      className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-[24px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-0 text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6 text-center items-center">
        {/* Warning Icon */}
        <span className="grid size-14 place-items-center rounded-full bg-red-50 dark:bg-red-950/40 text-[#FF3B30] shadow-2xs">
          <Trash2 className="size-6" />
        </span>

        {/* Title & Description */}
        <div className="flex flex-col gap-1.5">
          <h2
            id="delete-group-title"
            className="text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]"
          >
            ลบกลุ่มขาประจำ?
          </h2>
          <p className="text-xs text-[#8E8E93] dark:text-[#98989D] leading-relaxed max-w-xs">
            กลุ่มนี้จะถูกนำออกจากรายการขาประจำ แต่ประวัติการเล่นเดิมและคะแนนสะสมจะยังคงอยู่ตามปกติ
          </p>
        </div>

        {/* Inline error */}
        {error ? (
          <p
            role="alert"
            className="w-full rounded-2xl border border-red-200/80 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/10 p-3 text-xs text-[#FF3B30] dark:text-[#FF453A] backdrop-blur-sm"
          >
            {error}
          </p>
        ) : null}

        {/* Action buttons */}
        <div className="flex flex-col w-full gap-2 pt-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#FF3B30] hover:bg-[#FF3B30]/90 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-4.5 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4.5" aria-hidden />
            )}
            {busy ? "กำลังลบ..." : "ยืนยันลบกลุ่มนี้"}
          </button>

          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            className="flex min-h-[44px] w-full items-center justify-center rounded-full border border-black/[0.06] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] px-4 py-2.5 text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs transition-all duration-200 ease-out active:scale-[0.97] hover:bg-gray-50 dark:hover:bg-[#38383A] disabled:opacity-50"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </dialog>
  );
}
