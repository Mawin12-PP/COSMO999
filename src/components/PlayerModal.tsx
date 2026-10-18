"use client";

// iOS-style Modal Sheet for Adding or Editing a Player.
// Follows Apple iOS guidelines: 44px+ touch targets, active:scale-90 squish feedback,
// scale-in-animation, frosted glass backdrop, and full Dark Mode support.
import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { fileToResizedDataUrl } from "@/lib/image";
import { createPlayer, updatePlayer } from "@/lib/players";
import type { Player } from "@/types/models";

export function PlayerModal({
  isOpen,
  player,
  onClose,
}: {
  isOpen: boolean;
  player?: Player | null; // null/undefined = Add mode, Player = Edit mode
  onClose: () => void;
}) {
  const isEdit = Boolean(player);
  const [name, setName] = useState(player?.name ?? "");
  const [previewImage, setPreviewImage] = useState<string | undefined>(player?.image);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync state whenever player or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setName(player?.name ?? "");
      setPreviewImage(player?.image);
      setFileName(null);
      setError(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [isOpen, player]);

  // Handle ESC key to dismiss modal cleanly
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pending, onClose]);

  if (!isOpen) return null;

  async function handleImagePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const resized = await fileToResizedDataUrl(file);
      setPreviewImage(resized);
    } catch {
      setError("ไม่สามารถแปลงไฟล์รูปภาพได้");
    }
  }

  function handleRemoveImage() {
    setPreviewImage(undefined);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || pending) {
      if (!trimmed) setError("กรุณากรอกชื่อผู้เล่น");
      return;
    }

    setPending(true);
    setError(null);
    try {
      if (isEdit && player) {
        await updatePlayer(player.id, {
          name: trimmed,
          image: previewImage,
        });
      } else {
        await createPlayer(trimmed, previewImage);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? "บันทึกไม่สำเร็จ" : "เพิ่มผู้เล่นไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-md p-6 rounded-[24px] shadow-2xl scale-in-animation border border-black/[0.04] dark:border-[#38383A] flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-blue-50 dark:bg-blue-500/15 text-[#007AFF] dark:text-[#2E8BFF] shadow-xs">
              {isEdit ? <Pencil className="size-4.5" /> : <UserPlus className="size-4.5" />}
            </span>
            <h2
              id="player-modal-title"
              className="text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]"
            >
              {isEdit ? "แก้ไขผู้เล่น" : "เพิ่มผู้เล่นใหม่"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="ปิด"
            className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center -mr-2 -mt-2 rounded-full text-[#8E8E93] dark:text-[#98989D] transition-all duration-200 active:scale-90 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7] disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar preview if image is selected or editing player */}
          <div className="flex items-center gap-3.5 self-center my-1">
            {previewImage ? (
              <span
                role="img"
                aria-label={name || "รูปผู้เล่น"}
                className="size-16 rounded-full border border-black/[0.08] dark:border-white/10 bg-cover bg-center shadow-sm"
                style={{ backgroundImage: `url(${previewImage})` }}
              />
            ) : isEdit && player ? (
              <PlayerAvatar player={{ ...player, name: name || player.name }} className="size-16 text-2xl" />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full border border-blue-500/15 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-500/15 text-2xl font-semibold text-[#007AFF] dark:text-[#2E8BFF] shadow-xs">
                {name.trim().charAt(0) || "?"}
              </span>
            )}
          </div>

          {/* Name input */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="modal-player-name"
              className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]"
            >
              ชื่อผู้เล่น
            </label>
            <input
              id="modal-player-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="เช่น สมชาย (ตัวตึง)"
              disabled={pending}
              autoFocus
              className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border-none rounded-xl px-4 py-3 w-full text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] outline-none transition-all placeholder:text-[#8E8E93]/60 dark:placeholder:text-[#98989D]/60 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            />
          </div>

          {/* Profile photo picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
              รูปโปรไฟล์ (ไม่บังคับ)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={pending}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] px-4 py-2.5 text-sm font-semibold text-[#007AFF] dark:text-[#2E8BFF] active:scale-90 transition-transform hover:opacity-90 disabled:opacity-50"
              >
                <ImagePlus className="size-4.5" />
                {fileName ?? (previewImage ? "เปลี่ยนรูป" : "เลือกรูป")}
              </button>
              {previewImage ? (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={pending}
                  className="flex min-h-[44px] items-center gap-1 rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs font-semibold text-[#FF3B30] dark:text-[#FF453A] active:scale-90 transition-transform"
                >
                  <Trash2 className="size-3.5" />
                  ลบรูป
                </button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />
          </div>

          {/* Inline error */}
          {error ? (
            <p
              role="alert"
              className="rounded-2xl border border-red-200/80 dark:border-red-500/30 bg-red-50/80 dark:bg-red-500/10 p-3 text-sm text-[#FF3B30] dark:text-[#FF453A] backdrop-blur-sm"
            >
              {error}
            </p>
          ) : null}

          {/* Action buttons */}
          <div className="mt-2 flex flex-col gap-2.5 sm:flex-row-reverse">
            <button
              type="submit"
              disabled={pending}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25 active:scale-90 transition-transform hover:opacity-90 disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="size-4.5 animate-spin" />
              ) : isEdit ? (
                <Check className="size-4.5 stroke-[2.5]" />
              ) : (
                <UserPlus className="size-4.5" />
              )}
              {pending ? "กำลังบันทึก..." : isEdit ? "บันทึกข้อมูล" : "เชิญตัวตึงเข้าตี้"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-black/[0.06] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] px-6 py-3 text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs active:scale-90 transition-transform hover:bg-gray-50 dark:hover:bg-[#38383A] disabled:opacity-50"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
