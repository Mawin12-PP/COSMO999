"use client";

// Primary navigation with iOS 18 Dynamic Island interactive gesture dragging.
// One component, two shapes:
// 1. Mobile bottom tab bar (horizontal gesture sliding)
// 2. iPad / Desktop sticky sidebar (vertical gesture sliding)
// Features:
// - Gesture sliding: Touch or mouse drag across items smoothly follows pointer in real time
// - Dynamic squish & spring release physics
// - Instant click / tap navigation
// - Apple typography & frosted glass aesthetic
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartLine,
  CirclePlay,
  History,
  Trophy,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "เล่น", icon: CirclePlay },
  { href: "/leaderboard", label: "อันดับ", icon: Trophy },
  { href: "/history", label: "ประวัติ", icon: History },
  { href: "/groups", label: "ขาประจำ", icon: UsersRound },
  { href: "/stats", label: "สถิติ", icon: ChartLine },
];

const ITEM_HEIGHT = 44;
const ITEM_GAP = 8;
const VERTICAL_STEP = ITEM_HEIGHT + ITEM_GAP; // 52px
const MAX_VERTICAL_Y = (NAV_ITEMS.length - 1) * VERTICAL_STEP; // 208px

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  // Drag states
  const [isDraggingV, setIsDraggingV] = useState(false);
  const [dragY, setDragY] = useState<number | null>(null);

  const [isDraggingH, setIsDraggingH] = useState(false);
  const [dragPercentX, setDragPercentX] = useState<number | null>(null);

  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const initialYRef = useRef(0);
  const isVerticalModeRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    setPendingIndex(null);
  }, [pathname]);

  const routeIndex = NAV_ITEMS.findIndex(({ href }) => isActive(pathname, href));
  const activeIndex = pendingIndex ?? (routeIndex >= 0 ? routeIndex : 0);

  function handlePointerDown(e: React.PointerEvent<HTMLUListElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    pointerIdRef.current = e.pointerId;

    const isDesktop = window.innerWidth >= 768; // md breakpoint
    isVerticalModeRef.current = isDesktop;

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;

    if (isDesktop) {
      initialYRef.current = activeIndex * VERTICAL_STEP;
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLUListElement>) {
    if (!isPointerDownRef.current) return;

    const deltaX = Math.abs(e.clientX - startXRef.current);
    const deltaY = Math.abs(e.clientY - startYRef.current);
    const isDesktop = isVerticalModeRef.current;
    const dragDelta = isDesktop ? deltaY : deltaX;

    // Only engage drag and capture pointer when actual drag movement occurs (> 7px)
    if (!hasDraggedRef.current && dragDelta > 7) {
      hasDraggedRef.current = true;
      if (pointerIdRef.current !== null) {
        try {
          e.currentTarget.setPointerCapture(pointerIdRef.current);
        } catch {
          // ignore
        }
      }
      if (isDesktop) {
        setIsDraggingV(true);
      } else {
        setIsDraggingH(true);
      }
    }

    if (!hasDraggedRef.current) return;

    if (isDesktop) {
      const rawDeltaY = e.clientY - startYRef.current;
      const rawY = initialYRef.current + rawDeltaY;
      const clampedY = Math.max(0, Math.min(MAX_VERTICAL_Y, rawY));
      setDragY(clampedY);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const slotW = rect.width / NAV_ITEMS.length;
      const maxTravel = rect.width - slotW;
      if (maxTravel > 0) {
        const offset = e.clientX - rect.left - slotW / 2;
        const ratio = Math.max(0, Math.min(1, offset / maxTravel));
        setDragPercentX(ratio * (NAV_ITEMS.length - 1) * 100);
      }
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLUListElement>) {
    if (!isPointerDownRef.current) return;
    const didDrag = hasDraggedRef.current;
    isPointerDownRef.current = false;
    hasDraggedRef.current = false;
    setIsDraggingV(false);
    setIsDraggingH(false);

    if (pointerIdRef.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(pointerIdRef.current);
      } catch {
        // ignore
      }
      pointerIdRef.current = null;
    }

    if (didDrag) {
      if (isVerticalModeRef.current) {
        if (dragY !== null) {
          const targetIndex = Math.min(
            NAV_ITEMS.length - 1,
            Math.max(0, Math.round(dragY / VERTICAL_STEP)),
          );
          if (targetIndex !== activeIndex) {
            setPendingIndex(targetIndex);
            router.push(NAV_ITEMS[targetIndex].href);
          }
        }
      } else {
        if (dragPercentX !== null) {
          const targetIndex = Math.min(
            NAV_ITEMS.length - 1,
            Math.max(0, Math.round(dragPercentX / 100)),
          );
          if (targetIndex !== activeIndex) {
            setPendingIndex(targetIndex);
            router.push(NAV_ITEMS[targetIndex].href);
          }
        }
      }
    }

    setDragY(null);
    setDragPercentX(null);
  }

  const currentY = dragY !== null ? dragY : activeIndex * VERTICAL_STEP;
  const currentXPercent =
    dragPercentX !== null ? dragPercentX : activeIndex * 100;

  return (
    <nav
      aria-label="เมนูหลัก"
      style={{
        scale: isDraggingH ? 1.055 : undefined,
        transformOrigin: "center center",
        transition: isDraggingH
          ? "scale 140ms cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 200ms ease"
          : "scale 420ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 300ms ease",
      }}
      className={`fixed z-40 left-1/2 -translate-x-1/2 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] w-[calc(100%-1.75rem)] max-w-sm sm:max-w-md rounded-full border bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl p-1.5 will-change-transform ${
        isDraggingH
          ? "border-blue-500/30 shadow-[0_12px_44px_rgba(0,122,255,0.22)] dark:shadow-[0_12px_44px_rgba(0,0,0,0.8)]"
          : "border-black/[0.08] dark:border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      } md:sticky md:inset-x-auto md:left-auto md:right-auto md:bottom-auto md:top-0 md:translate-x-0 md:h-dvh md:w-60 md:max-w-none md:shrink-0 md:rounded-none md:border-0 md:border-r md:border-gray-200 dark:md:border-[#38383A] md:bg-[#F2F2F7]/70 dark:md:bg-[#000000]/70 md:shadow-none md:p-0`}
    >
      <div className="flex w-full md:h-full md:flex-col md:justify-between">
        {/* Navigation links with gesture dragging */}
        <ul
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: "none" }}
          className="relative flex flex-1 select-none touch-none md:touch-auto items-center justify-around md:flex-none md:flex-col md:justify-start md:gap-2 md:px-3.5 md:pt-6 md:pb-2"
        >
          {/* Mobile Horizontal Sliding Magic Indicator */}
          <div
            className="pointer-events-none absolute inset-0 z-0 md:hidden"
            aria-hidden="true"
          >
            <div
              className="h-full will-change-transform px-0.5 py-0.5"
              style={{
                width: `${100 / NAV_ITEMS.length}%`,
                transform: `translateX(${currentXPercent}%) ${
                  isDraggingH ? "scaleX(1.14) scaleY(1.08)" : "scale(1)"
                }`,
                transition: isDraggingH
                  ? "transform 0ms linear"
                  : "transform 300ms cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            >
              <div className="h-full w-full rounded-full bg-blue-50 dark:bg-blue-500/15 shadow-xs border border-blue-500/20" />
            </div>
          </div>

          {/* Desktop Vertical Sliding Magic Indicator */}
          <div
            className="pointer-events-none absolute hidden md:block inset-x-3.5 top-6 z-0 h-11"
            aria-hidden="true"
          >
            <div
              className="h-full w-full rounded-xl bg-white dark:bg-[#1C1C1E] shadow-sm border border-black/[0.04] dark:border-[#38383A] will-change-transform"
              style={{
                transform: `translateY(${currentY}px) ${
                  isDraggingV ? "scaleY(1.08) scaleX(0.96)" : "scale(1)"
                }`,
                transition: isDraggingV
                  ? "transform 0ms linear"
                  : "transform 300ms cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            />
          </div>

          {NAV_ITEMS.map(({ href, label, icon: Icon }, index) => {
            const active = activeIndex === index;
            return (
              <li key={href} className="relative z-10 flex-1 md:w-full md:flex-none">
                <Link
                  href={href}
                  onClick={(e) => {
                    if (hasDraggedRef.current) {
                      e.preventDefault();
                    } else {
                      setPendingIndex(index);
                    }
                  }}
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                  title={label}
                  className={`group flex min-h-[44px] h-11 items-center justify-center rounded-full transition-colors duration-200 ease-out ios-spring-button md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-4 md:py-3 md:text-sm ${
                    active
                      ? "text-[#007AFF] font-bold"
                      : "text-[#8E8E93] dark:text-[#98989D] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
                  }`}
                >
                  <Icon
                    className={`size-5.5 md:size-5 shrink-0 transition-all duration-200 ${
                      active
                        ? "text-[#007AFF] scale-105"
                        : "text-[#8E8E93] dark:text-[#98989D] group-hover:text-[#1C1C1E] dark:group-hover:text-[#F2F2F7]"
                    }`}
                  />
                  <span className="sr-only md:not-sr-only md:inline leading-none transition-colors duration-200">
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Bottom section: ThemeToggle footer aligned with navigation left padding */}
        <div className="hidden md:flex md:flex-col border-t border-gray-200 dark:border-[#38383A] pt-4 pb-6 mt-auto px-3.5">
          <div className="flex items-center gap-3 px-4">
            <ThemeToggle />
            <span className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D]">
              โหมดหน้าจอ
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
