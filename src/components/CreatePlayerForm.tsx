"use client";

// Create-player modal trigger wrapper.
// Converted to iOS Sheet/Modal trigger to avoid cluttering the page view.
import { useState } from "react";
import { Plus } from "lucide-react";
import { PlayerModal } from "@/components/PlayerModal";
import { usePlayers } from "@/hooks/usePlayers";

export function CreatePlayerForm() {
  const [isOpen, setIsOpen] = useState(false);
  const { players } = usePlayers();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-[40px] sm:min-h-[44px] items-center justify-center gap-2 self-start bg-[#007AFF] text-white rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
      >
        <Plus className="size-4 sm:size-4.5 stroke-[2.5]" />
        <span>เพิ่มผู้เล่นใหม่</span>
      </button>

      <PlayerModal
        isOpen={isOpen}
        player={null}
        existingPlayers={players}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
