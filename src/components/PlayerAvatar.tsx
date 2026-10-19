"use client";

// Player profile image: the uploaded photo if there is one, otherwise the
// thematic card & game avatar in vibrant iOS Blue (#007AFF).
// Follows COSMO999 Apple iOS design tokens:
// Container: rounded-full flex items-center justify-center border border-gray-100 dark:border-white/10
// Background: bg-[#F2F2F7] dark:bg-[#1C1C1E]
// Icon: text-[#007AFF]
import {
  Club,
  Coins,
  Crown,
  Dices,
  Diamond,
  Flame,
  Heart,
  Layers,
  Shield,
  Spade,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  getDeterministicThematicAvatar,
  parseThematicAvatar,
  THEMATIC_AVATAR_LABELS,
  type ThematicAvatarId,
} from "@/lib/suits";
import type { Player } from "@/types/models";

function ThematicIcon({ id, className = "size-5" }: { id: ThematicAvatarId; className?: string }) {
  switch (id) {
    case "spade":
      return <Spade className={`${className} fill-current`} aria-hidden="true" />;
    case "heart":
      return <Heart className={`${className} fill-current`} aria-hidden="true" />;
    case "club":
      return <Club className={`${className} fill-current`} aria-hidden="true" />;
    case "diamond":
      return <Diamond className={`${className} fill-current`} aria-hidden="true" />;
    case "joker":
      return <Sparkles className={`${className}`} aria-hidden="true" />;
    case "king":
      return <Crown className={`${className}`} aria-hidden="true" />;
    case "deck":
      return <Layers className={`${className}`} aria-hidden="true" />;
    case "dice":
      return <Dices className={`${className}`} aria-hidden="true" />;
    case "chip":
      return <Coins className={`${className}`} aria-hidden="true" />;
    case "fire":
      return <Flame className={`${className} fill-current`} aria-hidden="true" />;
    case "shield":
      return <Shield className={`${className} fill-current`} aria-hidden="true" />;
    case "trophy":
      return <Trophy className={`${className} fill-current`} aria-hidden="true" />;
    default:
      return <Spade className={`${className} fill-current`} aria-hidden="true" />;
  }
}

export function PlayerAvatar({
  player,
  className = "w-10 h-10",
}: {
  player: Player;
  className?: string;
}) {
  const avatarId = parseThematicAvatar(player.image);

  // If a photo is stored (data URL or external URL, not a thematic token)
  const isPhoto = Boolean(
    player.image &&
      !player.image.startsWith("suit:") &&
      !avatarId,
  );

  if (isPhoto) {
    return (
      <span
        role="img"
        aria-label={player.name}
        className={`${className} block shrink-0 rounded-full border border-gray-100 dark:border-white/10 bg-cover bg-center shadow-2xs`}
        style={{ backgroundImage: `url(${player.image})` }}
      />
    );
  }

  // Thematic Default Avatar
  const effectiveAvatar = avatarId ?? getDeterministicThematicAvatar(player.id || player.name || "player");
  const label = THEMATIC_AVATAR_LABELS[effectiveAvatar] || effectiveAvatar;

  return (
    <span
      role="img"
      aria-label={`${player.name} (${label})`}
      className={`${className} flex shrink-0 items-center justify-center rounded-full border border-gray-100 dark:border-white/10 bg-[#F2F2F7] dark:bg-[#1C1C1E] text-[#007AFF] shadow-2xs`}
    >
      <ThematicIcon id={effectiveAvatar} className="w-[52%] h-[52%]" />
    </span>
  );
}
