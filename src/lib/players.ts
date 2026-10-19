// Player writes. dummyRoom/players is stored as a whole JSON array, exactly
// as the legacy app writes it via playersRef.set(players). Every mutation
// here follows the same shape: read the current array, change it in memory,
// then set the entire path back as an array. Do NOT switch this to a keyed
// object - the phase-2 score transaction relies on the array layout.
import { ref, set } from "firebase/database";
import { database, DB_PATHS } from "./firebase";
import { readList } from "./rtdb";
import { getUniqueThematicAvatar } from "./suits";
import type { Player } from "@/types/models";

export async function writeAll(players: Player[]): Promise<void> {
  await set(ref(database, DB_PATHS.players), players);
}

/**
 * Append a new player and return its id.
 * If no custom image is provided, automatically selects a balanced
 * card suit avatar (♠, ♥, ♣, ♦) and permanently persists it to the database.
 */
export async function createPlayer(
  name: string,
  image?: string,
): Promise<string> {
  const players = await readList<Player>(DB_PATHS.players);
  let finalImage = image?.trim() || "";
  if (!finalImage) {
    const existingImages = players.map((p) => p.image);
    finalImage = `suit:${getUniqueThematicAvatar(existingImages)}`;
  }

  const newPlayer: Player = {
    id: Date.now().toString(),
    name: name.trim(),
    image: finalImage,
    totalScore: 0,
    latestScore: null,
  };
  await writeAll([...players, newPlayer]);
  return newPlayer.id;
}

/**
 * Update a player's name and/or image. Fields left undefined are kept as-is.
 * Score fields are never touched here.
 */
export async function updatePlayer(
  id: string,
  changes: { name?: string; image?: string },
): Promise<void> {
  const players = await readList<Player>(DB_PATHS.players);
  const next = players.map((player) => {
    if (player.id !== id) return player;
    let newImage = changes.image !== undefined ? changes.image : player.image;
    if (!newImage || newImage.trim() === "") {
      const otherImages = players.filter((p) => p.id !== id).map((p) => p.image);
      newImage = `suit:${getUniqueThematicAvatar(otherImages)}`;
    }
    return {
      ...player,
      ...(changes.name !== undefined ? { name: changes.name.trim() } : {}),
      image: newImage,
    };
  });
  await writeAll(next);
}

/** Remove a player from the array. */
export async function deletePlayer(id: string): Promise<void> {
  const players = await readList<Player>(DB_PATHS.players);
  await writeAll(players.filter((player) => player.id !== id));
}
