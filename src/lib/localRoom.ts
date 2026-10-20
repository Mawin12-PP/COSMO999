import { normalizeList } from "./rtdb";
import type { Group, HistoryEntry, Player, RoomData } from "@/types/models";

const LOCAL_ROOM_KEY = "cosmo999_dev_room";

// In-memory listeners for reactive updates within the same tab
const roomListeners = new Set<() => void>();

export function subscribeToLocalRoom(callback: () => void): () => void {
  roomListeners.add(callback);

  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_ROOM_KEY) {
      callback();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    roomListeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function notifyLocalRoom(): void {
  roomListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  });
}

export function normalizeRoom(raw: unknown): RoomData {
  if (raw === null || typeof raw !== "object") {
    return { players: [], groups: [], history: {} };
  }
  const room = raw as Record<string, unknown>;
  const players = normalizeList<Player>(room.players);
  const groups = normalizeList<Group>(room.groups);
  const rawHistory = room.history;
  const history: Record<string, HistoryEntry> =
    rawHistory !== null && typeof rawHistory === "object"
      ? (rawHistory as Record<string, HistoryEntry>)
      : {};
  return { players, groups, history };
}

export function getLocalRoom(): RoomData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_ROOM_KEY);
    if (!raw) return null;
    return normalizeRoom(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function setLocalRoom(room: RoomData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_ROOM_KEY, JSON.stringify(room));
  } catch {
    // Ignore localStorage write errors
  }
  notifyLocalRoom();
}

let initPromise: Promise<RoomData> | null = null;

export async function initializeLocalRoom(): Promise<RoomData> {
  const existing = getLocalRoom();
  if (existing && existing.players.length > 0) {
    return existing;
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch("/mock-data.json");
      const data = await res.json();
      const historyMap: Record<string, HistoryEntry> = {};
      if (Array.isArray(data?.history)) {
        for (const item of data.history) {
          if (item && item.id) {
            historyMap[item.id] = item;
          }
        }
      }
      const room: RoomData = {
        players: Array.isArray(data?.players) ? data.players : [],
        groups: Array.isArray(data?.groups) ? data.groups : [],
        history: historyMap,
      };
      setLocalRoom(room);
      return room;
    } catch {
      const fallback: RoomData = { players: [], groups: [], history: {} };
      setLocalRoom(fallback);
      return fallback;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function getLocalPlayers(): Promise<Player[]> {
  const room = await initializeLocalRoom();
  return room.players;
}

export async function setLocalPlayers(players: Player[]): Promise<void> {
  const room = await initializeLocalRoom();
  setLocalRoom({ ...room, players });
}

export async function getLocalGroups(): Promise<Group[]> {
  const room = await initializeLocalRoom();
  return room.groups;
}

export async function setLocalGroups(groups: Group[]): Promise<void> {
  const room = await initializeLocalRoom();
  setLocalRoom({ ...room, groups });
}

export async function getLocalHistory(): Promise<HistoryEntry[]> {
  const room = await initializeLocalRoom();
  return Object.values(room.history).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}
