"use client";

import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { emotions } from "@/lib/emobooks/data";
import { useEmoBooks } from "./EmoBooksProvider";

export default function MoodStart() {
  const router = useRouter();
  const { updateRequest, ready } = useEmoBooks();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {emotions.map((emotion) => <button key={emotion.id} type="button" disabled={!ready} onClick={() => {
        updateRequest({ currentEmotion: emotion.id, goalMode: "continue", targetEmotion: null });
        router.push("/emobooks/discover");
      }} className="emo-panel emo-mood group flex flex-col items-start gap-3 p-4 text-left sm:flex-row sm:items-center lg:flex-col lg:items-start lg:p-5">
        <span aria-hidden="true" style={{ background: emotion.color }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl">{emotion.symbol}</span>
        <span className="flex w-full items-center justify-between gap-1 text-xs font-semibold sm:text-sm">{emotion.label}<ArrowUpRight size={14} className="shrink-0 text-teal-700 opacity-40 transition-opacity group-hover:opacity-100" /></span>
      </button>)}
    </div>
  );
}
