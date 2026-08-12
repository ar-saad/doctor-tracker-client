import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

/**
 * Inter is the app's one sans face. next/font self-hosts it (no request to
 * Google at runtime, no layout shift) and exposes it as --font-inter, which
 * globals.css maps onto Tailwind's font-sans and font-heading.
 *
 * The variable is deliberately NOT called --font-sans: that name is already the
 * Tailwind theme key, and defining both on :root leaves which one wins up to
 * stylesheet order. The indirection is the same one shadcn uses for colours.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Pages set only their own name; the template appends the app name.
  title: {
    default: "Doctor Tracker",
    template: "%s — Doctor Tracker",
  },
  description:
    "Admin dashboard for managing doctors, their patients, and registration analytics.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        {/* Mounted once here so any page can just call toast() — Phase 7 onwards. */}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
