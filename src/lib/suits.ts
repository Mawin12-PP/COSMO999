// Thematic Playing Card & Dummy Game Avatar definitions.
// Supported avatars (14 unique card-game items):
// 1. Spade (♠ โพดำ)
// 2. Heart (♥ โพแดง)
// 3. Club (♣ ดอกจิก)
// 4. Diamond (♦ ข้าวหลามตัด)
// 5. Speto 2 (2♣ สเปโตสอง)
// 6. Speto Q (Q♠ สเปโตแหม่ม)
// 7. Joker (🃏 โจ๊กเกอร์)
// 8. King (👑 คิง)
// 9. Deck (🎴 สำรับไพ่)
// 10. Dice (🎲 ลูกเต๋า)
// 11. Chip (🪙 ชิปเดิมพัน)
// 12. Fire (🔥 มือขึ้น)
// 13. Shield (🛡️ สายเหนียว)
// 14. Trophy (🏆 แชมป์วง)

export type ThematicAvatarId =
  | "spade"
  | "heart"
  | "club"
  | "diamond"
  | "speto-2"
  | "speto-q"
  | "joker"
  | "king"
  | "deck"
  | "dice"
  | "chip"
  | "fire"
  | "shield"
  | "trophy";

export const THEMATIC_AVATARS: ThematicAvatarId[] = [
  "spade",
  "heart",
  "club",
  "diamond",
  "speto-2",
  "speto-q",
  "joker",
  "king",
  "deck",
  "dice",
  "chip",
  "fire",
  "shield",
  "trophy",
];

// Human-readable labels in Thai
export const THEMATIC_AVATAR_LABELS: Record<ThematicAvatarId, string> = {
  spade: "โพดำ ♠",
  heart: "โพแดง ♥",
  club: "ดอกจิก ♣",
  diamond: "ข้าวหลามตัด ♦",
  "speto-2": "สเปโต 2♣",
  "speto-q": "สเปโต Q♠",
  joker: "โจ๊กเกอร์ 🃏",
  king: "คิง 👑",
  deck: "สำรับไพ่ 🎴",
  dice: "ลูกเต๋า 🎲",
  chip: "ชิปเดิมพัน 🪙",
  fire: "มือขึ้น 🔥",
  shield: "สายเหนียว 🛡️",
  trophy: "แชมป์วง 🏆",
};

/**
 * Check if the stored image string represents a thematic avatar token.
 */
export function isThematicAvatar(image?: string | null): boolean {
  if (!image) return false;
  const clean = image.replace(/^suit:/, "");
  return THEMATIC_AVATARS.includes(clean as ThematicAvatarId);
}

/**
 * Extract the ThematicAvatarId from an avatar string, or null if it is a photo or empty.
 */
export function parseThematicAvatar(image?: string | null): ThematicAvatarId | null {
  if (!image) return null;
  const clean = image.replace(/^suit:/, "");
  if (THEMATIC_AVATARS.includes(clean as ThematicAvatarId)) {
    return clean as ThematicAvatarId;
  }
  return null;
}

/**
 * Pick a random thematic avatar that is NOT yet used by any existing player in the room.
 * If all 14 avatars are already taken, falls back to a random pick from the full pool.
 */
export function getUniqueThematicAvatar(
  existingImages: (string | undefined | null)[],
): ThematicAvatarId {
  const usedAvatars = new Set<string>();
  for (const img of existingImages) {
    if (!img) continue;
    const clean = img.replace(/^suit:/, "");
    if (THEMATIC_AVATARS.includes(clean as ThematicAvatarId)) {
      usedAvatars.add(clean);
    }
  }

  // Filter avatars that haven't been claimed yet
  const available = THEMATIC_AVATARS.filter((id) => !usedAvatars.has(id));

  if (available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  // Fallback when player count exceeds available avatar pool
  const fallbackIndex = Math.floor(Math.random() * THEMATIC_AVATARS.length);
  return THEMATIC_AVATARS[fallbackIndex];
}

/**
 * Deterministically pick an avatar for fallback consistency based on player id/name.
 */
export function getDeterministicThematicAvatar(seed: string): ThematicAvatarId {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return THEMATIC_AVATARS[Math.abs(hash) % THEMATIC_AVATARS.length];
}

// Backwards-compatible aliases
export type CardSuit = ThematicAvatarId;
export const CARD_SUITS = THEMATIC_AVATARS;
export const getRandomSuit = () => getUniqueThematicAvatar([]);
export const isSuitAvatar = isThematicAvatar;
export const parseSuit = parseThematicAvatar;
export const getDeterministicSuit = getDeterministicThematicAvatar;
