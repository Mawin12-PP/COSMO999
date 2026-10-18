import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import { Spade } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

// Prompt is the primary typeface. It carries full Thai + Latin support.
const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "COSMO999",
  description: "กระดานนับแต้มไพ่ดัมมี่สำหรับวงเพื่อน เล่นเพื่อความบันเทิง",
};

// viewportFit: "cover" lets the header and bottom tab bar pad themselves
// past the notch and home indicator on iPhones via env(safe-area-inset-*).
export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={prompt.variable} suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--text-primary)] antialiased selection:bg-[#007AFF]/20 transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-dvh bg-[var(--background)] md:flex">
            <AppNav />

            <div className="flex min-h-dvh flex-1 flex-col">
              {/* iOS Frosted Glass Header */}
              <header className="reveal sticky top-0 z-50 border-b border-black/[0.04] dark:border-[#38383A] bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-b from-[#2E8BFF] to-[#007AFF] text-white shadow-lg shadow-blue-500/25">
                      <Spade className="size-5" />
                    </span>
                    <div className="leading-tight">
                      <p className="text-lg font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">COSMO999</p>
                      <p className="text-xs font-medium text-[#8E8E93] dark:text-[#98989D]">โต๊ะไพ่ดัมมี่</p>
                    </div>
                  </div>

                  {/* Mobile header theme toggle (sidebar toggle is visible on tablet/desktop) */}
                  <div className="md:hidden">
                    <ThemeToggle />
                  </div>
                </div>
              </header>

              {/* Main content with bottom clearance for fixed tab bar + home indicator */}
              <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pt-6 md:pb-12">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
