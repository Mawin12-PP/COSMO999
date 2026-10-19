"use client";

// Live list of players from dummyRoom/players. Read-only.
import { useEffect, useState } from "react";
import { DB_PATHS, isConfigured } from "@/lib/firebase";
import { writeAll } from "@/lib/players";
import { subscribeToList } from "@/lib/rtdb";
import { parseThematicAvatar, getUniqueThematicAvatar } from "@/lib/suits";
import type { Player } from "@/types/models";

export function usePlayers(): {
  players: Player[];
  loading: boolean;
  error: Error | null;
} {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If Firebase is not configured (local development), load mock data immediately
    if (process.env.NODE_ENV === "development" && !isConfigured) {
      fetch("/mock-data.json")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data?.players) && data.players.length > 0) {
            setPlayers(data.players);
            setError(null);
          }
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false));
      return;
    }
    const unsubscribe = subscribeToList<Player>(
      DB_PATHS.players,
      (items) => {
        // Detect and migrate any legacy players who do not have a photo or suit token
        let needsSync = false;
        const currentImages = items.map((p) => p.image);

        const normalized = items.map((player) => {
          const hasPhoto = Boolean(
            player.image &&
              (player.image.startsWith("data:") ||
                player.image.startsWith("http://") ||
                player.image.startsWith("https://")),
          );
          const hasSuit = Boolean(parseThematicAvatar(player.image));

          if (!hasPhoto && !hasSuit) {
            needsSync = true;
            const assignedSuit = getUniqueThematicAvatar(currentImages);
            const token = `suit:${assignedSuit}`;
            currentImages.push(token);
            return {
              ...player,
              image: token,
            };
          }
          return player;
        });

        if (needsSync) {
          writeAll(normalized).catch(() => {});
        }

        setPlayers(normalized);
        setError(null);
        setLoading(false);
      },
      (err) => {
        if (process.env.NODE_ENV === "development" && !isConfigured) {
          fetch("/mock-data.json")
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data?.players) && data.players.length > 0) {
                setPlayers(data.players);
                setError(null);
              } else {
                setError(err);
              }
            })
            .catch(() => setError(err))
            .finally(() => setLoading(false));
          return;
        }
        setError(err);
        setLoading(false);
      },
    );
    // Detach the listener on unmount.
    return unsubscribe;
  }, []);

  return { players, loading, error };
}
