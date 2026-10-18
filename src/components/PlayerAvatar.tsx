"use client";

// Player profile image: the uploaded photo if there is one, otherwise the
// first letter of the name. Shared by the roster row and the
// round-setup grid; the caller passes the sizing utilities (size-* text-*).
import type { Player } from "@/types/models";

export function PlayerAvatar({
  player,
  className = "size-11 text-lg",
}: {
  player: Player;
  className?: string;
}) {
  if (player.image) {
    return (
      <span
        role="img"
        aria-label={player.name}
        className={`${className} block shrink-0 rounded-full border border-black/[0.06] dark:border-white/10 bg-cover bg-center shadow-2xs`}
        style={{ backgroundImage: `url(${player.image})` }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${className} flex shrink-0 items-center justify-center rounded-full border border-blue-500/15 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-500/15 font-semibold text-[#007AFF] dark:text-[#2E8BFF] shadow-2xs`}
    >
      {player.name.trim().charAt(0) || "?"}
    </span>
  );
}
