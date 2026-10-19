"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { useEmoBooks } from "./EmoBooksProvider";

export default function ReaderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { savedIds, storageNotice } = useEmoBooks();
  return <div className="emo-root min-h-screen">
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/emobooks" className="flex items-center gap-3 text-teal-700"><span className="rounded-2xl bg-teal-700 p-3 text-white"><Heart size={24} /></span><span><span className="block text-xl font-semibold">EmoBooks</span><span className="text-[10px] tracking-widest text-slate-500">READ WITH FEELING</span></span></Link>
        <nav aria-label="EmoBooks navigation" className="flex flex-wrap gap-2 text-sm">
          <Link href="/emobooks" aria-current={!pathname.startsWith("/emobooks/saved") ? "page" : undefined} className="emo-secondary">Find my next read</Link>
          <Link href="/emobooks/saved" aria-current={pathname.startsWith("/emobooks/saved") ? "page" : undefined} className="emo-secondary">My bookshelf ({savedIds.length})</Link>
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    {storageNotice && <p role="status" className="mx-auto max-w-7xl px-5 pb-6 text-sm text-amber-800">{storageNotice}</p>}
  </div>;
}
