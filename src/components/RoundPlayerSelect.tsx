"use client";

// Ultra-Clean iOS 18 Player Selector for the current round.
// Layout Order (Exact):
// 1. "เลือกผู้เล่น" (Header above dropdown)
// 2. "เพิ่มผู้เล่น" (Dropdown with search)
// 3. 2x2 Grid of the 4 most recently played unselected players - ALWAYS SORTED
// 4. "ผู้เล่นในรอบนี้" (Centered row of 4 profile avatars with floating name tooltips)
//
// Features:
// - Centered Profile Avatars: Clean, compact horizontal row of 4 avatars (zero space issue!)
// - Hover/Tap Floating Name Tooltip (same as in "หน้าขาประจำ"): hover on PC or tap on mobile to check name
// - Always Sorted by Last-Played (#1, #2, #3, #4): The top 4 cards are never scrambled or out-of-order
// - Ultra-Smooth GPU Hardware-Accelerated (120 FPS Compositor) Shared Element Flight Transition
// - 380ms Grace Period: When tapping cards above, remaining cards stay still so adjacent cards can be tapped continuously
// - 0ms Instant Removal: Clearing a player from the round has ZERO delay and immediately re-sorts
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, Plus, Search } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Player } from "@/types/models";

interface FlyingBadge {
  id: string;
  player: Player;
  from: { left: number; top: number; width: number; height: number };
  deltaX: number;
  deltaY: number;
  scale: number;
  animating: boolean;
}

// Calculate balanced distribution of items across rows with maxPerRow = 5
export function getRowDistribution(totalCount: number, maxPerRow = 5): number[] {
  if (totalCount <= 0) return [];
  if (totalCount <= maxPerRow) return [totalCount];

  const numRows = Math.ceil(totalCount / maxPerRow);
  const basePerRow = Math.floor(totalCount / numRows);
  const remainder = totalCount % numRows;

  const rows: number[] = [];
  for (let r = 0; r < numRows; r++) {
    rows.push(basePerRow + (r < remainder ? 1 : 0));
  }
  return rows;
}

// Map any player index in a group of totalCount players to its row and column
export function getPlayerPosition(
  playerIndex: number,
  totalCount: number,
  maxPerRow = 5,
) {
  const distribution = getRowDistribution(totalCount, maxPerRow);
  let currentIndex = 0;
  for (let rowIndex = 0; rowIndex < distribution.length; rowIndex++) {
    const countInRow = distribution[rowIndex];
    if (playerIndex < currentIndex + countInRow) {
      const colIndex = playerIndex - currentIndex;
      return { rowIndex, colIndex, countInRow, totalRows: distribution.length };
    }
    currentIndex += countInRow;
  }
  return { rowIndex: 0, colIndex: 0, countInRow: 1, totalRows: 1 };
}

// Partition an array of items into balanced rows
export function partitionIntoRows<T>(items: T[], maxPerRow = 5): T[][] {
  const count = items.length;
  if (count === 0) return [];
  const distribution = getRowDistribution(count, maxPerRow);
  const rows: T[][] = [];
  let index = 0;
  for (const rowCount of distribution) {
    rows.push(items.slice(index, index + rowCount));
    index += rowCount;
  }
  return rows;
}

