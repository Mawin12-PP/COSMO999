"use client";

// Player profile avatar using Boring Avatars (Beam variant) on iOS 18 design tokens,
// or custom uploaded photo if provided.
// Automatically and deterministically generated from the player's name/seed.
import Avatar from "boring-avatars";
import type { Player } from "@/types/models";

const BORING_PALETTES = [
  ["#007AFF", "#5856D6", "#AF52DE", "#34C759", "#64D2FF"], // Apple Blue-Purple
  ["#FF2D55", "#FF9500", "#FFCC00", "#AF52DE", "#FF3B30"], // Sunset Berry
  ["#30D158", "#007AFF", "#64D2FF", "#32ADE6", "#5856D6"], // Neon Aurora
  ["#BF5AF2", "#FF375F", "#FF9F0A", "#5E5CE6", "#007AFF"], // Cyberpunk Dusk
  ["#FF6482", "#F2A33A", "#F8DC72", "#68D8D6", "#3B82F6"], // Pastel Candy
  ["#10B981", "#3B82F6", "#6366F1", "#EC4899", "#8B5CF6"], // Emerald Sky
  ["#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6", "#10B981"], // Warm Lava
  ["#06B6D4", "#3B82F6", "#8B5CF6", "#D946EF", "#F43F5E"], // Deep Ocean
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function PlayerAvatar({
  player,
  className = "w-10 h-10",
}: {
  player: Player;
  className?: string;
}) {
  const isPhoto = Boolean(
    player.image &&
      !player.image.startsWith("suit:") &&
      !player.image.startsWith("emoji:") &&
      !player.image.startsWith("boring:") &&
      (player.image.startsWith("data:") ||
        player.image.startsWith("http://") ||
        player.image.startsWith("https://")),
  );

  if (isPhoto) {
    return (
      <span
        data-avatar-root="true"
        role="img"
        aria-label={player.name}
        className={`${className} block shrink-0 rounded-full border border-gray-100 dark:border-white/10 bg-cover bg-center shadow-2xs overflow-hidden`}
        style={{ backgroundImage: `url(${player.image})` }}
      />
    );
  }

  const seed = player.name?.trim() || player.id || "player";
  const palette = BORING_PALETTES[hashString(seed) % BORING_PALETTES.length];

  return (
    <span
      data-avatar-root="true"
      role="img"
      aria-label={player.name}
      className={`${className} flex shrink-0 items-center justify-center rounded-full border border-gray-100 dark:border-white/10 shadow-2xs overflow-hidden select-none bg-[#F2F2F7] dark:bg-[#1C1C1E]`}
    >
      <Avatar
        size="100%"
        name={seed}
        variant="beam"
        colors={palette}
      />
    </span>
  );
}
