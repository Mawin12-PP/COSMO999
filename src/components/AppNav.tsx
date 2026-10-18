"use client";

// Primary navigation. One component, two shapes: a fixed bottom tab bar on
// phones and a sticky left sidebar from the md breakpoint up (iPad and desktop).
// Ultra-Premium iOS 18: frosted glass (bg-white/80 backdrop-blur-2xl),
// active item stands out with soft white depth (bg-white shadow-sm rounded-xl),
// min 44x44px touch targets, safe-area-inset-bottom, and active:scale-95 feedback.
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumnBig,
  History,
  Spade,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "เล่น", icon: Spade },
  { href: "/leaderboard", label: "อันดับ", icon: Trophy },
  { href: "/history", label: "ประวัติ", icon: History },
  { href: "/groups", label: "ขาประจำ", icon: Users },
  { href: "/stats", label: "สถิติ", icon: ChartColumnBig },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.04] bg-white/80 backdrop-blur-2xl shadow-[0_-4px_20px_rgb(0,0,0,0.03)] md:sticky md:inset-x-auto md:bottom-auto md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-t-0 md:border-r md:border-black/[0.04] md:bg-[#F2F2F7]/70 md:shadow-none"
    >
      <ul className="flex items-center justify-around px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:h-full md:flex-col md:justify-start md:gap-2 md:px-3.5 md:py-6">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1 md:w-full md:flex-none">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold transition-all duration-200 ease-out active:scale-[0.97] md:min-h-[44px] md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-sm ${
                  active
                    ? "bg-white shadow-sm text-[#007AFF] border border-black/[0.03]"
                    : "text-[#8E8E93] hover:text-[#1C1C1E] active:bg-black/[0.03]"
                }`}
              >
                <Icon
                  className={`size-5 shrink-0 transition-transform ${
                    active ? "text-[#007AFF]" : "text-[#8E8E93] group-hover:text-[#1C1C1E]"
                  }`}
                />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
