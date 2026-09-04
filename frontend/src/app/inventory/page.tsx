"use client";

import { useState } from "react";
import { Box, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inventory } from "@/lib/mockData";

export default function InventoryPage() {
  const [selectedItem, setSelectedItem] = useState(inventory[0]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Predictive demand forecasting and stockout prevention.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tracked SKUs</h3>
          {inventory.map(item => (
            <Card 
              key={item.sku} 
              className={`cursor-pointer transition-colors ${selectedItem.sku === item.sku ? 'border-primary shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedItem(item)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-sm font-bold text-primary">{item.sku}</div>
                  {item.stockoutProbability > 50 && (
                    <Badge variant="destructive">Risk</Badge>
                  )}
                </div>
                <div className="text-sm font-medium mb-3">{item.name}</div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Stock: {item.currentStock.toLocaleString()}</span>
                  <span>Demand (30d): {item.predictedDemand30d.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card>
               <CardContent className="p-4">
                 <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
                 <h3 className="text-2xl font-bold">{selectedItem.currentStock.toLocaleString()}</h3>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-4">
                 <p className="text-xs text-muted-foreground mb-1">Reserved / Incoming</p>
                 <h3 className="text-2xl font-bold">{selectedItem.reserved.toLocaleString()} / {selectedItem.incoming.toLocaleString()}</h3>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-4 bg-primary/10 border-primary/20">
                 <p className="text-xs text-primary mb-1">30-Day Demand Forecast</p>
                 <h3 className="text-2xl font-bold text-primary">{selectedItem.predictedDemand30d.toLocaleString()}</h3>
               </CardContent>
             </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Stockout Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 items-center border-b border-border pb-6 mb-6">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Stockout Probability</span>
                    <span className={`font-bold ${selectedItem.stockoutProbability > 50 ? 'text-destructive' : 'text-green-500'}`}>
                      {selectedItem.stockoutProbability}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${selectedItem.stockoutProbability > 50 ? 'bg-destructive' : 'bg-green-500'}`} 
                      style={{ width: `${selectedItem.stockoutProbability}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg flex-1 ${selectedItem.stockoutProbability > 50 ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' : 'bg-green-500/10 border border-green-500/20 text-green-500'}`}>
                   <div className="flex items-center gap-2 font-bold mb-1">
                     {selectedItem.stockoutProbability > 50 ? <AlertTriangle className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                     AI Recommendation
                   </div>
                   <p className="text-sm opacity-90">{selectedItem.recommendation}</p>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="h-64 w-full bg-secondary/30 rounded-lg border border-border flex flex-col items-center justify-center p-4">
                 <TrendingUp className="w-8 h-8 text-muted-foreground mb-4 opacity-50" />
                 <p className="text-sm text-muted-foreground">Inventory vs Demand Forecast Chart (Recharts rendering here)</p>
                 
                 {/* CSS mock of a chart line */}
                 <div className="w-full h-32 mt-4 relative border-l border-b border-muted-foreground/30 px-2 flex items-end justify-between">
                   {[100, 90, 85, 70, 60, 40, 20, 5, 0].map((val, i) => (
                     <div key={i} className="w-2 bg-primary/50 rounded-t" style={{ height: `${val}%` }}></div>
                   ))}
                   {[10, 15, 20, 30, 45, 60, 75, 90, 100].map((val, i) => (
                     <div key={`d-${i}`} className="w-2 bg-destructive/50 rounded-t absolute" style={{ height: `${val}%`, left: `${(i/8)*100}%`, transform: 'translateX(8px)' }}></div>
                   ))}
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
