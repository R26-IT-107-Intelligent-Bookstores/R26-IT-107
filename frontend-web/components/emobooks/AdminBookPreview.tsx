"use client";

import Image from "next/image";
import { useState } from "react";
import { BookOpen } from "lucide-react";

type PreviewBook = { title: string; author: string; description: string; cover_url: string };

function Cover({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const valid = src.startsWith("https://") || src.startsWith("http://") || (src.startsWith("/") && !src.startsWith("//"));
  return <div className="relative flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-teal-50 text-teal-700">
    {!failed && valid ? <Image src={src} alt={`Cover of ${title || "your book"}`} unoptimized fill sizes="80px" className="object-contain" onError={() => setFailed(true)} /> : <BookOpen size={28} strokeWidth={1.5} />}
  </div>;
}

export default function AdminBookPreview({ book }: { book: PreviewBook }) {
  return <div className="flex items-start gap-4">
    <Cover key={book.cover_url} src={book.cover_url} title={book.title} />
    <div className="min-w-0"><h3 className="break-words text-base font-semibold leading-6">{book.title.trim() || "Your book title"}</h3><p className="mt-1 text-xs text-slate-500">{book.author.trim() || "Author name"}</p><p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">{book.description.trim() || "The short introduction readers will see appears here."}</p></div>
  </div>;
}
