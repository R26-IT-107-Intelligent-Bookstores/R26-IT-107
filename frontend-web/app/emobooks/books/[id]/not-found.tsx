import Link from "next/link";

export default function BookNotFound() {
  return <div className="emo-panel p-12 text-center"><h1 className="text-2xl font-semibold">This book is not on our catalog.</h1><p className="my-5 text-sm text-slate-500">Explore your recommendations to find another story.</p><Link href="/emobooks/discover" className="emo-primary">Find my next read</Link></div>;
}
