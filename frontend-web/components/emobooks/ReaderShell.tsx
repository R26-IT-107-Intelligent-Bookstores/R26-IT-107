"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useEmoBooks } from "./EmoBooksProvider";

export default function ReaderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { savedIds, storageNotice } = useEmoBooks();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const updateRole = () => {
      setIsAdmin((localStorage.getItem("userRole") || "").toLowerCase() === "admin");
    };
    updateRole();
    window.addEventListener("storage", updateRole);
    return () => window.removeEventListener("storage", updateRole);
  }, []);

  return <div className="emo-root min-h-screen">
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-4 px-5 py-5 sm:px-8">
        <nav aria-label="EmoBooks navigation" className="flex flex-wrap justify-end gap-2 text-sm">
          <Link href="/emobooks" aria-current={!pathname.startsWith("/emobooks/saved") && !pathname.startsWith("/emobooks/manage") ? "page" : undefined} className="emo-secondary">Find my next read</Link>
          <Link href="/emobooks/saved" aria-current={pathname.startsWith("/emobooks/saved") ? "page" : undefined} className="emo-secondary">My bookshelf ({savedIds.length})</Link>
          {isAdmin && <Link href="/emobooks/manage" aria-current={pathname.startsWith("/emobooks/manage") ? "page" : undefined} className="emo-secondary">Manage books</Link>}
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    {storageNotice && <p role="status" className="mx-auto max-w-7xl px-5 pb-6 text-sm text-amber-800">{storageNotice}</p>}
  </div>;
}
