"use client";

import { useState, useEffect } from "react";
import { Users, TrendingDown, Star, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/suppliers`);
        const data = await res.json();
        setSuppliers(data);
      } catch (err) {
        console.error("Failed to load suppliers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supplier Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Performance, quality scores, and reliability metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="p-4 flex items-center gap-4">
             <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
               <Star className="w-6 h-6" />
             </div>
             <div>
               <p className="text-xs text-muted-foreground">Best Supplier</p>
               <p className="font-bold">Silicon Base Inc</p>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-4 flex items-center gap-4">
             <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
               <TrendingDown className="w-6 h-6" />
             </div>
             <div>
               <p className="text-xs text-muted-foreground">Highest Defect Rate</p>
               <p className="font-bold">NexGen (5.4%)</p>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-4 flex items-center gap-4">
             <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
               <Clock className="w-6 h-6" />
             </div>
             <div>
               <p className="text-xs text-muted-foreground">Most Delayed</p>
               <p className="font-bold">NexGen (4.5d)</p>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-4 flex items-center gap-4">
             <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
               <Users className="w-6 h-6" />
             </div>
             <div>
               <p className="text-xs text-muted-foreground">Total Active Suppliers</p>
               <p className="font-bold">20</p>
             </div>
           </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-secondary/50 uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">Supplier</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">AI Score</th>
                  <th className="px-6 py-3">Defect Rate</th>
                  <th className="px-6 py-3">Avg Delay</th>
                  <th className="px-6 py-3 rounded-tr-lg">Reliability</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.sort((a,b) => b.score - a.score).map((sup, i) => (
                  <tr key={sup.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <div>{sup.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{sup.id}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{sup.location}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${sup.score >= 90 ? 'text-green-500' : sup.score >= 70 ? 'text-amber-500' : 'text-destructive'}`}>
                          {sup.score}/100
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{sup.defectRate}%</td>
                    <td className="px-6 py-4">{sup.avgDelayDays} days</td>
                    <td className="px-6 py-4">
                      <Badge variant={sup.reliability === 'HIGH' || sup.reliability === 'VERY HIGH' ? 'success' : sup.reliability === 'MEDIUM' ? 'warning' : 'destructive'}>
                        {sup.reliability}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
