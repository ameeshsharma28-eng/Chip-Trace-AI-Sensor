"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Cpu,
  Route,
  Truck,
  Box,
  Users,
  AlertTriangle,
  BarChart3,
  Bot,
  Bell,
  FileText,
  Settings,
  Menu,
  X
} from "lucide-react";
import clsx from "clsx";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Chip Inspection", href: "/inspection", icon: Cpu },
  { name: "Batch Traceability", href: "/traceability", icon: Route },
  { name: "Live Shipments", href: "/shipments", icon: Truck },
  { name: "Inventory Intelligence", href: "/inventory", icon: Box },
  { name: "Suppliers", href: "/suppliers", icon: Users },
  { name: "Risk Center", href: "/risk", icon: AlertTriangle },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "AI Copilot", href: "/copilot", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar & Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">ChipTrace</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 -mr-2 text-white/80 hover:text-white">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={clsx(
        "fixed md:relative top-0 left-0 h-full w-64 bg-[#030712]/95 md:bg-[#030712]/50 backdrop-blur-2xl border-r border-white/[0.05] p-4 flex flex-col z-50 transition-transform duration-300 ease-in-out pt-16 md:pt-4",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="hidden md:flex items-center gap-3 mb-8 px-2 mt-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">ChipTrace</span>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto pb-4 hide-scrollbar">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "text-white bg-white/[0.08]"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full shadow-[0_0_10px_var(--color-primary)]" />
                )}
                <item.icon className={clsx("w-5 h-5 md:w-4 md:h-4 flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white/80")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto border-t border-white/[0.05] pt-4 pb-2 md:pb-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer">
            <div className="w-10 h-10 md:w-8 md:h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-white/80 text-xs font-bold shadow-inner">
              SC
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white/90 truncate">Supply Chain Mgr</span>
              <span className="text-xs text-muted-foreground truncate">Manufacturer</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
