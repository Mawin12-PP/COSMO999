"use client";

// Primary navigation. One component, two shapes: a fixed bottom tab bar on
// phones and a sticky left sidebar from the md breakpoint up (iPad and desktop).
// Ultra-Premium iOS 18: frosted glass (bg-white/80 backdrop-blur-2xl),
// active item stands out with soft white depth (bg-white shadow-sm rounded-xl),
// min 44x44px touch targets, safe-area-inset-bottom, and active:scale-95 feedback.
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  useEffect(() => {
    setPendingIndex(null);
  }, [pathname]);

  const routeIndex = NAV_ITEMS.findIndex(({ href }) => isActive(pathname, href));
  const activeIndex = pendingIndex ?? (routeIndex >= 0 ? routeIndex : 0);

  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed z-40 left-1/2 -translate-x-1/2 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] w-[calc(100%-1.75rem)] max-w-sm sm:max-w-md rounded-full border border-black/[0.08] dark:border-white/15 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1.5 md:sticky md:inset-x-auto md:left-auto md:right-auto md:bottom-auto md:top-0 md:translate-x-0 md:h-dvh md:w-60 md:max-w-none md:shrink-0 md:rounded-none md:border-0 md:border-r md:border-gray-200 dark:md:border-[#38383A] md:bg-[#F2F2F7]/70 dark:md:bg-[#000000]/70 md:shadow-none md:p-0"
    >
      <div className="flex w-full md:h-full md:flex-col md:justify-between">
        {/* Navigation links */}
        <ul className="relative flex flex-1 items-center justify-around md:flex-none md:flex-col md:justify-start md:gap-2 md:px-3.5 md:pt-6 md:pb-2">
          {/* Mobile Horizontal Sliding Magic Indicator */}
          <div
            className="pointer-events-none absolute inset-0 z-0 md:hidden"
            aria-hidden="true"
          >
            <div
              className="h-full transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform px-0.5 py-0.5"
              style={{
                width: `${100 / NAV_ITEMS.length}%`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            >
              <div className="h-full w-full rounded-full bg-black/[0.06] dark:bg-white/10 shadow-xs border border-black/[0.04] dark:border-white/10" />
            </div>
          </div>

          {/* Desktop Vertical Sliding Magic Indicator */}
          <div
            className="pointer-events-none absolute hidden md:block inset-x-3.5 top-6 z-0 h-11"
            aria-hidden="true"
          >
            <div
              className="h-full w-full rounded-xl bg-white dark:bg-[#1C1C1E] shadow-sm border border-black/[0.04] dark:border-[#38383A] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
              style={{
                transform: `translateY(${activeIndex * 52}px)`,
              }}
            />
          </div>

          {NAV_ITEMS.map(({ href, label, icon: Icon }, index) => {
            const active = activeIndex === index;
            return (
              <li key={href} className="relative z-10 flex-1 md:w-full md:flex-none">
                <Link
                  href={href}
                  onClick={() => setPendingIndex(index)}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-[46px] flex-col items-center justify-center gap-1 rounded-full px-1 py-1 text-[10px] font-semibold transition-colors duration-200 ease-out active:scale-95 md:min-h-[44px] md:h-11 md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-4 md:py-3 md:text-sm ${
                    active
                      ? "text-[#007AFF] font-bold"
                      : "text-[#8E8E93] dark:text-[#98989D] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
                  }`}
                >
                  <Icon
                    className={`size-5 shrink-0 transition-all duration-200 ${
                      active
                        ? "text-[#007AFF] scale-105"
                        : "text-[#8E8E93] dark:text-[#98989D] group-hover:text-[#1C1C1E] dark:group-hover:text-[#F2F2F7]"
                    }`}
                  />
                  <span className="leading-none transition-colors duration-200">{label}</span>
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
