"use client";

// Latest round recap card on the play page.
// Mobile-first iOS guidelines: min 48px touch buttons, active:scale-95 feedback,
// responsive grid (iPhone 2 cols, iPad 3 cols).
import { useState } from "react";
import { Clock, RotateCcw, Sparkles, Dices } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { HistoryEntry, Player } from "@/types/models";
import { scoreTone } from "@/lib/format";

function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  return `${score}`;
}

export function getPlayerGridCols(count: number): string {
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-3";
  if (count === 4) return "grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
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
  // Sort player scores descending (มากไปน้อย)
  const entries = Object.entries(playerScores).sort((a, b) => b[1] - a[1]);

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
      className="reveal flex flex-col gap-5 rounded-[20px] border border-black/[0.04] dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] shadow-xs">
            <Sparkles className="size-4.5" aria-hidden />
          </span>
          <h2 id="latest-round-title" className="text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">
            สรุปรอบล่าสุด
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-[#8E8E93] dark:text-[#98989D]">
            <Clock className="size-3.5" aria-hidden />
            {timeString}
          </span>
          <span className="rounded-full bg-blue-50/80 dark:bg-blue-950/40 border border-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-[#007AFF]">
            x{latestMatch.multiplier}
          </span>
        </div>
      </div>


      {/* Player Scores Grid */}
      <div className={`grid gap-2.5 ${getPlayerGridCols(entries.length)}`}>
        {entries.map(([pId, score]) => {
          const player = players.find((p) => p.id === pId);
          const maxScore = Math.max(...entries.map((e) => e[1]));
          const isWinner = score === maxScore;
          const isLoser = score < 0;

          return (
            <div
              key={pId}
              title={player ? player.name : undefined}
              className={`flex min-h-[38px] sm:min-h-[42px] items-center justify-center gap-2 sm:gap-2.5 rounded-full border px-3 py-1.5 transition-all min-w-0 ${
                isWinner
                  ? "border-green-300/60 dark:border-green-800/60 bg-green-50/70 dark:bg-green-950/30 shadow-2xs"
                  : isLoser
                    ? "border-red-300/60 dark:border-red-800/60 bg-red-50/70 dark:bg-red-950/30 shadow-2xs"
                    : "border-black/[0.04] dark:border-[#38383A] bg-gray-50/80 dark:bg-[#2C2C2E] shadow-2xs"
              }`}
            >
              {player ? (
                <PlayerAvatar player={player} className="size-7 sm:size-7.5 text-xs shrink-0" />
              ) : (
                <span className="flex size-7 sm:size-7.5 shrink-0 items-center justify-center rounded-full border border-black/[0.06] dark:border-[#38383A] bg-black/[0.04] dark:bg-[#2C2C2E] text-xs text-[#8E8E93] dark:text-[#98989D]">
                  ?
                </span>
              )}
              <span
                className={`text-xs sm:text-sm font-bold tabular-nums text-center shrink-0 ${scoreTone(
                  score,
                )}`}
              >
                {formatScore(score)}
              </span>
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
        <div className="flex flex-col gap-2 rounded-2xl border border-black/[0.08] dark:border-[#38383A] bg-black/[0.03] dark:bg-[#2C2C2E]/60 p-4 text-[#1C1C1E] dark:text-[#F2F2F7] backdrop-blur-sm">
          <div className="flex items-start gap-2.5 text-xs">
            <Dices className="mt-0.5 size-4.5 shrink-0 text-[#8E8E93] dark:text-[#98989D]" aria-hidden />
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
              "เป็นคนสับและแจกไพ่ในรอบถัดไป",
              "เติมน้ำหรือตักน้ำแข็งเสิร์ฟเพื่อนทุกคนในวง",
              "พูดลงท้ายด้วย 'เจ้าค่ะ / ขอรับ' ตลอดรอบถัดไป",
              "ทำหน้าตลกให้เพื่อนในวงถ่ายรูป 1 รูป",
              "นวดไหล่เอาใจคนชนะประจำรอบ 1 นาที",
              "ร้องเพลงท่อนฮุก 1 เพลงแบบใส่อารมณ์เต็มร้อย",
              "ยิ้มหวานค้างไว้ 30 วินาที ห้ามหุบยิ้มเด็ดขาด",
              "ส่งมินิฮาร์ตพร้อมพูดชมเพื่อนรอบวงทีละคน",
              "ทำเสียงสัตว์ตามที่คนชนะสั่ง 3 ครั้ง (เช่น แมว, เป็ด, ไก่)",
              "ยกมือไหว้ขอบคุณทุกคนรอบวงที่เมตตาให้แต้ม",
              "เก๊กหน้านิ่งห้ามยิ้มหรือหัวเราะตลอดรอบถัดไป",
              "เป็นเด็กเก็บบอร์ด จัดเก็บกองไพ่รอบนี้ให้เรียบร้อย",
              "เต้นท่าดุ๊กดิ๊กน่ารักๆ กลางวง 10 วินาที",
              "โดนเพื่อนในวงรุมดีดหน้าผากเบาๆ คนละ 1 แปะ",
              "พูดเลียนแบบเสียงหรือสำเนียงของคนชนะตลอดรอบถัดไป",
            ];
            const minScore = Math.min(...entries.map(e => e[1]));
            const losers = entries.filter(e => e[1] === minScore);
            const randomLoser = losers[Math.floor(Math.random() * losers.length)];
            const loserPlayer = players.find(p => p.id === randomLoser[0]);
            if (loserPlayer) {
              const randomTask = PENALTIES[Math.floor(Math.random() * PENALTIES.length)];
              setPenalty(`${loserPlayer.name} ต้อง: ${randomTask}`);
            }
          }}
          className="flex min-h-[42px] sm:min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full border border-black/[0.08] dark:border-[#38383A] bg-black/[0.04] dark:bg-[#2C2C2E] px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] transition-all duration-200 ease-out active:scale-[0.97] hover:bg-black/[0.08] dark:hover:bg-[#38383A]"
        >
          <Dices className="size-4 text-[#8E8E93] dark:text-[#98989D]" aria-hidden />
          สุ่มบทลงโทษ
        </button>

        <button
          type="button"
          onClick={handlePlayAgain}
          className="flex min-h-[42px] sm:min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 ease-out active:scale-[0.97] hover:opacity-90"
        >
          <RotateCcw className="size-4" aria-hidden />
          เล่นกลุ่มเดิม
        </button>
      </div>
    </section>
  );
}
