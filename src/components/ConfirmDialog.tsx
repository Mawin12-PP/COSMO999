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
    ? "flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-[#FF3B30] px-6 py-3 text-base font-semibold text-white shadow-md shadow-red-500/20 transition-all active:scale-95 hover:bg-[#D70015] disabled:cursor-not-allowed disabled:opacity-50"
    : "flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50";

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
      className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-3xl border border-black/[0.04] bg-white/90 p-0 text-[#1C1C1E] backdrop-blur-2xl shadow-[0_20px_50px_rgb(0,0,0,0.15)] backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {destructive && (
              <span className="grid size-8 place-items-center rounded-full bg-red-50 text-[#FF3B30] shadow-xs">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
              </span>
            )}
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold leading-snug text-[#1C1C1E]"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            aria-label="ปิด"
            className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center -mr-2 -mt-2 rounded-full text-[#8E8E93] transition-all active:scale-90 hover:bg-black/[0.04] hover:text-[#1C1C1E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <p
          id="confirm-dialog-desc"
          className="text-sm leading-relaxed text-[#8E8E93]"
        >
          {description}
        </p>

        {/* Inline error from a failed write */}
        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-sm text-[#FF3B30] backdrop-blur-sm"
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
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-black/[0.06] bg-white px-6 py-3 text-base font-semibold text-[#1C1C1E] shadow-xs transition-all active:scale-95 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
