import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EmoBooks | Add a book",
  description: "Add a book, analyse its story emotion, and save it to the EmoBooks catalog.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Grammarly adds body attributes before hydration; keep this exception scoped to body.
  return <html lang="en"><body suppressHydrationWarning className="min-h-screen bg-white font-sans text-[#042f2e] antialiased">{children}</body></html>;
}
