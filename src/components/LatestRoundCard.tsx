"use client";

// Latest round recap card on the play page.
// Mobile-first iOS guidelines: min 48px touch buttons, active:scale-95 feedback,
// responsive grid (iPhone 2 cols, iPad 3 cols).
import { useState } from "react";
import { Clock, RotateCcw, Sparkles, Dices } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { HistoryEntry, Player } from "@/types/models";

function scoreTone(score: number): string {
  if (score > 0) return "text-[#34C759]";
  if (score < 0) return "text-[#FF3B30]";
  return "text-[#8E8E93]";
}

function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  return `${score}`;
}

export function LatestRoundCard({
  history,
  players,
  onPlayAgain,
}: {
  history: HistoryEntry[];
  players: Player[];
  onPlayAgain: (playerIds: string[]) => void;
}) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [penalty, setPenalty] = useState<string | null>(null);

  const latestMatch =
    history.length > 0
      ? [...history].sort((a, b) => Number(b.id) - Number(a.id))[0]
      : null;

  if (!latestMatch) return null;

  const playerScores = latestMatch.playerScores || {};
  const entries = Object.entries(playerScores);

  function handlePlayAgain() {
    setErrorMsg(null);
    const roundPlayerIds = Object.keys(playerScores);
    const validIds = roundPlayerIds.filter((id) =>
      players.some((p) => p.id === id),
    );

    if (validIds.length < 2) {
      setErrorMsg("สมาชิกกลุ่มเดิมไม่ครบหรือเหลือน้อยกว่า 2 คน");
      return;
    }

    onPlayAgain(validIds);
  }

  const timeString = new Date(latestMatch.timestamp).toLocaleString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });

  return (
    <section
      aria-labelledby="latest-round-title"
      className="reveal flex flex-col gap-5 rounded-3xl border border-black/[0.04] bg-white/80 p-5 sm:p-6 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-blue-50 text-[#007AFF] shadow-xs">
            <Sparkles className="size-4.5" aria-hidden />
          </span>
          <h2 id="latest-round-title" className="text-lg font-semibold tracking-tight text-[#1C1C1E]">
            สรุปรอบล่าสุด
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-[#8E8E93]">
            <Clock className="size-3.5" aria-hidden />
            {timeString}
          </span>
          <span className="rounded-full bg-blue-50/80 border border-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-[#007AFF]">
            x{latestMatch.multiplier}
          </span>
        </div>
      </div>

      {/* Group Name */}
      <div className="flex items-center justify-between gap-2 border-b border-black/[0.04] pb-3 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">กลุ่ม:</span>
        <span className="font-semibold text-[#1C1C1E]">{latestMatch.groupName}</span>
      </div>

      {/* Player Scores Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {entries.map(([pId, score]) => {
          const player = players.find((p) => p.id === pId);
          const maxScore = Math.max(...entries.map((e) => e[1]));
          const isWinner = score === maxScore;
          const isLoser = score < 0;

          return (
            <div
              key={pId}
              className={`flex min-h-[48px] items-center gap-2.5 rounded-2xl border p-2.5 transition-all ${
                isWinner
                  ? "border-green-300/60 bg-green-50/70 shadow-2xs"
                  : isLoser
                    ? "border-red-300/60 bg-red-50/70 shadow-2xs"
                    : "border-black/[0.04] bg-white/70 shadow-2xs"
              }`}
            >
              {player ? (
                <PlayerAvatar player={player} className="size-8 text-xs shrink-0" />
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-black/[0.04] text-xs text-[#8E8E93]">
                  ?
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#1C1C1E]">
                  {player ? player.name : "(ถูกลบ)"}
                </p>
                <p
                  className={`text-sm font-bold tabular-nums ${scoreTone(
                    score,
                  )}`}
                >
                  {formatScore(score)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {errorMsg ? (
        <p role="alert" className="text-xs font-medium text-[#FF3B30]">
          {errorMsg}
        </p>
      ) : null}

      {/* Random Penalty Box */}
      {penalty ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-red-200/80 bg-red-50/80 p-4 text-[#FF3B30] backdrop-blur-sm">
          <div className="flex items-start gap-2.5 text-xs">
            <Dices className="mt-0.5 size-4.5 shrink-0 text-[#FF3B30]" aria-hidden />
            <p className="font-semibold leading-relaxed">{penalty}</p>
          </div>
        </div>
      ) : null}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          type="button"
          onClick={() => {
            const PENALTIES = [
              "โดนปรับไปเต้นติ๊กต็อกหน้าเซเว่น",
              "ต้องเลี้ยงชาบูเพื่อนมื้อหน้า",
              "ให้เป็นทาสรับใช้ 1 วันเต็ม",
              "ซิทอัพ 50 ทีเดี๋ยวนี้!",
              "พูดจ๊ะจ๋ากับทุกคนในตี้ 1 วัน",
              "โพสต์บอกรักแฟนเก่าลงสตอรี่",
              "ห้ามพูดคำหยาบ 1 ชั่วโมง (หลุดปรับ 20)",
            ];
            const minScore = Math.min(...entries.map(e => e[1]));
            const losers = entries.filter(e => e[1] === minScore);
            const randomLoser = losers[Math.floor(Math.random() * losers.length)];
            const loserPlayer = players.find(p => p.id === randomLoser[0]);
            if (loserPlayer) {
              const randomTask = PENALTIES[Math.floor(Math.random() * PENALTIES.length)];
              setPenalty(`กรรมตามสนอง! ${loserPlayer.name} ต้อง: ${randomTask}`);
            }
          }}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border border-red-200/80 bg-red-50/70 px-5 py-3 text-sm font-semibold text-[#FF3B30] transition-all active:scale-95 hover:bg-red-100/80"
        >
          <Dices className="size-4.5" aria-hidden />
          สุ่มบทลงโทษ
        </button>

        <button
          type="button"
          onClick={handlePlayAgain}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 hover:brightness-105"
        >
          <RotateCcw className="size-4.5" aria-hidden />
          เล่นกลุ่มเดิม
        </button>
      </div>
    </section>
  );
}
