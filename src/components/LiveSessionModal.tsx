"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Check,
  ChevronLeft,
  Dices,
  Plus,
  Power,
  Radio,
  Shuffle,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ScoreEntry } from "@/components/ScoreEntry";
import { getRandomMultiplier } from "@/lib/scoring";
import {
  computeLiveSessionStats,
  endLiveSession,
  updateSessionPlayerIds,
} from "@/lib/session";
import type { HistoryEntry, Player } from "@/types/models";
import type { LiveSession } from "@/types/session";

const LiveSessionChart = dynamic(
  () => import("@/components/LiveSessionChart").then((m) => m.LiveSessionChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-44 rounded-2xl border border-black/[0.04] dark:border-[#38383A] bg-black/[0.02] dark:bg-white/[0.02] animate-pulse" />
    ),
  },
);

const MULTIPLIERS = [1, 2, 4, 5, 8, 10, 20, 50];

function scoreTone(score: number): string {
  if (score > 0) return "text-[#34C759]";
  if (score < 0) return "text-[#FF3B30]";
  return "text-[#8E8E93] dark:text-[#98989D]";
}

export function LiveSessionModal({
  isOpen,
  session,
  players,
  history,
  onClose,
}: {
  isOpen: boolean;
  session: LiveSession | null;
  players: Player[];
  history: HistoryEntry[];
  onClose: () => void;
}) {
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [isScoreEntryActive, setIsScoreEntryActive] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

  // Initial table setup player selection
  const [initialSelectedIds, setInitialSelectedIds] = useState<string[]>([]);
  const [sessionTablePlayerIds, setSessionTablePlayerIds] = useState<string[]>(
    () => session?.playerIds ?? [],
  );

  // Sync internal player state when session.playerIds changes from RTDB / external events
  useEffect(() => {
    if (session?.playerIds && session.playerIds.length > 0) {
      setSessionTablePlayerIds(session.playerIds);
    }
  }, [session?.playerIds]);

  // Round preparation states
  const [selectedRoundPlayerIds, setSelectedRoundPlayerIds] = useState<string[]>([]);
  const [roundMultiplier, setRoundMultiplier] = useState<number>(1);
  const [isRandomMultiplier, setIsRandomMultiplier] = useState<boolean>(true);
  const [activeRoundMultiplier, setActiveRoundMultiplier] = useState<number>(1);

  // Compute live session data
  const stats = useMemo(() => {
    if (!session) return null;
    return computeLiveSessionStats(session, history, players);
  }, [session, history, players]);

  // Sync table players (players assigned to this table + any who played in this session)
  const tablePlayers = useMemo(() => {
    if (!session) return [];
    const idSet = new Set<string>([
      ...(session.playerIds ?? []),
      ...sessionTablePlayerIds,
    ]);
    if (stats) {
      stats.activePlayers.forEach((p) => idSet.add(p.id));
    }
    return players.filter((p) => idSet.has(p.id));
  }, [session, sessionTablePlayerIds, stats, players]);

  // Sync selectedRoundPlayerIds when table players initialize or change
  useEffect(() => {
    if (tablePlayers.length > 0) {
      setSelectedRoundPlayerIds((prev) => {
        if (prev.length === 0) {
          return tablePlayers.map((p) => p.id);
        }
        const valid = prev.filter((id) => tablePlayers.some((p) => p.id === id));
        return valid.length > 0 ? valid : tablePlayers.map((p) => p.id);
      });
    }
  }, [tablePlayers]);

  if (!isOpen || !session || !stats) return null;

  const isTableConfigured = tablePlayers.length >= 2;

  // Toggle initial player selection
  function toggleInitialPlayer(id: string) {
    setInitialSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  // Confirm initial table players
  async function handleConfirmInitialPlayers() {
    if (initialSelectedIds.length < 2 || !session) return;
    setSessionTablePlayerIds(initialSelectedIds);
    setSelectedRoundPlayerIds(initialSelectedIds);
    await updateSessionPlayerIds(session, initialSelectedIds);
  }

  // Toggle player active or benched for the upcoming round
  function toggleRoundPlayer(id: string) {
    setSelectedRoundPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  // Add a new player to the session table
  async function handleAddPlayerToTable(id: string) {
    if (!session) return;
    const currentIds = session.playerIds ?? [];
    if (!currentIds.includes(id)) {
      const nextIds = [...currentIds, id];
      setSessionTablePlayerIds(nextIds);
      setSelectedRoundPlayerIds((prev) => [...prev, id]);
      await updateSessionPlayerIds(session, nextIds);
    }
    setIsAddPlayerModalOpen(false);
  }

  // Handle Close Session
  async function handleConfirmEndSession() {
    setIsConfirmCloseOpen(false);
    await endLiveSession();
    onClose();
  }

  // Handle Score Entry within the session
  function handleStartScoreEntry() {
    if (selectedRoundPlayerIds.length < 2) return;
    const mult = isRandomMultiplier ? getRandomMultiplier() : roundMultiplier;
    setActiveRoundMultiplier(mult);
    setIsScoreEntryActive(true);
  }

  // Players in roster who are NOT currently at this table
  const availableRosterPlayers = players.filter(
    (p) => !tablePlayers.some((tp) => tp.id === p.id),
  );

  const selectedCount = selectedRoundPlayerIds.length;
  const multiplierLabel = isRandomMultiplier ? "สุ่ม" : `x${roundMultiplier}`;

  // If score entry mode is active within this session
  if (isScoreEntryActive) {
    const activeRoundPlayerObjects = players.filter((p) =>
      selectedRoundPlayerIds.includes(p.id),
    );

    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen min-h-dvh overflow-y-auto bg-[#F2F2F7] dark:bg-[#121214] flex flex-col justify-center items-center p-3 sm:p-6">
        <div className="w-full max-w-xl">
          <ScoreEntry
            players={activeRoundPlayerObjects}
            multiplier={activeRoundMultiplier}
            triggerReveal={isRandomMultiplier}
            liveSessionActive={true}
            sessionId={session.id}
            onBack={() => setIsScoreEntryActive(false)}
            onReset={() => setIsScoreEntryActive(false)}
          />
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW 1: INITIAL TABLE SETUP (If no players selected yet)
  // =========================================================
  if (!isTableConfigured) {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen min-h-dvh overflow-y-auto bg-[#F2F2F7] dark:bg-[#121214] flex flex-col">
        <div className="mx-auto w-full max-w-3xl flex-1 flex flex-col p-4 sm:p-6 md:p-8">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-6 border-b border-black/[0.06] dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-full border border-black/[0.06] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] active:scale-95 text-[#1C1C1E] dark:text-[#F2F2F7] text-xs font-semibold px-3.5 py-2 transition-all cursor-pointer shadow-xs"
            >
              <ChevronLeft className="size-4" />
              <span>กลับหน้าหลัก</span>
            </button>

            <span className="text-xs font-bold text-[#007AFF] bg-blue-50 dark:bg-blue-950/40 border border-blue-500/20 rounded-full px-3 py-1">
              เริ่มโต๊ะใหม่
            </span>

            <button
              type="button"
              onClick={() => setIsConfirmCloseOpen(true)}
              className="flex items-center gap-1 rounded-full border border-red-500/20 bg-red-50 dark:bg-red-950/30 text-[#FF3B30] text-xs font-semibold px-3 py-1.5 transition-all cursor-pointer"
            >
              <Power className="size-3.5" />
              <span>ยกเลิกโต๊ะ</span>
            </button>
          </div>

          {/* Setup Card */}
          <div className="my-auto py-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1.5 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">
                เลือกผู้เล่นสำหรับโต๊ะคืนนี้
              </h2>
              <p className="text-sm text-[#8E8E93] dark:text-[#98989D]">
                เลือกเพื่อนอย่างน้อย 2 คนที่นั่งร่วมโต๊ะ
              </p>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {players.map((player) => {
                const isSelected = initialSelectedIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => toggleInitialPlayer(player.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#007AFF] bg-blue-50/70 dark:bg-blue-950/30 shadow-xs"
                        : "border-black/[0.06] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="relative">
                      <PlayerAvatar player={player} className="size-10 text-sm" />
                      {isSelected && (
                        <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-[#007AFF] text-white flex items-center justify-center">
                          <Check className="size-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm text-[#1C1C1E] dark:text-[#F2F2F7] truncate">
                        {player.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Confirm Button */}
            <div className="pt-4 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmInitialPlayers}
                disabled={initialSelectedIds.length < 2}
                className={`flex min-h-[50px] w-full max-w-md items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-bold transition-all ${
                  initialSelectedIds.length >= 2
                    ? "bg-gradient-to-r from-[#2E8BFF] to-[#007AFF] text-white shadow-lg shadow-blue-500/25 active:scale-[0.98] cursor-pointer"
                    : "bg-gray-300 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed shadow-none"
                }`}
              >
                <span>
                  {initialSelectedIds.length >= 2
                    ? `เปิดโต๊ะด้วยผู้เล่น ${initialSelectedIds.length} คนนี้ ❯`
                    : "กรุณาเลือกผู้เล่นอย่างน้อย 2 คน"}
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* End Session Confirmation Dialog */}
        {isConfirmCloseOpen && (
          <ConfirmDialog
            title="ยกเลิกโต๊ะนี้หรือไม่?"
            description="ต้องการปิดโต๊ะและกลับสู่หน้าหลักใช่หรือไม่"
            confirmLabel="ปิดโต๊ะ"
            cancelLabel="เลือกผู้เล่นต่อ"
            destructive={true}
            onConfirm={handleConfirmEndSession}
            onClose={() => setIsConfirmCloseOpen(false)}
          />
        )}
      </div>
    );
  }

  // =========================================================
  // VIEW 2: ACTIVE FULL-SCREEN LIVE SESSION DASHBOARD
  // =========================================================
  return (
    <div className="fixed inset-0 z-[100] w-screen h-dvh overflow-y-auto bg-[#F2F2F7] dark:bg-[#121214] flex flex-col">
      <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col p-3 sm:p-4 md:p-5">
        
        {/* ========================================================= */}
        {/* TOP TOOLBAR: Return home (Left) | Pulse (Mid) | End (Right) */}
        {/* ========================================================= */}
        <header className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/10 pb-2.5 mb-3">
          {/* Left: Return home without closing session */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-full border border-black/[0.06] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] active:scale-95 text-[#1C1C1E] dark:text-[#F2F2F7] text-xs font-semibold px-3.5 py-2 transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft className="size-4" />
            <span>กลับหน้าหลัก</span>
          </button>

          {/* Center: Table Pulse (Time, Rounds, Speed) */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-[#38383A] rounded-full px-3.5 py-1.5 shadow-xs">
            <span className="flex items-center gap-1.5 text-[#34C759]">
              <span className="size-2 rounded-full bg-[#34C759] animate-pulse" />
              <span className="hidden sm:inline">โต๊ะ</span>
            </span>
            <span className="text-[#8E8E93] dark:text-[#98989D] hidden sm:inline">•</span>
            <span className="text-[#1C1C1E] dark:text-[#F2F2F7]">
              {stats.durationFormatted}
            </span>
            <span className="text-[#8E8E93] dark:text-[#98989D]">•</span>
            <span className="text-[#007AFF] dark:text-[#2E8BFF]">
              รอบที่ {stats.totalRounds}
            </span>
            <span className="text-[#8E8E93] dark:text-[#98989D] hidden sm:inline">•</span>
            <span className="text-[#8E8E93] dark:text-[#98989D] hidden sm:inline">
              {stats.avgSpeedFormatted}
            </span>
          </div>

          {/* Right: End table session */}
          <button
            type="button"
            onClick={() => setIsConfirmCloseOpen(true)}
            className="flex items-center gap-1 rounded-full border border-red-500/20 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 active:scale-95 text-[#FF3B30] text-xs font-semibold px-3.5 py-2 transition-all cursor-pointer shadow-xs"
          >
            <Power className="size-3.5" />
            <span className="hidden sm:inline">ปิดโต๊ะคืนนี้</span>
            <span className="sm:hidden">ปิดโต๊ะ</span>
          </button>
        </header>

        {/* ========================================================= */}
        {/* MAIN DASHBOARD CONTENT AREA                               */}
        {/* PC/iPad: Standings (Left) & Chart (Right) side-by-side    */}
        {/* iPhone: Naturally stacked: Chart -> Standings             */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5 items-stretch flex-1 min-h-0">
            
            {/* 1. STANDINGS (อันดับคะแนนในโต๊ะ) */}
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#8E8E93] dark:text-[#98989D] uppercase tracking-wider">
                  อันดับคะแนนในโต๊ะ
                </span>
                <span className="text-[10px] font-semibold text-[#007AFF] dark:text-[#2E8BFF]">
                  {tablePlayers.length} คน
                </span>
              </div>

              {stats.standings.length === 0 ? (
                <div className="flex flex-1 min-h-[160px] sm:min-h-[200px] flex-col items-center justify-center p-6 rounded-[22px] border border-black/[0.05] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] text-center shadow-xs">
                  <Dices className="size-8 sm:size-9 text-[#8E8E93] dark:text-[#98989D] mb-2 opacity-60" />
                  <span className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    ยังไม่มีคะแนนในโต๊ะนี้
                  </span>
                  <span className="text-xs text-[#8E8E93] dark:text-[#98989D] mt-1">
                    เลือกตัวคูณด้านล่างแล้วกดกรอกคะแนนรอบแรก
                  </span>
                </div>
              ) : (
                <div className="flex-1 rounded-[22px] border border-black/[0.05] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-2.5 sm:p-3 shadow-xs flex flex-col justify-between overflow-hidden">
                  <ul className="flex flex-col gap-2 max-h-[220px] sm:max-h-[240px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                    {stats.standings.map((st, index) => {
                      const rank = index + 1;
                      const isPlayingNext = selectedRoundPlayerIds.includes(st.player.id);

                      return (
                        <li
                          key={st.player.id}
                          className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-black/[0.04] dark:border-[#38383A] bg-black/[0.015] dark:bg-white/[0.02] px-3 sm:px-3.5 py-2 sm:py-2.5 shadow-2xs transition-all"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <span
                              className={`font-black text-xs sm:text-sm w-4 text-center tabular-nums ${
                                rank === 1
                                  ? "text-amber-500"
                                  : rank === 2
                                    ? "text-slate-400"
                                    : rank === 3
                                      ? "text-amber-700 dark:text-amber-600"
                                      : "text-[#8E8E93] dark:text-[#98989D]"
                              }`}
                            >
                              {rank}
                            </span>
                            <PlayerAvatar
                              player={st.player}
                              className="size-7 sm:size-8 text-xs shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs sm:text-sm text-[#1C1C1E] dark:text-[#F2F2F7] truncate max-w-[120px] sm:max-w-[160px]">
                                  {st.player.name}
                                </span>
                                {!isPlayingNext && (
                                  <span className="rounded-full bg-black/[0.05] dark:bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-medium text-[#8E8E93] dark:text-[#98989D]">
                                    พัก
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#8E8E93] dark:text-[#98989D] truncate">
                                {st.periodRank ? (
                                  <>
                                    ที่ {st.periodRank} งวดนี้ ({st.periodScore > 0 ? `+${st.periodScore.toLocaleString()}` : st.periodScore.toLocaleString()})
                                  </>
                                ) : (
                                  "ยังไม่มีอันดับงวด"
                                )}
                              </span>
                            </div>
                          </div>

                          <AnimatedNumber
                            value={st.sessionScore}
                            className={`text-base sm:text-lg font-black tabular-nums shrink-0 ml-2 ${scoreTone(st.sessionScore)}`}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* 2. CHART (คะแนนรายรอบ) */}
            <div className="flex flex-col gap-1.5 min-w-0 flex-1 order-first md:order-last">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#8E8E93] dark:text-[#98989D] uppercase tracking-wider">
                  คะแนนรายรอบ
                </span>
                <span className="text-[10px] text-[#8E8E93] dark:text-[#98989D]">
                  {stats.totalRounds > 0 ? `รอบ 1–${stats.totalRounds}` : "ยังไม่มีรอบ"}
                </span>
              </div>
              <div className="rounded-[22px] border border-black/[0.05] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-3 sm:p-3.5 shadow-xs flex-1 flex flex-col justify-center">
                <LiveSessionChart
                  chartData={stats.chartData}
                  players={tablePlayers}
                  height={200}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM ROUND PREP BAR: Ergonomic Player Swap + Multiplier */}
        {/* ========================================================= */}
        <footer className="mt-auto rounded-[22px] sm:rounded-[24px] border border-black/[0.06] dark:border-[#38383A] p-3 sm:p-3.5 bg-white dark:bg-[#1C1C1E] shadow-sm flex flex-col gap-2.5 sm:gap-3">
          
          {/* Controls: 2-column grid on desktop/iPad, stacked on iPhone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
            
            {/* 1. Players in Round */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="font-bold text-[#8E8E93] dark:text-[#98989D] uppercase tracking-wider text-[11px]">
                  ผู้เล่นในรอบนี้ ({selectedCount} คน)
                </span>
                {availableRosterPlayers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddPlayerModalOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#007AFF] dark:text-[#2E8BFF] hover:underline cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="size-3.5" />
                    <span>เพิ่มคนเข้าโต๊ะ</span>
                  </button>
                )}
              </div>

              {/* Player Chips Row (Clean, scrollable with no visible native scrollbar) */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {tablePlayers.map((tp) => {
                  const isSelected = selectedRoundPlayerIds.includes(tp.id);
                  return (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => toggleRoundPlayer(tp.id)}
                      className={`flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 transition-all cursor-pointer active:scale-95 ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] dark:text-[#2E8BFF] border border-blue-500/30 shadow-xs"
                          : "bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] dark:text-[#98989D] border border-transparent opacity-60"
                      }`}
                    >
                      <PlayerAvatar player={tp} className="size-5 text-[10px]" />
                      <span className="truncate max-w-[100px]">{tp.name}</span>
                      {isSelected ? (
                        <Check className="size-3 text-[#007AFF] dark:text-[#2E8BFF]" />
                      ) : (
                        <span className="text-[10px] text-[#8E8E93] dark:text-[#98989D]">พัก</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Multiplier Picker */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="font-bold text-[#8E8E93] dark:text-[#98989D] uppercase tracking-wider text-[11px]">
                  ตัวคูณ
                </span>
                <span className="font-bold text-xs text-[#007AFF] dark:text-[#2E8BFF] tabular-nums">
                  {multiplierLabel}
                </span>
              </div>

              {/* Multiplier Pills with comfortable touch targets and no scrollbar */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {MULTIPLIERS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setRoundMultiplier(m);
                      setIsRandomMultiplier(false);
                    }}
                    className={`min-w-[40px] h-8 sm:h-8.5 px-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer tabular-nums flex items-center justify-center shrink-0 active:scale-95 ${
                      !isRandomMultiplier && roundMultiplier === m
                        ? "bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-xs"
                        : "bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] dark:text-[#98989D] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
                    }`}
                  >
                    x{m}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsRandomMultiplier(true)}
                  className={`h-8 sm:h-8.5 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
                    isRandomMultiplier
                      ? "bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-xs"
                      : "bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] dark:text-[#98989D] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
                  }`}
                >
                  <Shuffle className="size-3.5" />
                  <span>สุ่ม</span>
                </button>
              </div>
            </div>

          </div>

          {/* Action Button: Well-proportioned max-w on PC, full width on mobile */}
          <div className="w-full flex justify-center pt-0.5">
            <button
              type="button"
              onClick={handleStartScoreEntry}
              disabled={selectedCount < 2}
              className={`flex min-h-[46px] sm:min-h-[48px] w-full max-w-lg items-center justify-center gap-2 rounded-2xl px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold transition-all ${
                selectedCount >= 2
                  ? "bg-gradient-to-r from-[#2E8BFF] to-[#007AFF] text-white shadow-md shadow-blue-500/25 active:scale-[0.98] cursor-pointer hover:opacity-95"
                  : "bg-gray-300 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed shadow-none"
              }`}
            >
              <Radio className="size-4 animate-pulse" />
              <span>
                {selectedCount >= 2
                  ? "กรอกคะแนน"
                  : "กรุณาเลือกผู้เล่นอย่างน้อย 2 คน"}
              </span>
            </button>
          </div>
        </footer>

      </div>

      {/* Add Player to Table Dialog */}
      {isAddPlayerModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] border border-black/[0.08] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4.5 text-[#007AFF]" />
                <h3 className="font-semibold text-base text-[#1C1C1E] dark:text-[#F2F2F7]">
                  เพิ่มผู้เล่นเข้าโต๊ะ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPlayerModalOpen(false)}
                className="size-7 rounded-full bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center text-[#8E8E93] dark:text-[#98989D] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-[#8E8E93] dark:text-[#98989D]">
              เลือกเพื่อนจากรายชื่อเพื่อดึงเข้ามาในโต๊ะคืนนี้
            </p>

            <ul className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {availableRosterPlayers.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between rounded-xl border border-black/[0.05] dark:border-[#38383A] p-2.5 bg-black/[0.01] dark:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2.5">
                    <PlayerAvatar player={player} className="size-8 text-xs" />
                    <span className="font-semibold text-xs text-[#1C1C1E] dark:text-[#F2F2F7]">
                      {player.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddPlayerToTable(player.id)}
                    className="rounded-full bg-[#007AFF] px-3 py-1 text-xs font-semibold text-white shadow-xs active:scale-95 hover:bg-[#0062cc] transition-all cursor-pointer"
                  >
                    + เพิ่มเข้าโต๊ะ
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* End Session Confirmation Dialog */}
      {isConfirmCloseOpen && (
        <ConfirmDialog
          title="ปิดโต๊ะคืนนี้หรือไม่?"
          description="คะแนนทุกรอบที่เล่นไปคืนนี้จะยังคงถูกบันทึกไว้ในประวัติและคะแนนประจำงวดตามปกติ"
          confirmLabel="ปิดโต๊ะคืนนี้"
          cancelLabel="เล่นต่อ"
          destructive={true}
          onConfirm={handleConfirmEndSession}
          onClose={() => setIsConfirmCloseOpen(false)}
        />
      )}
    </div>
  );
}
