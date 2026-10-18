// Deliberate empty state for routes whose real feature lands in a later
// phase. No fabricated data - just the icon, the name, and when it arrives.
import type { LucideIcon } from "lucide-react";

export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="reveal flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-blue-50 text-[#007AFF] shadow-xs">
        <Icon className="size-8" />
      </span>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1E] sm:text-3xl">{title}</h1>
        <p className="mx-auto max-w-xs text-sm text-[#8E8E93]">{description}</p>
      </div>

      <p className="rounded-full border border-black/[0.04] bg-white/80 backdrop-blur-md px-3.5 py-1 text-xs font-medium text-[#8E8E93] shadow-xs">
        กำลังจะมาในเฟส {phase}
      </p>
    </div>
  );
}
