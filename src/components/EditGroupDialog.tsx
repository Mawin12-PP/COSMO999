"use client";

// Edit group dialog: rename or delete a group shortcut. Ported from the
// legacy editGroup (reference/legacy-prototype.sanitized.html L1530-1546).
// Mobile-first iOS guidelines: min 44px+ touch targets on close button & actions,
// active:scale-95 feedback, and backdrop blur.
import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import type { Group } from "@/types/models";

export function EditGroupDialog({
  group,
  busy,
  error,
  onRename,
  onDelete,
  onClose,
}: {
  group: Group;
  busy: boolean;
  error: string | null;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nameValue, setNameValue] = useState(group.name);
  const [activeAction, setActiveAction] = useState<"rename" | "delete" | null>(null);

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

  function handleRename() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === group.name) return;
    setActiveAction("rename");
    onRename(trimmed);
  }

  function handleDelete() {
    setActiveAction("delete");
    onDelete();
  }

  const nameChanged = nameValue.trim() !== "" && nameValue.trim() !== group.name;

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
      aria-labelledby="edit-group-title"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-3xl border border-black/[0.04] bg-white/90 p-0 text-[#1C1C1E] backdrop-blur-2xl shadow-[0_20px_50px_rgb(0,0,0,0.15)] backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h2
            id="edit-group-title"
            className="text-base font-semibold leading-snug text-[#1C1C1E]"
          >
            แก้ไขกลุ่ม
          </h2>
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

        {/* Inline error */}
        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-sm text-[#FF3B30] backdrop-blur-sm"
          >
            {error}
          </p>
        ) : null}

        {/* Rename section */}
        <div className="flex flex-col gap-2.5">
          <label
            htmlFor="edit-group-name"
            className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]"
          >
            ชื่อกลุ่ม
          </label>
          <input
            id="edit-group-name"
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            disabled={busy}
            maxLength={80}
            className="min-h-[48px] rounded-xl border border-black/[0.06] bg-white/70 px-4 py-3 text-base text-[#1C1C1E] placeholder-[#8E8E93]/60 transition-all focus:border-[#007AFF] focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleRename}
            disabled={busy || !nameChanged}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && activeAction === "rename" ? (
              <Loader2 className="size-4.5 animate-spin" aria-hidden />
            ) : null}
            {busy && activeAction === "rename" ? "กำลังบันทึก..." : "บันทึกชื่อใหม่"}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.04]" />

        {/* Delete section */}
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-[#8E8E93]">
            ลบทางลัดกลุ่มนี้ออกจากรายการ — ประวัติการเล่นเดิมยังคงอยู่
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-red-200/80 bg-red-50/80 px-6 py-3 text-base font-semibold text-[#FF3B30] transition-all active:scale-95 hover:bg-red-100/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && activeAction === "delete" ? (
              <Loader2 className="size-4.5 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4.5" aria-hidden />
            )}
            {busy && activeAction === "delete"
              ? "กำลังลบ..."
              : "ลบทางลัดกลุ่มนี้"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
