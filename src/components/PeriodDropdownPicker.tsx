"use client";

// Reusable Period Dropdown Picker for iOS 18.
// Matches the design system of PlayerDropdownPicker (used in playerstat & edit player):
// - 1-column list with custom icons and labels
// - Max-height with smooth vertical scrollbar (overflow-y: auto)
// - Smooth Open animation (Slide down / Expand + Fade in)
// - Row hover highlight & active micro-scale click response
// - Smooth Close animation (Slide up / Collapse + Fade out) on selection or click-outside
import { useCallback, useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

export interface PeriodOption {
  key: string;
  label: string;
}

export function PeriodDropdownPicker({
  periods,
  selectedKey,
  onSelect,
  placeholder = "ดูงวดย้อนหลัง...",
  className = "",
}: {
  periods: PeriodOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedPeriod = periods.find((p) => p.key === selectedKey) || null;

  const triggerClose = useCallback(() => {
    if (!isOpen || isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 180);
  }, [isOpen, isClosing]);

  function handleToggle() {
    if (isOpen) {
      triggerClose();
    } else {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setIsClosing(false);
      setIsOpen(true);
    }
  }

  // Click outside to collapse with smooth slide-up + fade-out animation
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        triggerClose();
      }
    }
    if (isOpen && !isClosing) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isClosing, triggerClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  function handlePick(key: string) {
    onSelect(key);
    triggerClose();
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col ${isOpen || isClosing ? "z-30" : ""} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label="เลือกดูงวดย้อนหลัง"
        className={`flex min-h-[44px] sm:min-h-[46px] w-full items-center justify-between gap-3 rounded-xl border border-black/[0.06] dark:border-[#38383A] px-3.5 py-2.5 text-sm font-medium shadow-2xs hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] active:scale-[0.99] cursor-pointer transition-all ${
          selectedPeriod
            ? "bg-blue-50/70 dark:bg-blue-950/40 text-[#007AFF] dark:text-[#2E8BFF] font-semibold border-blue-500/25"
            : "bg-[#F2F2F7]/60 dark:bg-[#2C2C2E]/60 text-[#1C1C1E] dark:text-[#F2F2F7]"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Calendar
            className={`size-4 shrink-0 transition-colors ${
              selectedPeriod
                ? "text-[#007AFF] dark:text-[#2E8BFF]"
                : "text-[#8E8E93] dark:text-[#98989D]"
            }`}
          />
          <span
            className={`truncate text-xs sm:text-sm ${
              selectedPeriod
                ? "font-semibold text-[#007AFF] dark:text-[#2E8BFF]"
                : "text-[#8E8E93] dark:text-[#98989D]"
            }`}
          >
            {selectedPeriod ? selectedPeriod.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform duration-200 ${
            selectedPeriod
              ? "text-[#007AFF] dark:text-[#2E8BFF]"
              : "text-[#8E8E93] dark:text-[#98989D]"
          } ${isOpen && !isClosing ? "rotate-180" : ""}`}
        />
      </button>

      {/* Floating Dropdown Menu: 1 Column List with Slide Down/Up + Fade In/Out */}
      {(isOpen || isClosing) && (
        <div
          className={`absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-1.5 z-50 w-full sm:min-w-[240px] overflow-hidden rounded-2xl border border-black/[0.08] dark:border-[#38383A] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl shadow-xl transition-all duration-180 ease-out ${
            isClosing
              ? "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none"
              : "opacity-100 translate-y-0 scale-100 animate-in fade-in-0 slide-in-from-top-2 duration-200"
          }`}
          style={{ transformOrigin: "top right" }}
        >
          <ul className="flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.04] max-h-[260px] sm:max-h-[280px] overflow-y-auto p-1.5 overscroll-contain">
            {periods.map((period) => {
              const isSelected = period.key === selectedKey;
              return (
                <li key={period.key}>
                  <button
                    type="button"
                    onClick={() => handlePick(period.key)}
                    aria-pressed={isSelected}
                    className={`group flex min-h-[46px] sm:min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-all duration-150 ease-out cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? "bg-blue-50/90 dark:bg-blue-950/50 text-[#007AFF] dark:text-[#2E8BFF] font-semibold"
                        : "text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-gray-100/80 dark:hover:bg-[#2C2C2E]/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`grid size-7 sm:size-7.5 place-items-center rounded-lg text-xs shrink-0 transition-colors ${
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] dark:text-[#98989D] group-hover:text-[#1C1C1E] dark:group-hover:text-[#F2F2F7]"
                        }`}
                      >
                        <Calendar className="size-3.5 sm:size-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs sm:text-sm">
                        {period.label}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-[#007AFF] dark:text-[#2E8BFF] shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
