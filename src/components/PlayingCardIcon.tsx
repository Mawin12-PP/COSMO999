"use client";

import React from "react";
import { Spade, Heart, Club, Diamond } from "lucide-react";

interface PlayingCardIconProps {
  rank: string;
  suit: "spade" | "heart" | "club" | "diamond";
}

export default function PlayingCardIcon({ rank, suit }: PlayingCardIconProps) {
  // เลือกไอคอนและใส่ style ให้ถูกต้อง
  const renderIcon = () => {
    switch (suit) {
      case "spade":
        return <Spade className="w-4 h-4 text-black dark:text-gray-200 fill-black dark:fill-gray-200" />;
      case "club":
        // ดอกจิก (Club) จะใช้ไอคอนของตัวเอง ไม่ซ้ำกับโพดำ
        return <Club className="w-4 h-4 text-black dark:text-gray-200 fill-black dark:fill-gray-200" />;
      case "heart":
        return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case "diamond":
        return <Diamond className="w-4 h-4 text-red-500 fill-red-500" />;
      default:
        return null;
    }
  };

  // กำหนดสีตัวหนังสือตามหน้าไพ่
  const textColor = (suit === "heart" || suit === "diamond") 
    ? "text-red-500" 
    : "text-black dark:text-white";

  return (
    <div className="relative w-10 h-13 bg-white dark:bg-[#1E1E1E] border border-gray-200/50 dark:border-white/[0.08] rounded-[10px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] p-1.5 flex flex-col">
      {/* Rank (Top Left) */}
      <span className={`text-xs font-bold leading-none z-10 ${textColor}`}>
        {rank}
      </span>
      {/* Suit Icon (Centered in remaining space) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <div className="transform scale-[1.1]">
          {renderIcon()}
        </div>
      </div>
    </div>
  );
}

export { PlayingCardIcon };
