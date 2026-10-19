"use client";

// "Start game" panel: choose who is in the round and the score multiplier,
// then hand off to the score-entry step.
// Ultra-Premium iOS 18 Aesthetic:
// - Frosted glass card: bg-white/80 backdrop-blur-2xl border border-black/[0.04]
// - Apple depth: shadow-[0_8px_30px_rgb(0,0,0,0.06)]
// - Gradient action button: bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] with shadow-blue-500/20
// - Apple typography: font-semibold tracking-tight text-[#1C1C1E] & text-[#8E8E93]
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Play } from "lucide-react";
import { MultiplierPicker } from "@/components/MultiplierPicker";
import { RoundPlayerSelect } from "@/components/RoundPlayerSelect";
import { ScoreEntry } from "@/components/ScoreEntry";
import type { HistoryEntry, Player } from "@/types/models";

const MIN_PLAYERS = 2;

function lastPlayedByPlayer(history: HistoryEntry[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const entry of history) {
    const time = new Date(entry.timestamp).getTime();
    if (Number.isNaN(time)) continue;
    for (const playerId of Object.keys(entry.playerScores ?? {})) {
      if (map[playerId] === undefined || time > map[playerId]) {
        map[playerId] = time;
      }
    }
  }
  return map;
}

export interface PresetTrigger {
  ids: string[];
  timestamp: number;
}

function RoundSetupInner({
  players,
  history,
  loading,
  presetTrigger,
}: {
  players: Player[];
  history: HistoryEntry[];
  loading: boolean;
  presetTrigger?: PresetTrigger | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderedPlayers = useMemo(() => {
    const lastPlayed = lastPlayedByPlayer(history);
    return [...players].sort((a, b) => {
      const aTime = lastPlayed[a.id] ?? -1;
      const bTime = lastPlayed[b.id] ?? -1;
      return aTime - bTime;
    });
  }, [players, history]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [isRandom, setIsRandom] = useState(false);
  const [step, setStep] = useState<"setup" | "entry">("setup");
  const [roundPlayers, setRoundPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const raw = searchParams.get("preset");
    if (!raw) return;
    const requestedIds = raw.split(",").filter(Boolean);
    if (requestedIds.length > 0) {
      setSelectedIds(requestedIds);
    }
    router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appliedTriggerRef = useRef<number | null>(null);

  function getRandomMultiplier(): number {
    const rand = Math.random() * 100;
    if (rand < 5) return 1;
    if (rand < 15) return 2;
    if (rand < 25) return 4;
    if (rand < 50) return 5;
    if (rand < 75) return 8;
    if (rand < 95) return 10;
    return 20;
  }

  useEffect(() => {
    if (!presetTrigger || !presetTrigger.ids.length) return;
    if (appliedTriggerRef.current === presetTrigger.timestamp) return;
    const validIds = presetTrigger.ids.filter((id) =>
      players.some((p) => p.id === id),
    );
    if (validIds.length > 0) {
      appliedTriggerRef.current = presetTrigger.timestamp;
      setSelectedIds(validIds);
      const nextMultiplier = getRandomMultiplier();
      setMultiplier(nextMultiplier);
      setIsRandom(true);
      setRoundPlayers([]);
      setStep("setup");
    }
  }, [presetTrigger, players]);

  function togglePlayer(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((existing) => existing !== id)
        : [...current, id],
    );
  }

  function pickMultiplier(value: number) {
    setMultiplier(value);
    setIsRandom(false);
  }

  function randomizeMultiplier() {
    setMultiplier(getRandomMultiplier());
    setIsRandom(true);
  }

  const validSelectedIds = selectedIds.filter((id) =>
    players.some((player) => player.id === id),
  );
  const enoughPlayers = validSelectedIds.length >= MIN_PLAYERS;

  function handleProceed() {
    const snapshot = validSelectedIds
      .map((id) => players.find((player) => player.id === id))
      .filter((player): player is Player => player !== undefined);
    if (snapshot.length < MIN_PLAYERS) return;
    setRoundPlayers(snapshot);
    setStep("entry");
  }

  function resetRound() {
    setSelectedIds([]);
    setMultiplier(1);
    setIsRandom(false);
    setRoundPlayers([]);
    setStep("setup");
  }

  if (step === "entry") {
    return (
      <ScoreEntry
        players={roundPlayers}
        multiplier={multiplier}
        onBack={() => setStep("setup")}
        onReset={resetRound}
      />
    );
  }

  return (
    <section
      id="round-setup-section"
      className="flex flex-col gap-6 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#007AFF]">
          <Play className="size-4 fill-current" />
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">
          เริ่มเกม
        </h2>
      </div>

      <div className="@container flex flex-col gap-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
          1. เลือกผู้เล่นในรอบนี้
        </p>
        <RoundPlayerSelect
          players={orderedPlayers}
          loading={loading}
          selectedIds={validSelectedIds}
          onToggle={togglePlayer}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
          2. ตัวคูณคะแนนรอบนี้
        </p>
        <div className={multiplier >= 20 ? "animate-shake" : ""}>
          <MultiplierPicker
            value={multiplier}
            onChange={pickMultiplier}
            onRandomize={randomizeMultiplier}
            isRandom={isRandom}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-black/[0.04] dark:border-[#38383A] pt-5">
        <div className="flex items-center justify-between text-xs font-medium text-[#8E8E93] dark:text-[#98989D] tabular-nums">
          <span>เลือกแล้ว {validSelectedIds.length} คน</span>
          <span>ตัวคูณ x{multiplier}</span>
        </div>
        <button
          type="button"
          onClick={handleProceed}
          disabled={!enoughPlayers}
          className={`flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold transition-all duration-200 ease-out ${
            enoughPlayers
              ? "bg-[#007AFF] text-white shadow-lg shadow-blue-500/25 hover:bg-[#0062cc] active:scale-[0.97] cursor-pointer"
              : "bg-gray-300 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed shadow-none"
          }`}
        >
          ลุยดิวะ!
          <ArrowRight className="size-4.5" />
        </button>
        {!enoughPlayers ? (
          <p className="text-center text-xs text-[#8E8E93] dark:text-[#98989D]">
            เลือกผู้เล่นอย่างน้อย {MIN_PLAYERS} คน
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function RoundSetup({
  players,
  history,
  loading,
  presetTrigger,
}: {
  players: Player[];
  history: HistoryEntry[];
  loading: boolean;
  presetTrigger?: PresetTrigger | null;
}) {
  return (
    <Suspense
      fallback={
        <section className="flex flex-col gap-6 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 opacity-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#007AFF]">
              <Play className="size-4 fill-current" />
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">
              เริ่มเกม
            </h2>
          </div>
        </section>
      }
    >
      <RoundSetupInner
        players={players}
        history={history}
        loading={loading}
        presetTrigger={presetTrigger}
      />
    </Suspense>
  );
}
