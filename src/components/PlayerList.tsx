"use client";

// Roster of players with per-row edit and delete.
// Mobile-first iOS guidelines: min 44x44px touch targets on all buttons,
// active:scale-90 touch feedback, generous padding, and solid white cards.
import { useRef, useState } from "react";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { fileToResizedDataUrl } from "@/lib/image";
import { deletePlayer, updatePlayer } from "@/lib/players";
import type { Player } from "@/types/models";

function PlayerRow({ player }: { player: Player }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const [name, setName] = useState(player.name);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function enterEdit() {
    setName(player.name);
    setFileName(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
    setMode("edit");
  }

  function resetToView() {
    setMode("view");
    setName(player.name);
    setFileName(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || pending) {
      if (!trimmed) setError("ชื่อห้ามว่าง");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const file = fileRef.current?.files?.[0];
      const image = file ? await fileToResizedDataUrl(file) : undefined;
      await updatePlayer(player.id, { name: trimmed, image });
      resetToView();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      await deletePlayer(player.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
      setPending(false);
      setMode("view");
    }
  }

  return (
    <li className="p-4 transition-colors hover:bg-gray-50/60 dark:hover:bg-[#2C2C2E]/40">
      <div className="flex items-center gap-3">
        <PlayerAvatar player={player} className="size-11 text-base shrink-0" />

        {mode === "edit" ? (
          <input
            type="text"
            value={name}
            aria-label="ชื่อผู้เล่น"
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-black/[0.08] dark:border-[#38383A] bg-white/90 dark:bg-[#2C2C2E] px-3.5 py-2 text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-500/20"
          />
        ) : (
          <p className="min-w-0 flex-1 truncate text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">{player.name}</p>
        )}

        <div className="flex shrink-0 items-center gap-1">
          {mode === "view" ? (
            <>
              <button
                type="button"
                onClick={enterEdit}
                aria-label={`แก้ไข ${player.name}`}
                className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#8E8E93] dark:text-[#98989D] transition-all duration-200 ease-out active:scale-[0.97] active:bg-blue-50 dark:active:bg-blue-950/40 active:text-[#007AFF] hover:bg-blue-50/70 dark:hover:bg-blue-950/30 hover:text-[#007AFF]"
              >
                <Pencil className="size-4.5" />
              </button>
              <button
                type="button"
                onClick={() => setMode("confirm-delete")}
                aria-label={`ลบ ${player.name}`}
                className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#8E8E93] dark:text-[#98989D] transition-all duration-200 ease-out active:scale-[0.97] active:bg-red-50 dark:active:bg-red-950/40 active:text-[#FF3B30] hover:bg-red-50/70 dark:hover:bg-red-950/30 hover:text-[#FF3B30]"
              >
                <Trash2 className="size-4.5" />
              </button>
            </>
          ) : null}

          {mode === "edit" ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={pending}
                aria-label="บันทึก"
                className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-md shadow-blue-500/20 transition-all duration-200 ease-out active:scale-[0.97] hover:opacity-90 disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 className="size-4.5 animate-spin" />
                ) : (
                  <Check className="size-5 stroke-[2.5]" />
                )}
              </button>
              <button
                type="button"
                onClick={resetToView}
                disabled={pending}
                aria-label="ยกเลิก"
                className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#8E8E93] dark:text-[#98989D] transition-all duration-200 ease-out active:scale-[0.97] hover:bg-gray-100 dark:hover:bg-[#2C2C2E] disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {mode === "edit" ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-gray-100/80 dark:border-[#38383A] pt-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[44px] items-center self-start rounded-xl border border-black/[0.06] dark:border-[#38383A] bg-gray-50 dark:bg-[#2C2C2E] px-4 py-2 text-xs font-semibold text-[#007AFF] transition-all duration-200 ease-out active:scale-[0.97] hover:bg-white dark:hover:bg-[#38383A]"
          >
            {fileName ?? "เปลี่ยนรูป"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? null)
            }
          />
        </div>
      ) : null}

      {mode === "confirm-delete" ? (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-red-200/80 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/30 p-4 text-sm backdrop-blur-sm">
          <p className="text-[#1C1C1E] dark:text-[#F2F2F7]">
            ลบ <span className="font-bold text-[#FF3B30]">{player.name}</span> ?
            คะแนนรวมของผู้เล่นคนนี้จะหายไปด้วย
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#FF3B30] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-all duration-200 ease-out active:scale-[0.97] hover:opacity-90 disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              ลบเลย
            </button>
            <button
              type="button"
              onClick={resetToView}
              disabled={pending}
              className="flex min-h-[44px] items-center rounded-full border border-black/[0.06] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] px-5 py-2 text-xs font-medium text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs transition-all duration-200 ease-out active:scale-[0.97] hover:bg-gray-50 dark:hover:bg-[#38383A] disabled:opacity-50"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm font-medium text-[#FF3B30]">{error}</p> : null}
    </li>
  );
}

export function PlayerList({
  players,
  loading,
}: {
  players: Player[];
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-[#8E8E93] dark:text-[#98989D]">กำลังโหลดรายชื่อผู้เล่น...</p>;
  }

  if (players.length === 0) {
    return (
      <p className="rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-6 text-center text-sm text-[#8E8E93] dark:text-[#98989D] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
        ยังไม่มีผู้เล่น เพิ่มคนแรกได้จากแบบฟอร์มด้านบน
      </p>
    );
  }

  return (
    <ul className="bg-white dark:bg-[#1C1C1E] rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none divide-y divide-gray-100/80 dark:divide-[#38383A] border border-black/[0.04] dark:border-[#38383A]">
      {players.map((player) => (
        <PlayerRow key={player.id} player={player} />
      ))}
    </ul>
  );
}
