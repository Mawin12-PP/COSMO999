// Shared pill button so the project's blue / outline / red actions look and
// behave the same everywhere. Touch target is 44px (48px from sm up).
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const BASE =
  "flex min-h-[44px] sm:min-h-[48px] items-center justify-center gap-2 rounded-full px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold transition-all duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-lg shadow-blue-500/25 hover:opacity-90",
  secondary:
    "border border-black/[0.06] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs hover:bg-gray-50 dark:hover:bg-[#38383A]",
  danger:
    "bg-[#FF3B30] text-white shadow-lg shadow-red-500/25 hover:bg-[#D70015]",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
