"use client";

// Roster of players styled as an authentic Apple iOS Grouped List (Settings style).
// Features: Single continuous container, hairline dividers, flush rows with active highlight,
// Edit and Delete micro-interactions (active:scale-90), iOS Modal sheet for Add/Edit,
// and accessible deletion confirmation via ConfirmDialog.
import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerModal } from "@/components/PlayerModal";
import { deletePlayer } from "@/lib/players";
import type { Player } from "@/types/models";

export function PlayerList({
  players,
  loading,
  isAddOpen,
  onOpenAdd,
  onCloseAdd,
}: {
  players: Player[];
  loading: boolean;
  isAddOpen?: boolean;
  onOpenAdd?: () => void;
  onCloseAdd?: () => void;
}) {
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const addModalOpen = isAddOpen ?? internalAddOpen;

  function handleOpenAdd() {
    if (onOpenAdd) {
      onOpenAdd();
    } else {
      setInternalAddOpen(true);
    }
  }

  function handleCloseAdd() {
    if (onCloseAdd) {
      onCloseAdd();
    } else {
      setInternalAddOpen(false);
    }
  }

  async function handleConfirmDelete() {
    if (!playerToDelete) return;
    setDeletePending(true);
    setDeleteError(null);
    try {
      await deletePlayer(playerToDelete.id);
      setPlayerToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setDeletePending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-[20px] bg-white dark:bg-[#1C1C1E] p-8 shadow-sm border border-black/[0.04] dark:border-white/10">
        <Loader2 className="size-5 animate-spin text-[#007AFF] dark:text-[#2E8BFF]" />
        <span className="text-sm font-medium text-[#8E8E93] dark:text-[#98989D]">
          กำลังโหลดรายชื่อผู้เล่น...
        </span>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-4 rounded-[20px] bg-white dark:bg-[#1C1C1E] p-10 text-center shadow-sm border border-black/[0.04] dark:border-white/10">
          <div className="grid size-12 place-items-center rounded-full bg-blue-50 dark:bg-blue-500/15 text-[#007AFF] dark:text-[#2E8BFF]">
            <Users className="size-6" />
          </div>
          <div>
            <p className="font-semibold text-base text-[#1C1C1E] dark:text-[#F2F2F7]">
              ยังไม่มีผู้เล่นในตี้
            </p>
            <p className="mt-1 text-xs text-[#8E8E93] dark:text-[#98989D]">
              กดปุ่มด้านล่างเพื่อเพิ่มตัวตึงคนแรกเข้าสู่วง
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#007AFF] px-5 py-2.5 text-sm font-semibold text-white shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>เพิ่มผู้เล่นคนแรก</span>
          </button>
        </div>

        {/* Modal for Adding Player */}
        <PlayerModal
          isOpen={addModalOpen}
          player={null}
          onClose={handleCloseAdd}
        />
      </>
    );
  }

  return (
    <>
      {/* iOS Settings Grouped List */}
      <ul className="bg-white dark:bg-[#1C1C1E] rounded-[20px] overflow-hidden shadow-sm divide-y divide-gray-100 dark:divide-white/10 border border-black/[0.04] dark:border-white/10">
        {players.map((player) => (
          <li
            key={player.id}
            onClick={() => setEditingPlayer(player)}
            className="group flex min-h-[58px] items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.03] active:bg-gray-50 dark:active:bg-white/5 cursor-pointer"
          >
            {/* Left: Avatar & Primary Name */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <PlayerAvatar player={player} className="size-11 text-base shrink-0" />
              <span className="min-w-0 flex-1 truncate text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                {player.name}
              </span>
            </div>

            {/* Right: Actions with Apple Squish (active:scale-90) */}
            <div
              className="flex shrink-0 items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Edit Button */}
              <button
                type="button"
                onClick={() => setEditingPlayer(player)}
                aria-label={`แก้ไข ${player.name}`}
                className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#8E8E93] dark:text-[#98989D] transition-all duration-200 active:scale-90 active:bg-blue-50 dark:active:bg-blue-500/15 active:text-[#007AFF] hover:bg-blue-50/80 dark:hover:bg-blue-500/10 hover:text-[#007AFF] dark:hover:text-[#2E8BFF]"
              >
                <Pencil className="size-4.5" />
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setPlayerToDelete(player);
                }}
                aria-label={`ลบ ${player.name}`}
                className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#8E8E93] dark:text-[#98989D] transition-all duration-200 active:scale-90 active:bg-red-50 dark:active:bg-red-500/15 active:text-[#FF3B30] hover:bg-red-50/80 dark:hover:bg-red-500/10 hover:text-[#FF3B30] dark:hover:text-[#FF453A]"
              >
                <Trash2 className="size-4.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal for Adding Player */}
      <PlayerModal
        isOpen={addModalOpen}
        player={null}
        onClose={handleCloseAdd}
      />

      {/* Modal for Editing Player */}
      <PlayerModal
        isOpen={Boolean(editingPlayer)}
        player={editingPlayer}
        onClose={() => setEditingPlayer(null)}
      />

      {/* Accessible Confirmation Dialog for Deleting Player */}
      {playerToDelete && (
        <ConfirmDialog
          title="ลบผู้เล่น"
          description={`ต้องการลบ "${playerToDelete.name}" ออกจากรายชื่อหรือไม่? ประวัติและสถิติคะแนนทั้งหมดของผู้เล่นคนนี้จะถูกลบออก`}
          confirmLabel="ลบผู้เล่น"
          cancelLabel="ยกเลิก"
          destructive={true}
          busy={deletePending}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onClose={() => {
            if (!deletePending) {
              setPlayerToDelete(null);
              setDeleteError(null);
            }
          }}
        />
      )}
    </>
  );
}
