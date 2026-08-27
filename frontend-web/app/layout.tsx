"use client"; // Required for client-side hooks like usePathname in Next.js App Router

import Navbar from "../components/Navbar";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation"; // Hook to detect the current URL route
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // Get the current active pathname from the browser URL
  const pathname = usePathname(); 

  // Check if the current route belongs to the TrendStock module (Teammate's section)
  const isTrendStockPage = 
    pathname === "/trendstock" ||
    pathname.startsWith("/trendstock/") || 
    pathname.startsWith("/books") || 
    pathname.startsWith("/branches") || 
    pathname.startsWith("/inventory") || 
    pathname.startsWith("/sales");

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        
        {/* Conditionally render the TrendStock navigation bar only on TrendStock-related routes */}
        {isTrendStockPage && <Navbar />}
        
        {children}

        <footer className="border-t border-teal-900/10 bg-teal-50/70 px-6 py-8 text-sm text-teal-950/70">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Intelligent Bookstore</p>
            <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2 font-medium">
              <Link href="/" className="transition-colors hover:text-teal-800">Discover</Link>
              <Link href="/login" className="transition-colors hover:text-teal-800">Sign In</Link>
              <Link href="/signup" className="transition-colors hover:text-teal-800">Create Account</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}