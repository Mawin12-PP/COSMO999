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
 * Pick a thematic avatar evenly selected from the 4 primary card suits:
 * Spade (♠), Heart (♥), Club (♣), Diamond (♦).
 * It tracks frequency among existing players and selects from the least-used suit(s),
 * breaking ties randomly. This guarantees uniform distribution with no unwanted repeats.
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

  for (const img of existingImages) {
    if (!img) continue;
    const clean = img.replace(/^suit:/, "");
    if (clean in counts) {
      counts[clean as keyof typeof counts]++;
    }
  }

  // Find minimum count among the 4 suits to distribute evenly
  const minCount = Math.min(...Object.values(counts));
  const candidates = (Object.keys(counts) as ("spade" | "heart" | "club" | "diamond")[]).filter(
    (suit) => counts[suit] === minCount,
  );

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Deterministically pick an avatar for fallback consistency based on player id/name
 * using the 4 primary card suits.
 */
export function getDeterministicThematicAvatar(seed: string): ThematicAvatarId {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return FOUR_SUITS[Math.abs(hash) % FOUR_SUITS.length];
}

// Backwards-compatible aliases
export type CardSuit = "spade" | "heart" | "club" | "diamond";
export const CARD_SUITS = FOUR_SUITS;
export const getRandomSuit = () => getUniqueThematicAvatar([]);
export const isSuitAvatar = isThematicAvatar;
export const parseSuit = parseThematicAvatar;
export const getDeterministicSuit = getDeterministicThematicAvatar;
