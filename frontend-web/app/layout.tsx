"use client"; // Required for client-side hooks like usePathname in Next.js App Router

import Navbar from "../components/Navbar";
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
      </body>
    </html>
  );
}