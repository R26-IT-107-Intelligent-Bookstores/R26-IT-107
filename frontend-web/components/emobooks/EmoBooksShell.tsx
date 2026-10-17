"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Heart, Sparkles, ArrowUpRight } from "lucide-react";
import { useEmoBooks } from "./EmoBooksProvider";

export default function EmoBooksShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { savedIds, storageNotice } = useEmoBooks();
  const links = [
    { href: "/emobooks", label: "Overview" },
    { href: "/emobooks/discover", label: "Find my next read" },
    { href: "/emobooks/saved", label: "My bookshelf" },
    { href: "/emobooks/about", label: "How it works" },
  ];

  return (
    <div className="emo-root flex-1">
      <div className="border-b border-[#e3e7de] bg-[#fffefa]/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:py-6">
          <Link href="/emobooks" className="flex w-fit items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#193f35] text-[#edcf92]"><Heart size={22} strokeWidth={1.5} /></span>
            <span><span className="block text-xl font-semibold tracking-tight">Emo<span className="font-serif italic">Books</span></span><span className="block text-[10px] tracking-[.14em] text-slate-500">READ WITH FEELING</span></span>
            <span className="ml-1 rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-[9px] font-semibold tracking-widest text-amber-800">DISCOVER</span>
          </Link>
          <nav aria-label="EmoBooks navigation" className="emo-scroll-tabs flex max-w-full gap-1 overflow-x-auto rounded-full bg-[#f2f3ec] p-1 text-xs sm:text-sm">
            {links.map((link) => {
              const active = pathname === link.href || (link.href.endsWith("discover") && (pathname.includes("/recommendations") || pathname.includes("/books/")));
              return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={"flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 transition-colors " + (active ? "bg-[#193f35] font-medium text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-teal-800")}>
                {link.href.endsWith("saved") && <Bookmark size={14} />}{link.label}
                {link.href.endsWith("saved") && <span className={"flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] " + (active ? "bg-white/15" : "bg-white text-teal-800")}>{savedIds.length}</span>}
              </Link>;
            })}
          </nav>
        </div>
      </div>
      <main id="emobooks-content" className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">{children}</main>
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-3 sm:px-8">
        {storageNotice && <p role="status" className="mb-3 text-sm text-amber-800">{storageNotice}</p>}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#dfe6dc] pt-6 sm:flex-row">
          <p className="flex items-center gap-2 text-xs text-slate-500"><Sparkles size={14} className="shrink-0 text-teal-700" />A starting point for your next story.</p>
          <Link href="/emobooks/about" className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800">How it works <ArrowUpRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
}
