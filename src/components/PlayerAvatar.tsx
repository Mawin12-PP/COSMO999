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
        className={`${className} block shrink-0 rounded-full border border-black/[0.06] bg-cover bg-center shadow-2xs`}
        style={{ backgroundImage: `url(${player.image})` }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${className} flex shrink-0 items-center justify-center rounded-full border border-blue-500/15 bg-blue-50/80 font-semibold text-[#007AFF] shadow-2xs`}
    >
      {player.name.trim().charAt(0) || "?"}
    </span>
  );
}
