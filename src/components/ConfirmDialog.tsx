"use client";

// Generic accessible confirm dialog styled according to Apple iOS guidelines.
// Mobile-first iOS: min 44x44px touch targets on close button, min 48px action buttons,
// active:scale-95 feedback, and backdrop blur.
import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "ยกเลิก",
  destructive = false,
  busy = false,
  error = null,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
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

  const confirmButtonClass = destructive
    ? "flex min-h-[44px] sm:min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-[#FF3B30] px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-200 ease-out active:scale-[0.97] hover:bg-[#D70015] disabled:cursor-not-allowed disabled:opacity-50"
    : "flex min-h-[44px] sm:min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 ease-out active:scale-[0.97] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

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
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-0 text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {destructive && (
              <span className="grid size-8 place-items-center rounded-full bg-red-50 dark:bg-red-500/15 text-[#FF3B30] dark:text-[#FF453A] shadow-xs">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
              </span>
            )}
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold leading-snug text-[#1C1C1E] dark:text-[#F2F2F7]"
            >
              {title}
            </h2>
          </div>
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

        {/* Body */}
        <p
          id="confirm-dialog-desc"
          className="text-sm leading-relaxed text-[#8E8E93] dark:text-[#98989D]"
        >
          {description}
        </p>

        {/* Inline error from a failed write */}
        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-200/80 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/10 p-3 text-sm text-[#FF3B30] dark:text-[#FF453A] backdrop-blur-sm"
          >
            {error}
          </p>
        ) : null}

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse pt-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={confirmButtonClass}
          >
            {busy ? (
              <Loader2 className="size-4.5 animate-spin" aria-hidden />
            ) : null}
            {busy ? "กำลังดำเนินการ..." : confirmLabel}
          </button>
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            className="flex min-h-[44px] sm:min-h-[48px] flex-1 items-center justify-center rounded-full border border-black/[0.06] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs transition-all duration-200 ease-out active:scale-[0.97] hover:bg-gray-50 dark:hover:bg-[#38383A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
