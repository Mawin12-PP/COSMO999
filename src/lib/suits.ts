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

export const FOUR_SUITS: ThematicAvatarId[] = [
  "spade",
  "heart",
  "club",
  "diamond",
];

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
 * Pick a thematic avatar evenly selected from the 4 primary card suits:
 * Spade (♠), Heart (♥), Club (♣), Diamond (♦).
 * It tracks frequency among existing players and selects from the least-used suit(s),
 * breaking ties randomly. Also prevents assigning the exact same suit to consecutive
 * new users when other candidate suits are available.
 */
export function getUniqueThematicAvatar(
  existingImages: (string | undefined | null)[],
): ThematicAvatarId {
  const counts: Record<"spade" | "heart" | "club" | "diamond", number> = {
    spade: 0,
    heart: 0,
    club: 0,
    diamond: 0,
  };

  // Find the suit of the most recently added player (consecutive user check)
  let lastSuit: ("spade" | "heart" | "club" | "diamond") | null = null;
  for (let i = existingImages.length - 1; i >= 0; i--) {
    const img = existingImages[i];
    if (!img) continue;
    const clean = img.replace(/^suit:/, "");
    if (clean in counts) {
      if (!lastSuit) lastSuit = clean as "spade" | "heart" | "club" | "diamond";
      counts[clean as keyof typeof counts]++;
    }
  }

  // Find minimum count among the 4 suits to distribute evenly
  const minCount = Math.min(...Object.values(counts));
  let candidates = (Object.keys(counts) as ("spade" | "heart" | "club" | "diamond")[]).filter(
    (suit) => counts[suit] === minCount,
  );

  // If multiple candidates are available with the minimum count,
  // avoid assigning the exact same icon as the immediately preceding user
  if (candidates.length > 1 && lastSuit && candidates.includes(lastSuit)) {
    candidates = candidates.filter((suit) => suit !== lastSuit);
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Deterministically pick an avatar for fallback consistency based on player id/name
 * using the 4 primary card suits and FNV-1a distribution.
 */
export function getDeterministicThematicAvatar(seed: string): ThematicAvatarId {
  const hash = getRobustHash(seed);
  return FOUR_SUITS[hash % FOUR_SUITS.length];
}

// Backwards-compatible aliases
export type CardSuit = "spade" | "heart" | "club" | "diamond";
export const CARD_SUITS = FOUR_SUITS;
export const getRandomSuit = () => getUniqueThematicAvatar([]);
export const isSuitAvatar = isThematicAvatar;
export const parseSuit = parseThematicAvatar;
export const getDeterministicSuit = getDeterministicThematicAvatar;
