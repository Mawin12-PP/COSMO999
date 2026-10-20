"use client";

// Player profile image: the uploaded photo if there is one, otherwise the
// personalized Emoji avatar on the clean iOS original theme.
// Follows COSMO999 Apple iOS design tokens:
// Container: rounded-full flex items-center justify-center border border-gray-100 dark:border-white/10
// Background: bg-[#F2F2F7] dark:bg-[#1C1C1E]
import {
  parseEmojiAvatar,
  getDeterministicEmoji,
} from "@/lib/suits";
import type { Player } from "@/types/models";

export function PlayerAvatar({
  player,
  className = "w-10 h-10",
}: {
  player: Player;
  className?: string;
}) {
  const emoji = parseEmojiAvatar(player.image);

  // If a photo is stored (data URL or external URL, not an emoji or legacy suit)
  const isPhoto = Boolean(
    player.image &&
      !player.image.startsWith("suit:") &&
      !player.image.startsWith("emoji:") &&
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
        className={`${className} block shrink-0 rounded-full border border-gray-100 dark:border-white/10 bg-cover bg-center shadow-2xs`}
        style={{ backgroundImage: `url(${player.image})` }}
      />
    );
  }

  // All non-photo profiles strictly render system Emoji on the original theme (#F2F2F7 / #1C1C1E)
  const effectiveEmoji = emoji || getDeterministicEmoji(player.id || player.name || "player");

  return (
    <span
      data-avatar-root="true"
      role="img"
      aria-label={`${player.name} (${effectiveEmoji})`}
      className={`${className} flex shrink-0 items-center justify-center rounded-full border border-gray-100 dark:border-white/10 bg-[#F2F2F7] dark:bg-[#1C1C1E] shadow-2xs select-none`}
    >
      <span className="leading-none text-[1.25em] transform-gpu">{effectiveEmoji}</span>
    </span>
  );
}
