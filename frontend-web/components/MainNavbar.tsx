"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, ShoppingCart } from "lucide-react";
import { connectToFedBook, getFedBookFrontendUrl } from "@/lib/fedBookApi";

export default function MainNavbar() {
  const [loggedUser, setLoggedUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setLoggedUser(localStorage.getItem("username"));
      const role = localStorage.getItem("userRole");
      if (role) setUserRole(role.toLowerCase());
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    setLoggedUser(null);
    window.location.href = "/";
  };

  const handleFedBookConnect = async () => {
    if (!loggedUser) {
      window.location.assign(getFedBookFrontendUrl("/books"));
      return;
    }

    try {
      await connectToFedBook(loggedUser);
    } catch (error) {
      console.error("FedBook connection failed:", error);
    }

    // Note: /sso is a React frontend route, not an API endpoint. Must hit the
    // frontend host (nip.io root), not the api. subdomain.
    window.location.assign(`${getFedBookFrontendUrl("/sso")}?username=${encodeURIComponent(loggedUser)}`);
  };

  return (
    <nav className="sticky top-0 z-50 flex w-full flex-nowrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/95 px-4 py-4 shadow-sm backdrop-blur-md sm:px-6 md:gap-4 md:px-8 lg:px-10">
      <Link href="/" className="flex shrink-0 items-center gap-2 text-teal-800 transition-opacity hover:opacity-90">
        <span className="rounded-lg bg-teal-800 p-2 shadow-sm"><BookOpen className="h-5 w-5 text-white" /></span>
        <span className="text-lg font-bold tracking-tight lg:text-xl">Intelligent Bookstore</span>
      </Link>

      <div className="hidden min-w-0 flex-1 items-center justify-center gap-4 whitespace-nowrap text-sm font-semibold text-gray-600 md:flex lg:gap-5 md:text-base">
        <Link href="/" className="pb-0.5 font-bold text-teal-800">Discover</Link>
        <div className="relative">
          <button
            type="button"
            aria-expanded={categoriesOpen}
            aria-controls="category-menu"
            onClick={() => setCategoriesOpen((isOpen) => !isOpen)}
            className="pb-0.5 transition-colors hover:text-teal-700"
          >
            Categories
          </button>
          {categoriesOpen && (
            <div id="category-menu" className="absolute left-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-md border border-gray-100 bg-white shadow-lg">
              {[
                "Mystery",
                "Psychological Thrillers",
                "Horror",
                "Paranormal",
                "Romance",
                "Drama",
                "Educational",
                "Information Technology",
              ].map((category) => (
                <Link
                  key={category}
                  href={`/book?category=${encodeURIComponent(category)}`}
                  onClick={() => setCategoriesOpen(false)}
                  className="block border-b border-gray-50 px-4 py-3 text-sm font-medium text-gray-700 last:border-b-0 hover:bg-teal-50 hover:text-teal-700"
                >
                  {category}
                </Link>
              ))}
            </div>
          )}
        </div>
        <Link href="/book" className="pb-0.5 transition-colors hover:text-teal-700">Book Details</Link>
        {userRole === "admin" && <Link href="/trendstock" className="pb-0.5 transition-colors hover:text-teal-700">Trendstock</Link>}
        <Link href="http://172.104.167.123:8765/" className="pb-0.5 transition-colors hover:text-teal-700">EmoBooks</Link>
        <button type="button" onClick={handleFedBookConnect} className="pb-0.5 transition-colors hover:text-teal-700">FedBook</button>
      </div>

      <div className="flex shrink-0 items-center gap-2 lg:gap-3">
        <button type="button" aria-label="Notifications" className="relative p-2 text-gray-600 transition-colors hover:text-teal-700">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white">3</span>
        </button>
        <button type="button" aria-label="Shopping cart" className="relative p-2 text-gray-600 transition-colors hover:text-teal-700">
          <ShoppingCart className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white">2</span>
        </button>
        {loggedUser ? (
          <div className="ml-2 flex items-center gap-3">
            <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800">Hi, {loggedUser}</span>
            <button type="button" onClick={handleLogout} className="rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-semibold text-teal-800 transition-colors hover:bg-teal-100 md:text-sm">Log Out</button>
          </div>
        ) : (
          <Link href="/login" className="ml-2 inline-block rounded-full bg-teal-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 md:text-sm">Sign In</Link>
        )}
      </div>
    </nav>
  );
}
