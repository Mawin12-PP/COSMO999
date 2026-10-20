"use client";

// iOS 18 Dynamic Island interactive draggable segmented control.
// Features:
// - Gesture sliding: Touch/mouse drag follows finger smoothly across segments in real time
// - Dynamic squish & spring release physics
// - Instant tap-to-switch with Apple easing cubic-bezier(0.25, 1, 0.5, 1)
// - Full accessible keyboard & touch-action support
import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

export interface SegmentItem<T extends string> {
  key: T;
  label: string;
  icon?: LucideIcon;
}

export function InteractiveSegmentedControl<T extends string>({
  items,
  activeKey,
  onChange,
  className = "",
  buttonClassName = "",
}: {
  items: SegmentItem<T>[];
  activeKey: T | null;
  onChange: (key: T) => void;
  className?: string;
  buttonClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState<number | null>(null);

  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const hasDraggedRef = useRef(false);

  const activeIndex = items.findIndex((item) => item.key === activeKey);
  const hasActive = activeIndex !== -1 && activeKey !== null;

  // Base translateX percentage for the 50% pill
  const targetPercent = hasActive
    ? (activeIndex / Math.max(1, items.length - 1)) * 100
    : 0;

  const currentPercent = dragPercent !== null ? dragPercent : targetPercent;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Only handle primary mouse button or touch
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (!containerRef.current) return;

    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isPointerDownRef.current || !containerRef.current) return;
    const deltaX = Math.abs(e.clientX - startXRef.current);

    // Only engage drag and capture pointer when actual movement occurs (> 7px)
    if (!hasDraggedRef.current && deltaX > 7) {
      hasDraggedRef.current = true;
      if (pointerIdRef.current !== null) {
        try {
          e.currentTarget.setPointerCapture(pointerIdRef.current);
        } catch {
          // ignore
        }
      }
      setIsDragging(true);
    }

    if (!hasDraggedRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pillWidth = rect.width / items.length;
    const maxTravel = rect.width - pillWidth;
    if (maxTravel > 0) {
      const offsetX = e.clientX - rect.left - pillWidth / 2;
      const ratio = Math.max(0, Math.min(1, offsetX / maxTravel));
      setDragPercent(ratio * 100);
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isPointerDownRef.current) return;
    const didDrag = hasDraggedRef.current;
    isPointerDownRef.current = false;
    hasDraggedRef.current = false;
    setIsDragging(false);

    if (pointerIdRef.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(pointerIdRef.current);
      } catch {
        // Ignore if pointer capture already lost
      }
      pointerIdRef.current = null;
    }

    // If dragged noticeably (> 7px), snap to the nearest segment
    if (didDrag && dragPercent !== null) {
      const segmentRatio = dragPercent / 100;
      const targetIndex = Math.min(
        items.length - 1,
        Math.max(0, Math.round(segmentRatio * (items.length - 1))),
      );
      const chosenItem = items[targetIndex];
      if (chosenItem && chosenItem.key !== activeKey) {
        onChange(chosenItem.key);
      }
    }

    setDragPercent(null);
  }

  return (
    <div
      ref={containerRef}
      role="tablist"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative inline-flex select-none touch-none rounded-full bg-black/[0.06] dark:bg-[#2C2C2E] p-1 shadow-2xs cursor-pointer ${className}`}
    >
      {/* Sliding Magic Indicator Pill with Dynamic Island squish */}
      <div
        className={`pointer-events-none absolute inset-y-1 left-1 right-1 z-0 transition-opacity duration-200 ${
          hasActive || isDragging ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        <div
          className="h-full will-change-transform"
          style={{
            width: `${100 / items.length}%`,
            transform: `translateX(${currentPercent}%) ${
              isDragging ? "scaleX(1.06) scaleY(0.96)" : "scale(1)"
            }`,
            transition: isDragging
              ? "transform 0ms linear"
              : "transform 300ms cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          <div className="h-full w-full rounded-full bg-white dark:bg-[#1C1C1E] shadow-sm" />
        </div>
      </div>

      {/* Buttons */}
      {items.map(({ key, label, icon: Icon }) => {
        const isSelected = activeKey === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(key)}
            className={`relative z-10 flex min-h-[40px] sm:min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors duration-200 ease-out active:scale-[0.97] cursor-pointer ${
              isSelected
                ? "text-[#1C1C1E] dark:text-[#F2F2F7]"
                : "text-[#8E8E93] dark:text-[#98989D] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
            } ${buttonClassName}`}
          >
            {Icon && <Icon className="size-4 sm:size-4.5 shrink-0" aria-hidden />}
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
