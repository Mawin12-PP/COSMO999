"use client";

// Ultra-Clean iOS 18 Player Selector for the current round.
// Layout Order (Exact):
// 1. "เพิ่มผู้เล่น" (Dropdown at the top)
// 2. "เลือกผู้เล่น" (2x2 grid of the 4 most recently played unselected players)
// 3. "ผู้เล่นในรอบนี้" (Frame at the bottom where chosen players gather)
//
// Features:
// - Shared Element Flight Transition (Fly / Glide): Badges fly smoothly between grid and frame without any column flashing
// - Auto-layout Reflow: Clean CSS transition when cards enter/leave
// - Full responsiveness across iPhone, iPad, and PC with zero overflow
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, Plus, Search } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Player } from "@/types/models";

interface FlyingBadge {
  player: Player;
  from: { left: number; top: number; width: number; height: number };
  to: { left: number; top: number; width: number; height: number };
  animating: boolean;
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
  const [flyingBadge, setFlyingBadge] = useState<FlyingBadge | null>(null);
  const [fadingPlayerId, setFadingPlayerId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const topDropdownRef = useRef<HTMLDivElement>(null);
  const middleGridRef = useRef<HTMLUListElement>(null);
  const bottomFrameRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchInputId = useId();

  // All unselected players in order of last-played history
  const availablePlayers = useMemo(
    () => players.filter((p) => !selectedIds.includes(p.id)),
    [players, selectedIds],
  );

  // Top 4 unselected players to always show in the 2x2 grid
  const topGridPlayers = useMemo(
    () => availablePlayers.slice(0, 4),
    [availablePlayers],
  );

  const topGridIdSet = useMemo(
    () => new Set(topGridPlayers.map((p) => p.id)),
    [topGridPlayers],
  );

  // Candidate players for dropdown (unselected players not already displayed in the top 4)
  const candidatePlayers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return availablePlayers
      .filter((p) => !topGridIdSet.has(p.id))
      .filter((p) => query === "" || p.name.toLowerCase().includes(query));
  }, [availablePlayers, topGridIdSet, searchQuery]);

  // Selected player objects in order of selection
  const selectedPlayers = useMemo(() => {
    return selectedIds
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined);
  }, [players, selectedIds]);

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

  // Helper to compute target rect in the bottom frame
  function computeTargetInFrame(index: number): {
    left: number;
    top: number;
    width: number;
    height: number;
  } {
    if (!bottomFrameRef.current) {
      return { left: 0, top: 0, width: 140, height: 48 };
    }
    const rect = bottomFrameRef.current.getBoundingClientRect();
    const isSm = window.innerWidth >= 640;
    const pad = isSm ? 10 : 8;
    const gap = isSm ? 10 : 8;
    const borderWidth = 2;

    const existingBtn = bottomFrameRef.current.querySelector("li button");
    if (existingBtn) {
      const btnRect = existingBtn.getBoundingClientRect();
      const row = Math.floor(index / 2);
      const col = index % 2;
      return {
        left: rect.left + borderWidth + pad + col * (btnRect.width + gap),
        top: rect.top + borderWidth + pad + row * (btnRect.height + gap),
        width: btnRect.width,
        height: btnRect.height,
      };
    }

    const availWidth = rect.width - borderWidth * 2 - pad * 2;
    const cardWidth = Math.max(80, (availWidth - gap) / 2);
    const cardHeight = isSm ? 50 : 46;

    const row = Math.floor(index / 2);
    const col = index % 2;

    return {
      left: rect.left + borderWidth + pad + col * (cardWidth + gap),
      top: rect.top + borderWidth + pad + row * (cardHeight + gap),
      width: cardWidth,
      height: cardHeight,
    };
  }

  // Helper to compute target rect in the 2x2 grid
  function computeTargetInGrid(slotIndex: number): {
    left: number;
    top: number;
    width: number;
    height: number;
  } {
    if (!middleGridRef.current) {
      return { left: 0, top: 0, width: 140, height: 50 };
    }

    const targetLi = middleGridRef.current.children[slotIndex] as HTMLElement | undefined;
    if (targetLi) {
      const targetBtn = targetLi.querySelector("button");
      if (targetBtn) {
        const btnRect = targetBtn.getBoundingClientRect();
        return {
          left: btnRect.left,
          top: btnRect.top,
          width: btnRect.width,
          height: btnRect.height,
        };
      }
    }

    const rect = middleGridRef.current.getBoundingClientRect();
    const isSm = window.innerWidth >= 640;
    const gap = isSm ? 10 : 8;
    const cardWidth = Math.max(80, (rect.width - gap) / 2);
    const cardHeight = isSm ? 52 : 48;

    const row = Math.floor(slotIndex / 2);
    const col = slotIndex % 2;

    return {
      left: rect.left + col * (cardWidth + gap),
      top: rect.top + row * (cardHeight + gap),
      width: cardWidth,
      height: cardHeight,
    };
  }

  // 1. Select player from the 2x2 grid (Flies DOWN to the frame)
  function handleSelectFromGrid(player: Player, event: React.MouseEvent<HTMLElement>) {
    if (flyingBadge) return;
    const fromRect = event.currentTarget.getBoundingClientRect();
    const toRect = computeTargetInFrame(selectedPlayers.length);

    setFadingPlayerId(player.id);
    setFlyingBadge({
      player,
      from: {
        left: fromRect.left,
        top: fromRect.top,
        width: fromRect.width,
        height: fromRect.height,
      },
      to: toRect,
      animating: false,
    });

    // Double RAF ensures initial paint before CSS transition kicks in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlyingBadge((prev) => (prev ? { ...prev, animating: true } : null));
      });
    });

    setTimeout(() => {
      onToggle(player.id);
      setFlyingBadge(null);
      setFadingPlayerId(null);
    }, 250);
  }

  // 2. Select player from dropdown (Flies DOWN to the frame)
  function handleSelectFromDropdown(candidate: Player, event: React.MouseEvent<HTMLElement>) {
    if (flyingBadge) return;
    const fromRect = event.currentTarget.getBoundingClientRect();
    const toRect = computeTargetInFrame(selectedPlayers.length);

    setIsDropdownOpen(false);
    setSearchQuery("");

    setFlyingBadge({
      player: candidate,
      from: {
        left: fromRect.left,
        top: fromRect.top,
        width: fromRect.width,
        height: fromRect.height,
      },
      to: toRect,
      animating: false,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlyingBadge((prev) => (prev ? { ...prev, animating: true } : null));
      });
    });

    setTimeout(() => {
      onToggle(candidate.id);
      setFlyingBadge(null);
    }, 250);
  }

  // 3. Remove player from the frame (Flies UP back to the 2x2 grid)
  function handleRemoveFromFrame(player: Player, event: React.MouseEvent<HTMLElement>) {
    if (flyingBadge) return;
    const fromRect = event.currentTarget.getBoundingClientRect();

    // Determine target slot in the 2x2 grid according to last-played sort order
    const nextUnselected = [...availablePlayers, player].sort((a, b) => {
      const idxA = players.findIndex((p) => p.id === a.id);
      const idxB = players.findIndex((p) => p.id === b.id);
      return idxA - idxB;
    });
    const targetSlot = nextUnselected.findIndex((p) => p.id === player.id);
    const toRect = computeTargetInGrid(Math.min(3, Math.max(0, targetSlot)));

    setFadingPlayerId(player.id);
    setFlyingBadge({
      player,
      from: {
        left: fromRect.left,
        top: fromRect.top,
        width: fromRect.width,
        height: fromRect.height,
      },
      to: toRect,
      animating: false,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlyingBadge((prev) => (prev ? { ...prev, animating: true } : null));
      });
    });

    setTimeout(() => {
      onToggle(player.id);
      setFlyingBadge(null);
      setFadingPlayerId(null);
    }, 250);
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
      {/* 1. TOP: "เพิ่มผู้เล่น" Dropdown */}
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
                      className="flex min-h-[42px] w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs sm:text-sm hover:bg-blue-50/70 dark:hover:bg-blue-950/40 active:bg-blue-100 transition-colors cursor-pointer"
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
                      <span className="text-xs font-bold text-[#007AFF] px-2 py-0.5 shrink-0">
                        +
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* 2. MIDDLE: "เลือกผู้เล่น" 2x2 Grid */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-[#8E8E93] dark:text-[#98989D] px-1">
          เลือกผู้เล่น
        </span>

        {topGridPlayers.length === 0 ? (
          <div className="flex min-h-[52px] items-center justify-center rounded-2xl border border-dashed border-black/[0.08] dark:border-[#38383A] bg-black/[0.015] dark:bg-white/[0.02] p-3 text-xs text-[#8E8E93] dark:text-[#98989D]">
            เลือกผู้เล่นครบทุกคนแล้ว
          </div>
        ) : (
          <ul
            ref={middleGridRef}
            className="grid grid-cols-2 gap-2 sm:gap-2.5"
          >
            {topGridPlayers.map((player) => {
              const isFading = fadingPlayerId === player.id;
              return (
                <li key={player.id}>
                  <button
                    type="button"
                    onClick={(e) => handleSelectFromGrid(player, e)}
                    className={`flex min-h-[48px] sm:min-h-[52px] w-full items-center gap-2.5 rounded-2xl border-2 border-black/[0.05] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-2 sm:p-2.5 text-left shadow-2xs hover:bg-blue-50/40 dark:hover:bg-[#2C2C2E] hover:border-[#007AFF]/30 transition-all duration-200 ease-out active:scale-[0.96] cursor-pointer ${
                      isFading ? "opacity-0" : "opacity-100"
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

      {/* 3. BOTTOM: "ผู้เล่นในรอบนี้" Frame */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-[#8E8E93] dark:text-[#98989D]">
            ผู้เล่นในรอบนี้
          </span>
          {/* ONLY place showing player count */}
          <span className="text-xs font-bold text-[#007AFF] dark:text-[#2E8BFF] tabular-nums">
            {selectedPlayers.length > 0 ? `${selectedPlayers.length} คน` : ""}
          </span>
        </div>

        <div
          ref={bottomFrameRef}
          className={`min-h-[80px] rounded-2xl p-2 sm:p-2.5 transition-all duration-200 ${
            selectedPlayers.length === 0
              ? "flex items-center justify-center border-2 border-dashed border-black/[0.08] dark:border-[#38383A] bg-black/[0.015] dark:bg-white/[0.02] text-center"
              : "border-2 border-solid border-[#007AFF]/35 dark:border-[#007AFF]/40 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs"
          }`}
        >
          {selectedPlayers.length === 0 ? (
            <span className="text-xs text-[#8E8E93] dark:text-[#98989D]">
              เลือกผู้เล่นเพื่อเริ่มเกม
            </span>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {selectedPlayers.map((player) => {
                const isFading = fadingPlayerId === player.id;
                return (
                  <li key={player.id}>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFromFrame(player, e)}
                      className={`group flex min-h-[46px] sm:min-h-[50px] w-full items-center gap-2.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-white dark:bg-[#1C1C1E] p-2 sm:p-2.5 text-left shadow-xs transition-all duration-150 active:scale-[0.96] hover:border-red-400 hover:bg-red-50/20 dark:hover:bg-red-950/20 cursor-pointer ${
                        isFading ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      <PlayerAvatar
                        player={player}
                        className="size-8 sm:size-9 text-xs shrink-0"
                      />
                      <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                        {player.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* 4. OVERLAY: Shared Element Flying Clone rendered in Document Body to avoid parent transform offsets */}
      {flyingBadge && mounted && createPortal(
        <div
          style={{
            position: "fixed",
            left: flyingBadge.animating
              ? flyingBadge.to.left
              : flyingBadge.from.left,
            top: flyingBadge.animating
              ? flyingBadge.to.top
              : flyingBadge.from.top,
            width: flyingBadge.animating
              ? flyingBadge.to.width
              : flyingBadge.from.width,
            height: flyingBadge.animating
              ? flyingBadge.to.height
              : flyingBadge.from.height,
            transition: flyingBadge.animating
              ? "all 250ms cubic-bezier(0.25, 1, 0.5, 1)"
              : "none",
            zIndex: 99999,
            pointerEvents: "none",
          }}
          className="flex items-center gap-2.5 rounded-2xl border-2 border-[#007AFF] bg-white dark:bg-[#1C1C1E] p-2 sm:p-2.5 shadow-xl shadow-blue-500/25 ring-1 ring-[#007AFF]/30"
        >
          <PlayerAvatar
            player={flyingBadge.player}
            className="size-8 sm:size-9 text-xs shrink-0"
          />
          <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
            {flyingBadge.player.name}
          </span>
        </div>,
        document.body,
      )}
    </div>
  );
}
