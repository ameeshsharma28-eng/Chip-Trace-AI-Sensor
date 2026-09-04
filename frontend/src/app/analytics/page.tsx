"use client";

import { BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import dynamic from 'next/dynamic';
import { Card, CardContent } from "@/components/ui/card";

// Safely import recharts client-side only to prevent hydration errors
const AnalyticsDashboard = dynamic(() => import("./AnalyticsDashboard").then(mod => mod.default), { 
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-xl">
      <div className="flex flex-col items-center gap-4 opacity-50">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm tracking-wide text-primary uppercase">Loading Telemetry Data...</p>
      </div>
    </div>
  )
});

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Deep-dive metrics across production, quality, and logistics.
          </p>
        </div>
        
        {/* Filter Mock */}
        <div className="flex gap-2 bg-white/[0.03] border border-white/5 p-1 rounded-lg">
          {["7D", "30D", "3M", "YTD"].map((range, i) => (
            <button key={range} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${i === 1 ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/[0.05] hover:text-white'}`}>
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="bg-white/[0.02] border-white/5">
           <CardContent className="p-5 flex items-center gap-4">
             <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><BarChart3 className="w-5 h-5" /></div>
             <div>
               <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Volume</p>
               <h3 className="text-2xl font-bold">142,390</h3>
             </div>
           </CardContent>
         </Card>
         <Card className="bg-white/[0.02] border-white/5">
           <CardContent className="p-5 flex items-center gap-4">
             <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><TrendingUp className="w-5 h-5" /></div>
             <div>
               <p className="text-xs text-muted-foreground uppercase tracking-wide">Yield Improvement</p>
               <h3 className="text-2xl font-bold">+4.2%</h3>
             </div>
           </CardContent>
         </Card>
         <Card className="bg-white/[0.02] border-white/5">
           <CardContent className="p-5 flex items-center gap-4">
             <div className="p-3 bg-red-500/10 rounded-xl text-red-400"><AlertTriangle className="w-5 h-5" /></div>
             <div>
               <p className="text-xs text-muted-foreground uppercase tracking-wide">Critical Defects</p>
               <h3 className="text-2xl font-bold">0.8%</h3>
             </div>
           </CardContent>
         </Card>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
