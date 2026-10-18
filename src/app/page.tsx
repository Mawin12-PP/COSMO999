"use client";

// Play page: set up a round, plus the roster tools for adding, editing, and
// removing players. Ultra-Premium iOS 18 typography and frosted badges.
import { useState } from "react";
import { Loader2, TriangleAlert, Wifi } from "lucide-react";
import { CreatePlayerForm } from "@/components/CreatePlayerForm";
import { LatestRoundCard } from "@/components/LatestRoundCard";
import { PlayerList } from "@/components/PlayerList";
import { RoundSetup } from "@/components/RoundSetup";
import type { PresetTrigger } from "@/components/RoundSetup";
import { useHistory } from "@/hooks/useHistory";
import { usePlayers } from "@/hooks/usePlayers";

export default function HomePage() {
  const { players, loading, error } = usePlayers();
  const { history, loading: historyLoading } = useHistory();
  const [presetTrigger, setPresetTrigger] = useState<PresetTrigger | null>(null);

  function handlePlayAgain(playerIds: string[]) {
    setPresetTrigger({ ids: playerIds, timestamp: Date.now() });
    const el = document.getElementById("round-setup-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="reveal flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1E] sm:text-3xl">
            ตั้งค่ารอบ
          </h1>
          <p className="mt-1 text-sm text-[#8E8E93]">
            เลือกผู้เล่นกับตัวคูณ แล้วไปกรอกคะแนน
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-black/[0.04] bg-white/80 backdrop-blur-xl px-3.5 py-1 text-xs font-medium shadow-sm">
          {error ? (
            <>
              <TriangleAlert className="size-3.5 text-[#FF3B30]" />
              <span className="text-[#FF3B30]">หลุดการเชื่อมต่อ</span>
            </>
          ) : loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-[#007AFF]" />
              <span className="text-[#8E8E93]">กำลังเชื่อมต่อ</span>
            </>
          ) : (
            <>
              <Wifi className="size-3.5 text-[#007AFF]" />
              <span className="text-[#007AFF] font-semibold">{players.length} คน</span>
            </>
          )}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="reveal">
            <RoundSetup
              players={players}
              history={history}
              loading={loading || historyLoading}
              presetTrigger={presetTrigger}
            />
          </div>

          <LatestRoundCard
            history={history}
            players={players}
            onPlayAgain={handlePlayAgain}
          />
        </div>

        <section className="reveal flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#1C1C1E]">จัดการผู้เล่น</h2>
            <p className="mt-0.5 text-sm text-[#8E8E93]">
              เพิ่ม แก้ไข หรือลบผู้เล่นในวง
            </p>
          </div>

          <CreatePlayerForm />
          <PlayerList players={players} loading={loading} />
        </section>
      </div>
    </div>
  );
}
