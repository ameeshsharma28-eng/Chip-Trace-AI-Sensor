import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChipTrace AI",
  description: "Intelligent Semiconductor Supply Chain & Quality Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} flex h-screen overflow-hidden bg-[#030712] text-foreground selection:bg-primary/30`}>
        {/* Ambient background glows */}
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[120px]" />
        </div>
        
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto p-4 pt-20 md:p-8 relative z-0">
          {children}
        </main>
      </body>
    </html>
  );
}
