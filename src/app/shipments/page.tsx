"use client";

import { useState, useEffect } from "react";
import { Truck, Map, AlertTriangle, Navigation, Thermometer, Droplets, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/shipments`);
        const data = await res.json();
        setShipments(data);
        if (data.length > 0) setSelectedShipment(data[0]);
      } catch (err) {
        console.error("Failed to load shipments:", err);
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

  if (!selectedShipment) {
    return <div>No shipments available.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Shipments</h1>
        <p className="text-muted-foreground mt-1">
          Real-time global tracking and AI ETA prediction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Transit</h3>
          {shipments.map(ship => (
            <Card 
              key={ship.id} 
              className={`cursor-pointer transition-colors ${selectedShipment.id === ship.id ? 'border-primary shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedShipment(ship)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-sm font-bold">{ship.id}</div>
                  <Badge variant={ship.risk === 'HIGH' ? 'destructive' : 'default'}>{ship.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Truck className="w-3 h-3" /> {ship.carrier}
                </div>
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Origin</span>
                    <span>{ship.origin}</span>
                  </div>
                  <Navigation className="w-3 h-3 text-muted-foreground/50 rotate-90" />
                  <div className="flex flex-col text-right">
                    <span className="text-muted-foreground">Destination</span>
                    <span>{ship.destination}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Shipment Map</span>
                <Badge variant="outline" className="font-mono text-xs">{selectedShipment.id}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="w-full h-[300px] border border-border rounded-lg relative overflow-hidden flex items-center justify-center opacity-80"
                style={{ 
                  backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: '#111'
                }}
              >
                 {/* Map Pin Mock */}
                 <div className="absolute top-[45%] left-[55%] flex flex-col items-center">
                   <div className="w-4 h-4 bg-primary rounded-full animate-ping absolute"></div>
                   <div className="w-4 h-4 bg-primary rounded-full relative z-10 border-2 border-background shadow-[0_0_10px_rgba(6,182,212,1)]"></div>
                   <div className="mt-1 px-2 py-0.5 bg-background/85 backdrop-blur-sm border border-border rounded text-[10px] font-bold text-primary">
                     {selectedShipment.currentLocation}
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI ETA Prediction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b border-border pb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Scheduled ETA</p>
                    <p className="text-lg font-bold">{selectedShipment.eta}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">AI Predicted ETA</p>
                    <p className="text-lg font-bold text-amber-500">{selectedShipment.predictedEta}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Delay Probability</span>
                      <span className="font-bold text-destructive">{selectedShipment.delayProbability}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-destructive" style={{ width: `${selectedShipment.delayProbability}%` }}></div>
                    </div>
                  </div>
                </div>

                {selectedShipment.delayReason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm">
                    <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      Main Risk Factor
                    </div>
                    <p className="text-destructive/80 text-xs">{selectedShipment.delayReason}</p>
                    <p className="text-primary text-xs mt-2 font-medium">Recommended: Consider alternate logistics route.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Telemetrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-md">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Temperature</p>
                      <p className="text-xs text-muted-foreground">Target: 20-25°C</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold">{selectedShipment.temperature}°C</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-md">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Humidity</p>
                      <p className="text-xs text-muted-foreground">Target: 40-50%</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold">{selectedShipment.humidity}%</span>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Batch ID</span>
                    <span className="font-mono text-primary cursor-pointer hover:underline">{selectedShipment.batchId}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
