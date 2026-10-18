"use client";

// Groups page client component. Ported from legacy renderGroups (L1451),
// playThisGroup (L682), showGroupScore (L1484), and editGroup (L1530).
// Mobile-first iOS guidelines: min 44px+ touch targets on all interactive controls,
// active:scale-95 feedback, and responsive grid layout (1 col on iPhone, 2 cols on iPad).
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Loader2,
  Pencil,
  Play,
  TriangleAlert,
  Users,
} from "lucide-react";
import { EditGroupDialog } from "@/components/EditGroupDialog";
import { GroupScoreDialog } from "@/components/GroupScoreDialog";
import { useGroups } from "@/hooks/useGroups";
import { useHistory } from "@/hooks/useHistory";
import { usePlayers } from "@/hooks/usePlayers";
import { deleteGroup, renameGroup } from "@/lib/groups";
import type { Group, Player } from "@/types/models";

function memberLabel(playerIds: string[], players: Player[]): string {
  return playerIds
    .map((id) => {
      const p = players.find((x) => x.id === id);
      return p ? p.name : "(ถูกลบ)";
    })
    .join(" • ");
}

function GroupCard({
  group,
  players,
  onPlay,
  onScore,
  onEdit,
}: {
  group: Group;
  players: Player[];
  onPlay: (group: Group) => string | null;
  onScore: (groupId: string) => void;
  onEdit: (groupId: string) => void;
}) {
  const [playError, setPlayError] = useState<string | null>(null);

  function handlePlay() {
    const err = onPlay(group);
    setPlayError(err);
  }

  return (
    <article className="reveal flex flex-col justify-between gap-5 rounded-3xl border border-black/[0.04] bg-white/80 p-5 sm:p-6 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
      {/* Group name + member list */}
      <div className="flex items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-[#007AFF] shadow-xs">
          <Users className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold tracking-tight text-[#1C1C1E]">{group.name}</h2>
          <p className="mt-1 text-xs text-[#8E8E93] leading-relaxed">
            {memberLabel(group.playerIds, players)}
          </p>
        </div>
      </div>

      {/* Play error */}
      {playError ? (
        <p role="alert" className="rounded-2xl border border-red-200/80 bg-red-50/80 p-3 text-xs font-medium text-[#FF3B30] backdrop-blur-sm">
          {playError}
        </p>
      ) : null}

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        {/* Primary: play */}
        <button
          type="button"
          onClick={handlePlay}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 hover:brightness-105"
        >
          <Play className="size-4.5 fill-current" aria-hidden />
          เล่นกลุ่มนี้
        </button>

        {/* Secondary row: score + edit */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onScore(group.id)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-4 py-2.5 text-sm font-semibold text-[#1C1C1E] shadow-2xs transition-all active:scale-95 hover:bg-gray-50"
          >
            ดูคะแนน
          </button>
          <button
            type="button"
            onClick={() => onEdit(group.id)}
            className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-black/[0.06] bg-white text-[#8E8E93] shadow-2xs transition-all active:scale-95 hover:bg-gray-50 hover:text-[#1C1C1E]"
            aria-label={`แก้ไขกลุ่ม ${group.name}`}
          >
            <Pencil className="size-4.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

export function Groups() {
  const router = useRouter();
  const { groups, loading, error } = useGroups();
  const { players } = usePlayers();
  const { history, loading: historyLoading, error: historyError } = useHistory();

  const [scoreGroupId, setScoreGroupId] = useState<string | null>(null);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function handlePlay(group: Group): string | null {
    const validIds = group.playerIds.filter((id) =>
      players.some((p) => p.id === id),
    );
    if (validIds.length < 2) {
      return "สมาชิกของกลุ่มนี้เหลือน้อยกว่า 2 คน ไม่สามารถเริ่มเกมได้";
    }
    router.push(`/?preset=${validIds.join(",")}`);
    return null;
  }

  async function handleRename(newName: string) {
    if (!editGroupId) return;
    setEditBusy(true);
    setEditError(null);
    try {
      await renameGroup(editGroupId, newName);
      setEditGroupId(null);
    } catch {
      setEditError("เปลี่ยนชื่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setEditBusy(false);
    }
  }

  async function handleDelete() {
    if (!editGroupId) return;
    setEditBusy(true);
    setEditError(null);
    try {
      await deleteGroup(editGroupId);
      setEditGroupId(null);
    } catch {
      setEditError("ลบกลุ่มไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setEditBusy(false);
    }
  }

  function handleEditClose() {
    if (editBusy) return;
    setEditGroupId(null);
    setEditError(null);
  }

  const scoreGroup = scoreGroupId
    ? (groups.find((g) => g.id === scoreGroupId) ?? null)
    : null;
  const editGroup = editGroupId
    ? (groups.find((g) => g.id === editGroupId) ?? null)
    : null;

  return (
    <div className="mx-auto max-w-2xl px-1 sm:px-4 py-4 sm:py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1E] sm:text-3xl">
          ขาประจำ
        </h1>
        <p className="mt-1 text-sm text-[#8E8E93]">
          {groups.length > 0
            ? `${groups.length} กลุ่ม — สร้างอัตโนมัติจากรอบที่เล่น`
            : "\u00a0"}
        </p>
      </div>

      {/* Loading state */}
      {loading ? (
        <div
          className="flex flex-col items-center gap-3 py-20 text-[#8E8E93]"
          aria-live="polite"
          aria-label="กำลังโหลด"
        >
          <Loader2 className="size-8 animate-spin text-[#007AFF]" aria-hidden />
          <span className="text-sm font-medium">กำลังโหลดกลุ่ม...</span>
        </div>
      ) : error ? (
        <div
          className="flex flex-col items-center gap-3 py-20 text-[#FF3B30]"
          role="alert"
        >
          <TriangleAlert className="size-8" aria-hidden />
          <p className="text-sm font-semibold">โหลดกลุ่มไม่สำเร็จ</p>
          <p className="text-xs text-[#8E8E93]">
            กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้า
          </p>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-black/[0.04] bg-white/80 backdrop-blur-2xl p-12 text-center text-[#8E8E93] shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="grid size-14 place-items-center rounded-full bg-black/[0.04] text-[#8E8E93]">
            <ClipboardList className="size-7" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-[#1C1C1E]">ยังไม่มีกลุ่มขาประจำ</p>
            <p className="mt-1 text-sm text-[#8E8E93]">
              บันทึกรอบแรกจากหน้าหลักเพื่อสร้างกลุ่มอัตโนมัติ
            </p>
          </div>
        </div>
      ) : (
        /* Group cards grid (1 col on iPhone, 2 cols on iPad/desktop) */
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <li key={group.id}>
              <GroupCard
                group={group}
                players={players}
                onPlay={handlePlay}
                onScore={(id) => setScoreGroupId(id)}
                onEdit={(id) => {
                  setEditError(null);
                  setEditGroupId(id);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Group score dialog */}
      {scoreGroup ? (
        <GroupScoreDialog
          group={scoreGroup}
          players={players}
          history={historyLoading || historyError ? null : history}
          onClose={() => setScoreGroupId(null)}
        />
      ) : null}

      {/* Edit group dialog */}
      {editGroup ? (
        <EditGroupDialog
          group={editGroup}
          busy={editBusy}
          error={editError}
          onRename={handleRename}
          onDelete={handleDelete}
          onClose={handleEditClose}
        />
      ) : null}
    </div>
  );
}