export function RoundPlayerSelect({
  players,
  loading,
  selectedIds,
  onToggle,
}: {
  players: Player[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [flyingBadges, setFlyingBadges] = useState<FlyingBadge[]>([]);
  const [fadingGridIds, setFadingGridIds] = useState<Set<string>>(new Set());
  const [displayedPlayers, setDisplayedPlayers] = useState<Player[]>([]);
  const [mounted, setMounted] = useState(false);

  // Tooltip & hover states for bottom frame avatars
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const reflowTimerRef = useRef<NodeJS.Timeout | null>(null);

  const topDropdownRef = useRef<HTMLDivElement>(null);
  const middleGridRef = useRef<HTMLUListElement>(null);
  const bottomFrameRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchInputId = useId();

  // All unselected players in order of last-played history (ALWAYS 100% SORTED)
  const availablePlayers = useMemo(
    () => players.filter((p) => !selectedIds.includes(p.id)),
    [players, selectedIds],
  );

  // Selected player objects in order of selection
  const selectedPlayers = useMemo(() => {
    return selectedIds
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined);
  }, [players, selectedIds]);

  // Combined selected and in-flight players to keep slot indices stable and instantly responsive
  const activePlayers = useMemo(() => {
    const list = [...selectedPlayers];
    for (const badge of flyingBadges) {
      if (!list.some((p) => p.id === badge.player.id)) {
        list.push(badge.player);
      }
    }
    return list;
  }, [selectedPlayers, flyingBadges]);

  // Automatically balance players into centered rows with max 5 players per row
  const playerRows = useMemo(() => {
    return partitionIntoRows(activePlayers, 5);
  }, [activePlayers]);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (reflowTimerRef.current) clearTimeout(reflowTimerRef.current);
    };
  }, []);

  // Sync displayedPlayers with the true top 4 most recently played unselected players
  // When no active tap grace period is running, always keep in exact sorted order
  useEffect(() => {
    if (fadingGridIds.size === 0) {
      setDisplayedPlayers(availablePlayers.slice(0, 4));
    }
  }, [availablePlayers, fadingGridIds.size]);

  // Candidate players for dropdown (unselected players not currently shown in the top 4 grid)
  const candidatePlayers = useMemo(() => {
    const displayedIdSet = new Set(displayedPlayers.map((p) => p.id));
    const query = searchQuery.trim().toLowerCase();
    return availablePlayers
      .filter((p) => !displayedIdSet.has(p.id))
      .filter((p) => query === "" || p.name.toLowerCase().includes(query));
  }, [availablePlayers, displayedPlayers, searchQuery]);

  // Click outside to collapse dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        topDropdownRef.current &&
        !topDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Click outside to dismiss active mobile avatar tooltip
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        bottomFrameRef.current &&
        !bottomFrameRef.current.contains(event.target as Node)
      ) {
        setActiveTooltipId(null);
      }
    }
    if (activeTooltipId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeTooltipId]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
    }
  }, [isDropdownOpen]);

  // Helper to compute target rect in the bottom balanced centered row layout
  function computeTargetInFrame(
    targetIdx: number,
    newTotal: number,
  ): {
    left: number;
    top: number;
    width: number;
    height: number;
  } {
    if (!bottomFrameRef.current) {
      return { left: 0, top: 0, width: 44, height: 44 };
    }

    const isSm = typeof window !== "undefined" && window.innerWidth >= 640;
    const slotSize = isSm ? 52 : 44;
    const gapX = isSm ? 16 : 8;
    const gapY = isSm ? 12 : 10;
    const padY = isSm ? 14 : 10;

    const bottomRect = bottomFrameRef.current.getBoundingClientRect();

    const { rowIndex, colIndex, countInRow, totalRows } = getPlayerPosition(
      targetIdx,
      newTotal,
      5,
    );

    const rowWidth = countInRow * slotSize + (countInRow - 1) * gapX;
    const startLeft = bottomRect.left + (bottomRect.width - rowWidth) / 2;
    const targetLeft = startLeft + colIndex * (slotSize + gapX);

    const totalRowsHeight = totalRows * slotSize + (totalRows - 1) * gapY;
    const availableHeight = bottomRect.height;
    const startTop =
      availableHeight > totalRowsHeight + padY * 2
        ? bottomRect.top + (availableHeight - totalRowsHeight) / 2
        : bottomRect.top + padY;
    const targetTop = startTop + rowIndex * (slotSize + gapY);

    return {
      left: targetLeft,
      top: targetTop,
      width: slotSize,
      height: slotSize,
    };
  }

  // 1. Select player from the 2x2 grid (GPU hardware-accelerated flight down to centered circle)
  function handleSelectFromGrid(
    player: Player,
    event: React.MouseEvent<HTMLElement>,
  ) {
    const existingIds = new Set([
      ...selectedPlayers.map((p) => p.id),
      ...flyingBadges.map((b) => b.player.id),
    ]);
    if (existingIds.has(player.id)) return;

    // Direct measurement of the circular avatar element to preserve a perfect 1:1 circle
    const avatarEl =
      event.currentTarget.querySelector<HTMLElement>("[data-avatar-root]") ||
      event.currentTarget.querySelector<HTMLElement>("[role='img']") ||
      event.currentTarget;
    const fromRect = avatarEl.getBoundingClientRect();
    const targetIdx = existingIds.size;
    const newTotal = targetIdx + 1;
    const toRect = computeTargetInFrame(targetIdx, newTotal);

    const deltaX = toRect.left - fromRect.left;
    const deltaY = toRect.top - fromRect.top;
    const scale = toRect.width / Math.max(1, fromRect.width);

    const badgeId = `${player.id}-${Date.now()}`;
    const newBadge: FlyingBadge = {
      id: badgeId,
      player,
      from: {
        left: fromRect.left,
        top: fromRect.top,
        width: fromRect.width,
        height: fromRect.height,
      },
      deltaX,
      deltaY,
      scale,
      animating: false,
    };

    // Mark player as fading so button dims out while remaining cards stay completely steady
    setFadingGridIds((prev) => new Set(prev).add(player.id));
    setFlyingBadges((prev) => [...prev, newBadge]);

    // Register selection immediately
    onToggle(player.id);

    // Trigger GPU compositor animation in next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlyingBadges((prev) =>
          prev.map((b) => (b.id === badgeId ? { ...b, animating: true } : b)),
        );
      });
    });

    // Remove flying badge when it reaches the frame (260ms)
    setTimeout(() => {
      setFlyingBadges((prev) => prev.filter((b) => b.id !== badgeId));
    }, 260);

    // 380ms Grace Period:
    // Keeps current cards in place so adjacent cards don't jump away under user's fingers.
    // Once user finishes tapping, smoothly reflows to new top 4, ALWAYS SORTED by last played!
    if (reflowTimerRef.current) clearTimeout(reflowTimerRef.current);
    reflowTimerRef.current = setTimeout(() => {
      setFadingGridIds(new Set());
    }, 380);
  }

  // 2. Select player from dropdown (GPU flight down to centered circle)
  function handleSelectFromDropdown(
    candidate: Player,
    event: React.MouseEvent<HTMLElement>,
  ) {
    const existingIds = new Set([
      ...selectedPlayers.map((p) => p.id),
      ...flyingBadges.map((b) => b.player.id),
    ]);
    if (existingIds.has(candidate.id)) return;

    // Direct measurement of the circular avatar element to preserve a perfect 1:1 circle
    const avatarEl =
      event.currentTarget.querySelector<HTMLElement>("[data-avatar-root]") ||
      event.currentTarget.querySelector<HTMLElement>("[role='img']") ||
      event.currentTarget;
    const fromRect = avatarEl.getBoundingClientRect();
    const targetIdx = existingIds.size;
    const newTotal = targetIdx + 1;
    const toRect = computeTargetInFrame(targetIdx, newTotal);

    setIsDropdownOpen(false);
    setSearchQuery("");

    const deltaX = toRect.left - fromRect.left;
    const deltaY = toRect.top - fromRect.top;
    const scale = toRect.width / Math.max(1, fromRect.width);

    const badgeId = `${candidate.id}-${Date.now()}`;
    const newBadge: FlyingBadge = {
      id: badgeId,
      player: candidate,
      from: {
        left: fromRect.left,
        top: fromRect.top,
        width: fromRect.width,
        height: fromRect.height,
      },
      deltaX,
      deltaY,
      scale,
      animating: false,
    };

    setFlyingBadges((prev) => [...prev, newBadge]);
    onToggle(candidate.id);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlyingBadges((prev) =>
          prev.map((b) => (b.id === badgeId ? { ...b, animating: true } : b)),
        );
      });
    });

    setTimeout(() => {
      setFlyingBadges((prev) => prev.filter((b) => b.id !== badgeId));
    }, 260);

    if (reflowTimerRef.current) clearTimeout(reflowTimerRef.current);
    reflowTimerRef.current = setTimeout(() => {
      setFadingGridIds(new Set());
    }, 380);
  }

  // 3. Remove player from the frame: 0ms INSTANT removal with zero delay!
  function handleRemoveFromFrame(player: Player) {
    // Instant execution: NO DELAY as requested!
    onToggle(player.id);

    // Cancel any active selection delay timer
    if (reflowTimerRef.current) {
      clearTimeout(reflowTimerRef.current);
      reflowTimerRef.current = null;
    }
    setFadingGridIds(new Set());

    // Immediately update grid to the new top 4 (including returned player in exact sorted order!)
    const nextAvailable = [
      player,
      ...players.filter((p) => !selectedIds.includes(p.id) && p.id !== player.id),
    ].sort((a, b) => {
      const idxA = players.findIndex((p) => p.id === a.id);
      const idxB = players.findIndex((p) => p.id === b.id);
      return idxA - idxB;
    });
    setDisplayedPlayers(nextAvailable.slice(0, 4));
  }

  // Handle clicking on an avatar in the bottom frame:
  // On PC (mouse): hover already showed the name tooltip, so clicking removes instantly!
  // On Mobile (touch): first tap shows the name tooltip, second tap removes player!
  function handleAvatarClick(player: Player, e: React.MouseEvent) {
    const isMouse = (e.nativeEvent as PointerEvent).pointerType === "mouse";
    if (isMouse || activeTooltipId === player.id) {
      setActiveTooltipId(null);
      setHoveredId(null);
      handleRemoveFromFrame(player);
    } else {
      setActiveTooltipId(player.id);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 py-4 text-sm text-[#8E8E93]">
        <Loader2 className="size-4.5 animate-spin text-[#007AFF]" />
        กำลังโหลดรายชื่อผู้เล่น...
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <p className="rounded-2xl border border-black/[0.04] dark:border-[#38383A] bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl p-5 text-center text-sm text-[#8E8E93] dark:text-[#98989D]">
        ยังไม่มีผู้เล่น สร้างโปรไฟล์ก่อนเริ่มเกม
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 relative">
      {/* 1. TOP: "เลือกผู้เล่น" Section */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#8E8E93] dark:text-[#98989D] px-1">
          เลือกผู้เล่น
        </span>

        {/* "เพิ่มผู้เล่น" Dropdown */}
        <div ref={topDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            className="flex min-h-[42px] sm:min-h-[44px] w-full items-center justify-between rounded-xl border border-black/[0.08] dark:border-[#38383A] bg-black/[0.02] dark:bg-white/[0.03] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="size-4 text-[#007AFF] shrink-0" />
              <span>เพิ่มผู้เล่น</span>
            </div>
            <ChevronDown
              className={`size-4 text-[#8E8E93] dark:text-[#98989D] shrink-0 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Floating Panel */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-12 z-30 flex flex-col gap-2 rounded-2xl border border-black/[0.08] dark:border-[#38383A] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl p-2.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Search Input */}
              <div className="relative flex items-center">
                <label htmlFor={searchInputId} className="sr-only">
                  ค้นหาชื่อผู้เล่น
                </label>
                <Search className="absolute left-2.5 size-4 text-[#8E8E93] pointer-events-none" />
                <input
                  id={searchInputId}
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ..."
                  className="w-full rounded-xl border border-black/[0.08] dark:border-[#38383A] bg-gray-50 dark:bg-[#2C2C2E] py-2 pl-8.5 pr-3 text-xs sm:text-sm text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              {/* Candidate List */}
              <ul className="max-h-[180px] overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04] pr-0.5">
                {candidatePlayers.length === 0 ? (
                  <li className="p-3 text-center text-xs text-[#8E8E93] dark:text-[#98989D]">
                    {searchQuery ? "ไม่พบผู้เล่นที่ค้นหา" : "ไม่มีผู้เล่นอื่นนอกตาราง"}
                  </li>
                ) : (
                  candidatePlayers.map((candidate) => (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        onClick={(e) => handleSelectFromDropdown(candidate, e)}
                        className="flex min-h-[42px] w-full items-center rounded-xl px-2.5 py-2 text-left text-xs sm:text-sm hover:bg-blue-50/70 dark:hover:bg-blue-950/40 active:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PlayerAvatar
                            player={candidate}
                            className="size-7 text-xs shrink-0"
                          />
                          <span className="truncate font-medium text-[#1C1C1E] dark:text-[#F2F2F7]">
                            {candidate.name}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* 2x2 Grid (ALWAYS SORTED BY LAST-PLAYED) */}
        {displayedPlayers.length === 0 ? (
          <div className="flex min-h-[52px] items-center justify-center rounded-2xl border border-dashed border-black/[0.08] dark:border-[#38383A] bg-black/[0.015] dark:bg-white/[0.02] p-3 text-xs text-[#8E8E93] dark:text-[#98989D]">
            เลือกผู้เล่นครบทุกคนแล้ว
          </div>
        ) : (
          <ul
            ref={middleGridRef}
            className="grid grid-cols-2 gap-2 sm:gap-2.5"
          >
            {displayedPlayers.map((player) => {
              const isFading = fadingGridIds.has(player.id);
              return (
                <li key={player.id} className="min-h-[48px] sm:min-h-[52px]">
                  <button
                    type="button"
                    disabled={isFading}
                    onClick={(e) => handleSelectFromGrid(player, e)}
                    className={`flex min-h-[48px] sm:min-h-[52px] w-full items-center gap-2.5 rounded-2xl border-2 p-2 sm:p-2.5 text-left transition-all duration-200 ease-out active:scale-[0.96] cursor-pointer ${
                      isFading
                        ? "opacity-0 pointer-events-none"
                        : "border-black/[0.05] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] shadow-2xs hover:bg-blue-50/40 dark:hover:bg-[#2C2C2E] hover:border-[#007AFF]/30 opacity-100"
                    }`}
                  >
                    <PlayerAvatar
                      player={player}
                      className="size-9 sm:size-10 text-sm shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                      {player.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 2. BOTTOM: "ผู้เล่นในรอบนี้" Frame with Centered Profiles & Hover/Tap Tooltips */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-[#8E8E93] dark:text-[#98989D]">
            ผู้เล่นในรอบนี้
          </span>
          <span className="text-xs font-bold text-[#007AFF] dark:text-[#2E8BFF] tabular-nums">
            {activePlayers.length > 0 ? `${activePlayers.length} คน` : ""}
          </span>
        </div>

        <div
          ref={bottomFrameRef}
          className={`min-h-[68px] sm:min-h-[80px] flex flex-col justify-center gap-2 sm:gap-3 rounded-2xl border-2 border-solid p-2.5 sm:p-3.5 transition-colors duration-200 overflow-visible ${
            activePlayers.length > 0
              ? "border-[#007AFF]/35 dark:border-[#007AFF]/40 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs"
              : "border-black/[0.08] dark:border-[#38383A] bg-black/[0.015] dark:bg-white/[0.02]"
          }`}
        >
          {playerRows.length === 0 ? null : (
            playerRows.map((rowPlayers, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                className="relative flex items-center justify-center gap-2 sm:gap-4 overflow-visible py-0.5"
              >
                {rowPlayers.map((player) => {
                  const isFlying = flyingBadges.some(
                    (b) => b.player.id === player.id,
                  );

                  if (isFlying) {
                    return (
                      <div
                        key={player.id}
                        className="size-11 sm:size-13 rounded-full pointer-events-none shrink-0"
                      />
                    );
                  }

                  const isTooltipOpen =
                    hoveredId === player.id || activeTooltipId === player.id;

                  return (
                    <div
                      key={player.id}
                      className="relative shrink-0"
                      onMouseEnter={() => setHoveredId(player.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <button
                        type="button"
                        title={player.name}
                        aria-label={`ผู้เล่น ${player.name}`}
                        onClick={(e) => handleAvatarClick(player, e)}
                        className={`group relative size-11 sm:size-13 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center active:scale-95 ${
                          activeTooltipId === player.id
                            ? "ring-2 ring-[#007AFF] ring-offset-2 dark:ring-offset-[#1C1C1E] scale-105"
                            : "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                        }`}
                      >
                        <PlayerAvatar
                          player={player}
                          className="size-full text-lg sm:text-xl shadow-xs"
                        />
                      </button>

                      {/* Floating Name Tooltip (same as in Groups.tsx) */}
                      {isTooltipOpen && (
                        <div
                          role="tooltip"
                          className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 max-w-[160px] truncate whitespace-nowrap rounded-lg bg-[#1C1C1E] dark:bg-white px-2.5 py-1 text-xs font-semibold text-white dark:text-[#1C1C1E] shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                        >
                          {player.name}
                          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#1C1C1E] dark:border-t-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. OVERLAY: Ultra-Smooth GPU Hardware-Accelerated Shared Element Flight Clones */}
      {mounted && flyingBadges.length > 0 && createPortal(
        <>
          {flyingBadges.map((badge) => (
            <div
              key={badge.id}
              style={{
                position: "fixed",
                left: badge.from.left,
                top: badge.from.top,
                width: badge.from.width,
                height: badge.from.height,
                transform: badge.animating
                  ? `translate3d(${badge.deltaX}px, ${badge.deltaY}px, 0px) scale(${badge.scale})`
                  : "translate3d(0px, 0px, 0px) scale(1)",
                transformOrigin: "top left",
                transition: badge.animating
                  ? "transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 260ms ease"
                  : "none",
                willChange: "transform",
                zIndex: 99999,
                pointerEvents: "none",
                borderRadius: "9999px",
              }}
              className="rounded-full shadow-lg shadow-blue-500/25 ring-2 ring-[#007AFF]/60 overflow-hidden"
            >
              <PlayerAvatar
                player={badge.player}
                className="size-full text-base sm:text-lg"
              />
            </div>
          ))}
        </>,
        document.body,
      )}
    </div>
  );
}
