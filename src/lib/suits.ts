// Thematic Playing Card & Dummy Game Avatar definitions.
// Supported avatars (12 unique card-game items):
// 1. Spade (♠ โพดำ)
// 2. Heart (♥ โพแดง)
// 3. Club (♣ ดอกจิก)
// 4. Diamond (♦ ข้าวหลามตัด)
// 5. Joker (🃏 โจ๊กเกอร์)
// 6. King (👑 คิง)
// 7. Deck (🎴 สำรับไพ่)
// 8. Dice (🎲 ลูกเต๋า)
// 9. Chip (🪙 ชิปเดิมพัน)
// 10. Fire (🔥 มือขึ้น)
// 11. Shield (🛡️ สายเหนียว)
// 12. Trophy (🏆 แชมป์วง)

export type ThematicAvatarId =
  | "spade"
  | "heart"
  | "club"
  | "diamond"
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
 * 32-bit FNV-1a hash algorithm. Uniformly distributes strings and numeric timestamps
 * across buckets without mathematical degenerate collisions.
 */
export function getRobustHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * "Unique Smart Pick" (No Duplication Logic):
 * 1. Scans existing players in the current circle to see which of the 12 symbols are in use.
 * 2. Picks a symbol from the 12-symbol pool that is NOT currently being used.
 * 3. Only if all 12 symbols are already in use, falls back to picking the one with the lowest frequency count.
 */
export function getUniqueThematicAvatar(
  existingImages: (string | undefined | null)[],
): ThematicAvatarId {
  const counts: Record<ThematicAvatarId, number> = {
    spade: 0,
    heart: 0,
    club: 0,
    diamond: 0,
    joker: 0,
    king: 0,
    deck: 0,
    dice: 0,
    chip: 0,
    fire: 0,
    shield: 0,
    trophy: 0,
  };

  let lastSymbol: ThematicAvatarId | null = null;
  for (let i = existingImages.length - 1; i >= 0; i--) {
    const img = existingImages[i];
    if (!img) continue;
    const clean = img.replace(/^suit:/, "") as ThematicAvatarId;
    if (clean in counts) {
      if (!lastSymbol) lastSymbol = clean;
      counts[clean]++;
    }
  }

  // 1. Pick among symbols in the 12-symbol pool that are NOT currently in use
  const unused = THEMATIC_AVATARS.filter((id) => counts[id] === 0);
  if (unused.length > 0) {
    const randomIndex = Math.floor(Math.random() * unused.length);
    return unused[randomIndex];
  }

  // 2. All 12 symbols are in use -> fallback to lowest frequency count
  const minCount = Math.min(...Object.values(counts));
  let candidates = THEMATIC_AVATARS.filter((id) => counts[id] === minCount);

  // Avoid consecutive duplicate if multiple candidates are available
  if (candidates.length > 1 && lastSymbol && candidates.includes(lastSymbol)) {
    candidates = candidates.filter((id) => id !== lastSymbol);
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Deterministically pick an avatar for fallback consistency based on player id/name
 * using the full 12-symbol pool and FNV-1a distribution.
 */
export function getDeterministicThematicAvatar(seed: string): ThematicAvatarId {
  const hash = getRobustHash(seed);
  return THEMATIC_AVATARS[hash % THEMATIC_AVATARS.length];
}

// Backwards-compatible aliases
export type CardSuit = ThematicAvatarId;
export const CARD_SUITS = THEMATIC_AVATARS;
export const getRandomSuit = () => getUniqueThematicAvatar([]);
export const isSuitAvatar = isThematicAvatar;
export const parseSuit = parseThematicAvatar;
export const getDeterministicSuit = getDeterministicThematicAvatar;
