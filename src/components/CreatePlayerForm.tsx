"use client";

// Create-player modal trigger wrapper.
// Converted to iOS Sheet/Modal trigger to avoid cluttering the page view.
import { useState } from "react";
import { Plus } from "lucide-react";
import { PlayerModal } from "@/components/PlayerModal";

export function CreatePlayerForm() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-[48px] items-center justify-center gap-2 self-start bg-[#007AFF] text-white rounded-full px-5 py-2.5 sm:px-6 sm:py-3 font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
      >
        <Plus className="size-5 stroke-[2.5]" />
        <span>เพิ่มผู้เล่นใหม่</span>
      </button>

      <PlayerModal
        isOpen={isOpen}
        player={null}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
