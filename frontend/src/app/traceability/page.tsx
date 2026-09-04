"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, CheckCircle2, Clock, Truck, Factory, Cpu, Package, Home, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { batches } from "@/lib/mockData";

const STAGES = [
  { id: 1, name: "Raw Material", icon: Box },
  { id: 2, name: "Wafer Fabrication", icon: Factory },
  { id: 3, name: "Wafer Testing", icon: Cpu },
  { id: 4, name: "Packaging", icon: Package },
  { id: 5, name: "Final Testing", icon: CheckCircle2 },
  { id: 6, name: "Warehouse", icon: Home },
  { id: 7, name: "Shipping", icon: Truck },
  { id: 8, name: "Customer Delivery", icon: MapPin },
];

// Re-defining Box here or importing from lucide-react. Let's fix imports.
import { Box } from "lucide-react";

import jsQR from "jsqr";

export default function TraceabilityPage() {
  const [search, setSearch] = useState("BATCH-2026-004821");
  const [batch, setBatch] = useState<any>(batches[0]);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let requestID: number;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    if (isScanning) {
      canvas = document.createElement("canvas");
      ctx = canvas.getContext("2d", { willReadFrequently: true });

      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.setAttribute("playsinline", "true");
            videoRef.current.play();
            
            const tick = () => {
              if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && ctx) {
                canvas.height = videoRef.current.videoHeight;
                canvas.width = videoRef.current.videoWidth;
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "dontInvert",
                });
                
                if (code && code.data) {
                  // Found a QR code!
                  setIsScanning(false);
                  setSearch(code.data);
                  const found = batches.find(b => b.id.toLowerCase() === code.data.toLowerCase());
                  setBatch(found || null);
                  return; // Stop ticking
                }
              }
              requestID = requestAnimationFrame(tick);
            };
            requestID = requestAnimationFrame(tick);
          }
        })
        .catch(err => console.error("Camera error:", err));
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestID) {
        cancelAnimationFrame(requestID);
      }
    };
  }, [isScanning]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = batches.find(b => b.id.toLowerCase().includes(search.toLowerCase()));
    setBatch(found || null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Batch Traceability</h1>
        <p className="text-muted-foreground mt-1">
          End-to-end lineage and location tracking for every batch.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 flex gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                list="batch-suggestions"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by Batch ID, QR Code, or Digital ID..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <datalist id="batch-suggestions">
                {batches.map(b => (
                  <option key={b.id} value={b.id} />
                ))}
              </datalist>
            </div>
            <button type="button" onClick={() => setIsScanning(true)} className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-md text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
              <QrCode className="w-4 h-4" /> Scan QR
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              Trace Batch
            </button>
          </form>
        </CardContent>
      </Card>

      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#030712] border border-white/10 p-6 rounded-xl w-full max-w-sm flex flex-col items-center shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-white">Scan Batch QR Code</h3>
            <div className="w-64 h-64 border-2 border-primary/50 rounded-lg relative overflow-hidden bg-black flex items-center justify-center">
               <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
               <div className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-primary/30 to-transparent animate-pulse pointer-events-none" />
               <div className="absolute top-[20%] left-0 w-full h-[2px] bg-primary shadow-[0_0_15px_rgba(14,165,233,1)] animate-pulse pointer-events-none" />
               
               {/* Corner brackets for targeting */}
               <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-white/50 rounded-tl-lg pointer-events-none"></div>
               <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-white/50 rounded-tr-lg pointer-events-none"></div>
               <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-white/50 rounded-bl-lg pointer-events-none"></div>
               <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-white/50 rounded-br-lg pointer-events-none"></div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 mb-6">Hold a QR code up to your camera to scan</p>
            <div className="flex gap-4 w-full">
              <button onClick={() => setIsScanning(false)} className="flex-1 py-2 rounded-md border border-white/10 hover:bg-white/5 text-sm text-white">Cancel Scanning</button>
            </div>
          </div>
        </div>
      )}

      {!batch ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
             No batch found matching "{search}". Try searching for BATCH-2026-004821.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Traceability Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 border-l-2 border-border ml-4 space-y-8 pb-4">
                  {STAGES.map((stage, i) => {
                    const isCompleted = stage.id < batch.currentStage;
                    const isCurrent = stage.id === batch.currentStage;
                    const isPending = stage.id > batch.currentStage;
                    
                    return (
                      <div key={stage.id} className={`relative ${isPending ? 'opacity-40' : ''}`}>
                        <div className={`absolute -left-[35px] p-1.5 rounded-full border-2 bg-background
                          ${isCompleted ? 'border-primary text-primary' : 
                            isCurrent ? 'border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 
                            'border-border text-muted-foreground'}`}>
                          <stage.icon className="w-4 h-4" />
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`text-sm font-bold ${isCurrent ? 'text-amber-500' : ''}`}>{stage.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {isCompleted ? "Completed" : isCurrent ? "In Progress" : "Pending"}
                            </p>
                          </div>
                          {isCompleted && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">2026-08-{20 + i}</p>
                              <Badge variant="success" className="mt-1 h-5 text-[10px]">PASS</Badge>
                            </div>
                          )}
                          {isCurrent && (
                            <div className="text-right">
                              <p className="text-xs text-amber-500">ETA: {batch.eta}</p>
                              <Badge variant="warning" className="mt-1 h-5 text-[10px]">IN TRANSIT</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Batch Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Batch ID</span>
                  <span className="font-mono font-medium">{batch.id}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Chip Type</span>
                  <span className="font-medium">{batch.chipType}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{batch.quantity.toLocaleString()} units</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Supplier</span>
                  <span className="font-medium text-primary hover:underline cursor-pointer">{batch.supplierId}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground">Risk Level</span>
                  <Badge variant={batch.riskLevel === 'HIGH' ? 'destructive' : batch.riskLevel === 'MEDIUM' ? 'warning' : 'success'}>
                    {batch.riskLevel}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Digital QR</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pb-8">
                <div className="w-40 h-40 bg-white rounded-lg p-2 flex flex-col items-center justify-center border-4 border-muted">
                   <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover opacity-80 mix-blend-multiply"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
