"use client";

// Roster of players styled as an authentic Apple iOS Grouped List (Settings style).
// Features: Single continuous container, hairline dividers, flush rows with active highlight,
// Edit and Delete micro-interactions (active:scale-90), iOS Modal sheet for Add/Edit,
// and accessible deletion confirmation via ConfirmDialog.
import { useState } from "react";
import { Loader2, Pencil, Trash2, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerDropdownPicker } from "@/components/PlayerDropdownPicker";
import { PlayerModal } from "@/components/PlayerModal";
import { deletePlayer } from "@/lib/players";
import type { Player } from "@/types/models";

export function PlayerList({
  players,
  loading,
  isAddOpen,
  onOpenAdd,
  onCloseAdd,
  onEditPlayer,
}: {
  players: Player[];
  loading: boolean;
  isAddOpen?: boolean;
  onOpenAdd?: () => void;
  onCloseAdd?: () => void;
  onEditPlayer?: (player: Player) => void;
}) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [internalEditingPlayer, setInternalEditingPlayer] = useState<Player | null>(null);
  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || null;
  const isControlledAdd = onOpenAdd !== undefined;
  const isControlledEdit = onEditPlayer !== undefined;
  const addModalOpen = isAddOpen ?? internalAddOpen;

  function handleCloseAdd() {
    if (onCloseAdd) {
      onCloseAdd();
    } else {
      setInternalAddOpen(false);
    }
  }

  function handleEdit(player: Player) {
    if (onEditPlayer) {
      onEditPlayer(player);
    } else {
      setInternalEditingPlayer(player);
    }
  }

  async function handleConfirmDelete() {
    if (!playerToDelete) return;
    setDeletePending(true);
    setDeleteError(null);
    try {
      await deletePlayer(playerToDelete.id);
      if (selectedPlayerId === playerToDelete.id) {
        setSelectedPlayerId("");
      }
      setPlayerToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setDeletePending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-6 text-sm font-medium text-[#8E8E93] dark:text-[#98989D]">
        <Loader2 className="size-5 animate-spin text-[#007AFF] dark:text-[#2E8BFF]" />
        <span>กำลังโหลดรายชื่อผู้เล่น...</span>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-blue-50 dark:bg-blue-500/15 text-[#007AFF] dark:text-[#2E8BFF]">
            <Users className="size-6" />
          </div>
          <div>
            <p className="font-semibold text-base text-[#1C1C1E] dark:text-[#F2F2F7]">
              ยังไม่มีรายชื่อผู้เล่น
            </p>
            <p className="mt-1 text-xs text-[#8E8E93] dark:text-[#98989D]">
              กดปุ่มด้านบนเพื่อเพิ่มผู้เล่นเข้าสู่ระบบ
            </p>
          </div>
        </div>

        {/* Modal for Adding Player (Fallback for standalone usage) */}
        {!isControlledAdd && (
          <PlayerModal
            isOpen={addModalOpen}
            player={null}
            existingPlayers={players}
            onClose={handleCloseAdd}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Dropdown Selector for Editing Players */}
      <div className="flex flex-col gap-2">
        <label className="block text-xs font-medium uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
          เลือกผู้เล่น
        </label>

        <PlayerDropdownPicker
          players={players}
          selectedId={selectedPlayerId}
          onSelect={(id) => setSelectedPlayerId(id)}
          placeholder="เลือกผู้เล่น"
        />

        {/* Selected Player Card with Quick Edit & Delete Actions */}
        {selectedPlayer && (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.04] p-3 border border-black/[0.04] dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <PlayerAvatar player={selectedPlayer} className="size-10 text-sm shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-medium text-[#1C1C1E] dark:text-[#F2F2F7] truncate block">
                  {selectedPlayer.name}
                </span>
                <span className="text-xs text-[#8E8E93] dark:text-[#98989D]">
                  เลือกอยู่
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleEdit(selectedPlayer)}
                className="flex min-h-[38px] sm:min-h-[40px] items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-500/15 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#007AFF] dark:text-[#2E8BFF] hover:bg-blue-100 dark:hover:bg-blue-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Pencil className="size-3.5" />
                <span>แก้ไข</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setPlayerToDelete(selectedPlayer);
                }}
                aria-label={`ลบ ${selectedPlayer.name}`}
                className="flex size-9 sm:size-10 min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] items-center justify-center rounded-full text-[#8E8E93] dark:text-[#98989D] hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-[#FF3B30] dark:hover:text-[#FF453A] active:scale-90 transition-all cursor-pointer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fallback Modals for Standalone Usage */}
      {!isControlledAdd && (
        <PlayerModal
          isOpen={addModalOpen}
          player={null}
          existingPlayers={players}
          onClose={handleCloseAdd}
        />
      )}

      {!isControlledEdit && (
        <PlayerModal
          isOpen={Boolean(internalEditingPlayer)}
          player={internalEditingPlayer}
          existingPlayers={players}
          onClose={() => setInternalEditingPlayer(null)}
        />
      )}

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
