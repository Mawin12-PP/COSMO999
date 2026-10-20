"use client";

// iOS 18 Dynamic Island interactive draggable toggle for Dark Mode / Light Mode.
// Features:
// - Gesture sliding: Touch/mouse drag follows finger smoothly in real time
// - Dynamic squish & spring release physics
// - Tap-to-toggle fallback
// - Hydration protection with Next.js next-themes
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const MAX_DRAG_X = 32;

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);

  const startXRef = useRef<number>(0);
  const initialXRef = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);
  const pointerIdRef = useRef<number | null>(null);

  const hasDraggedRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Preserve layout space before client hydration
    return (
      <div
        className="relative inline-flex h-8 w-16 items-center rounded-full bg-[#E5E5EA] p-1"
        aria-hidden="true"
      >
        <span className="size-6 rounded-full bg-white shadow-sm" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";
  const currentX = dragX !== null ? dragX : isDark ? MAX_DRAG_X : 0;

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    initialXRef.current = isDark ? MAX_DRAG_X : 0;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!isPointerDownRef.current) return;
    const delta = e.clientX - startXRef.current;

    if (!hasDraggedRef.current && Math.abs(delta) > 5) {
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

    const rawX = initialXRef.current + delta;
    const clampedX = Math.max(0, Math.min(MAX_DRAG_X, rawX));
    setDragX(clampedX);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
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

    if (didDrag) {
      const finalX = dragX ?? (isDark ? MAX_DRAG_X : 0);
      if (finalX >= MAX_DRAG_X / 2) {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    } else {
      // Tap or simple click
      setTheme(isDark ? "light" : "dark");
    }

    setDragX(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setTheme(isDark ? "light" : "dark");
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex h-8 w-16 select-none touch-none items-center justify-between rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] active:scale-[0.98] cursor-pointer ${
        isDark ? "bg-[#38383A]" : "bg-[#E5E5EA]"
      }`}
    >
      {/* Static Sun icon on the left */}
      <span className="flex size-6 items-center justify-center text-[#8E8E93] pointer-events-none">
        <Sun className="size-3.5" />
      </span>

      {/* Static Moon icon on the right */}
      <span className="flex size-6 items-center justify-center text-[#8E8E93] pointer-events-none">
        <Moon className="size-3.5" />
      </span>

      {/* Dynamic Island sliding circular thumb */}
      <span
        style={{
          transform: `translateX(${currentX}px) ${
            isDragging ? "scaleX(1.15) scaleY(0.94)" : "scale(1)"
          }`,
          transition: isDragging
            ? "transform 0ms linear"
            : "transform 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 300ms, color 300ms",
        }}
        className={`absolute top-1 left-1 flex size-6 items-center justify-center rounded-full shadow-sm will-change-transform pointer-events-none ${
          isDark ? "bg-[#1C1C1E] text-blue-400" : "bg-white text-amber-500"
        }`}
      >
        {isDark ? (
          <Moon className="size-3.5 fill-current" />
        ) : (
          <Sun className="size-3.5 fill-current" />
        )}
      </span>
    </button>
  );
}
