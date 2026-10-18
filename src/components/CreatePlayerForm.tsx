"use client";

// Create-player form: Thai name plus an optional profile image that is
// downscaled in the browser before it is written.
// Mobile-first for iPhone/iPad: 48px+ touch targets, generous padding, active states.
import { useRef, useState } from "react";
import { ImagePlus, Loader2, UserPlus } from "lucide-react";
import { fileToResizedDataUrl } from "@/lib/image";
import { createPlayer } from "@/lib/players";

export function CreatePlayerForm() {
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      const file = fileRef.current?.files?.[0];
      const image = file ? await fileToResizedDataUrl(file) : undefined;
      await createPlayer(trimmed, image);
      setName("");
      setFileName(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "เพิ่มผู้เล่นไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] shadow-xs">
          <UserPlus className="size-4" />
        </span>
        <h2 className="text-base font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">เพิ่มผู้เล่นใหม่</h2>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">ชื่อผู้เล่น</span>
        <input
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          placeholder="เช่น สมชาย (ตัวตึง)"
          className="min-h-[48px] rounded-xl border border-black/[0.06] dark:border-[#38383A] bg-gray-50/80 dark:bg-[#2C2C2E] px-4 py-3 text-base text-[#1C1C1E] dark:text-[#F2F2F7] outline-none transition-all placeholder:text-[#8E8E93]/60 dark:placeholder:text-[#98989D]/60 focus:border-[#007AFF] focus:bg-white dark:focus:bg-[#1C1C1E] focus:ring-2 focus:ring-blue-500/20"
        />
      </label>

      <div className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">รูปโปรไฟล์ (ไม่บังคับ)</span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[44px] items-center gap-2 self-start rounded-xl border border-black/[0.06] dark:border-[#38383A] bg-gray-50/80 dark:bg-[#2C2C2E] px-4 py-2.5 text-sm font-semibold text-[#007AFF] transition-all duration-200 ease-out active:scale-[0.97] hover:bg-white dark:hover:bg-[#38383A]"
        >
          <ImagePlus className="size-4.5" />
          {fileName ?? "เลือกรูป"}
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

      {error ? <p className="text-sm font-medium text-[#FF3B30]">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 ease-out active:scale-[0.97] hover:opacity-90 disabled:opacity-50 disabled:shadow-none"
      >
        {pending ? (
          <Loader2 className="size-4.5 animate-spin" />
        ) : (
          <UserPlus className="size-4.5" />
        )}
        เชิญตัวตึงเข้าตี้
      </button>
    </form>
  );
}
