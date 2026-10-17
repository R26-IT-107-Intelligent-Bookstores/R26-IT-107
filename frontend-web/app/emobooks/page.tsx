import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bookmark, Heart, Leaf, Sparkles, BookOpen } from "lucide-react";
import MoodStart from "@/components/emobooks/MoodStart";
import CatalogPreview, { CatalogHero } from "@/components/emobooks/CatalogPreview";

export default function EmoBooksHome() {
  return <>
    <section className="emo-hero relative grid items-center gap-8 overflow-hidden rounded-[2rem] px-7 py-10 text-white sm:px-12 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:px-14 lg:py-16">
      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-medium tracking-[.12em] text-[#efd9aa]"><Sparkles size={13} /> A LITTLE FEELING. A WHOLE NEW STORY.</span>
        <h1 className="mt-6 max-w-xl text-[2.5rem] font-medium leading-[1.08] tracking-tight sm:text-6xl lg:text-[4.4rem]">Turn your mood<br />into your <span className="font-serif italic text-[#edcf92]">next read.</span></h1>
        <p className="mt-6 max-w-md text-sm leading-7 text-[#d2e3d7] sm:text-base sm:leading-8">Some days call for a little magic. Others, a story that understands. Discover books for how you feel, and where you want to go.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/emobooks/discover" className="emo-primary">Find my next read <ArrowRight size={17} /></Link><Link href="/emobooks/about" className="emo-secondary">How it works <ArrowUpRight size={16} className="hidden sm:block" /></Link></div>
        <div className="mt-8 hidden items-center gap-3 border-t border-white/10 pt-5 sm:flex"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#edcf92]"><BookOpen size={16} /></span><p className="text-xs leading-5 text-[#bfd2c6]">Your mood. Your pace. Your story.<br /><span className="text-[#93afa0]">No account needed to start exploring.</span></p></div>
      </div>
      <div className="relative flex min-h-[270px] items-center justify-center sm:min-h-[400px]" aria-hidden="true">
        <div className="absolute h-72 w-72 rounded-full border border-[#edcf92]/20 bg-[#d6e5cf]/5 sm:h-96 sm:w-96" />
        <div className="absolute h-60 w-60 rounded-full border border-[#edcf92]/10 sm:h-80 sm:w-80" />
        <span className="absolute right-2 top-1 flex -rotate-6 items-center gap-2 rounded-full border border-white/15 bg-[#ffffff0a] px-4 py-2 text-[11px] text-[#edcf92]"><Sparkles size={13} /> A little wonder</span>
        <CatalogHero />
        <span className="absolute bottom-0 left-0 flex -rotate-3 items-center gap-3 rounded-2xl border border-white/60 bg-[#fffaf0] px-4 py-3 text-[#244a3e] shadow-xl sm:bottom-2 sm:left-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7e8d5]"><Heart size={16} className="text-[#bf8267]" /></span><span className="text-xs font-semibold">Stories that feel like you<span className="mt-1 block text-[10px] font-normal text-[#7e8c7e]">A new chapter, a new possibility</span></span></span>
        <Leaf size={35} strokeWidth={1} className="absolute bottom-4 right-0 rotate-[-25deg] text-[#edcf92]/50" />
      </div>
    </section>

    <section className="py-10 sm:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="emo-eyebrow">A moment for yourself</p><h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">How does today <span className="font-serif italic text-teal-700">feel?</span></h2></div><p className="text-xs leading-6 text-slate-500">Pick a feeling. We&apos;ll start from there.</p></div>
      <MoodStart />
    </section>

    <section className="border-y border-[#e0e6dc] py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[.85fr_2fr] lg:gap-14"><div><p className="emo-eyebrow">Made for your reading journey</p><h2 className="mt-3 text-3xl font-medium leading-tight tracking-tight">A little check-in.<br /><span className="font-serif italic text-teal-700">A whole new chapter.</span></h2><Link href="/emobooks/about" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-teal-800">Meet your reading compass <ArrowRight size={15} /></Link></div><div className="grid gap-6 sm:grid-cols-3">{[
        { icon: Heart, title: "Start with a feeling", text: "Choose the emotion closest to your day. There is no right or wrong answer." },
        { icon: Leaf, title: "Choose a direction", text: "Stay with your feeling or explore a different emotional goal." },
        { icon: Bookmark, title: "Keep a good story", text: "Explore your matches, find a favourite, and save it for another day." },
      ].map((item, index) => <div key={item.title}><div className="mb-4 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dce5da] bg-[#edf2e9] text-teal-700"><item.icon size={20} strokeWidth={1.5} /></span><span className="font-serif text-2xl italic text-[#bac9b7]">0{index + 1}</span></div><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{item.text}</p></div>)}</div></div>
    </section>

    <section className="py-10 sm:py-14">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="emo-eyebrow">A glimpse of the bookshelf</p><h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">Different stories. <span className="font-serif italic text-teal-700">Different worlds.</span></h2><p className="mt-3 text-xs leading-6 text-slate-500">Stories from our book catalog, ready to explore.</p></div><Link href="/emobooks/discover" className="inline-flex items-center gap-2 text-xs font-semibold text-teal-800">Find my matches <ArrowUpRight size={16} /></Link></div>
      <CatalogPreview />
    </section>

    <section className="flex flex-col items-start justify-between gap-6 rounded-[1.5rem] border border-[#e4ddc9] bg-[#f0ecdf] px-7 py-9 sm:flex-row sm:items-center sm:px-10"><div><p className="emo-eyebrow">For the stories you come back to</p><h2 className="mt-3 text-2xl font-medium tracking-tight">Your own little <span className="font-serif italic text-teal-700">reading corner.</span></h2><p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">Save the books that catch your eye. They&apos;ll be here when the moment feels right.</p></div><Link href="/emobooks/saved" className="emo-primary shrink-0"><Bookmark size={16} /> My bookshelf <ArrowRight size={16} /></Link></section>
  </>;
}
