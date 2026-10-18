"use client";

// iOS-style animated pill toggle for Dark Mode / Light Mode.
// Uses next-themes (useTheme) with hydration protection,
// fluid slide animation, and Apple iOS 18 design aesthetics.
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

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

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative inline-flex h-8 w-16 items-center justify-between rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] active:scale-[0.97] cursor-pointer ${
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

      {/* Fluid sliding circular thumb */}
      <span
        className={`absolute top-1 left-1 flex size-6 items-center justify-center rounded-full shadow-sm transform transition-transform duration-300 ease-in-out pointer-events-none ${
          isDark
            ? "translate-x-8 bg-[#1C1C1E] text-blue-400"
            : "translate-x-0 bg-white text-amber-500"
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
