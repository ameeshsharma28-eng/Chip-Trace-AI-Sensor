"use client";

import React, { useState } from "react";
import { Upload, AlertTriangle, CheckCircle, Cpu, Ban, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Detection = {
  type: string;
  confidence: number | null;
  bbox: number[];
  source?: string;
};

type InspectResult = {
  status: string;
  confidence: number | null;
  confidence_band?: string | null;
  defects: string[];
  detections: Detection[];
  image_quality?: string;
  recommendation?: string;
  reason?: string;
  error?: string | null;
  annotated_image?: string | null;
  explanation_image?: string | null;
  batchId: string;
  timestamp: string;
};

function formatConfidence(conf: number | null | undefined) {
  if (conf === null || conf === undefined || Number.isNaN(Number(conf))) {
    return "N/A";
  }
  return `${(Number(conf) * 100).toFixed(1)}%`;
}

function statusStyle(status: string) {
  if (status === "DEFECT") return "text-red-500";
  if (status === "MANUAL") return "text-amber-500";
  if (status === "INSPECTION_UNAVAILABLE") return "text-zinc-300";
  return "text-emerald-500";
}

export default function AIInspectionPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<InspectResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showExplain, setShowExplain] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (e) {
      console.error("Camera access failed", e);
      alert("Unable to access camera. Please check your permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const captureAndAnalyze = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            const reader = new FileReader();
            reader.onloadend = () => {
              setUploadedImage(reader.result as string);
              stopCamera();
              startAnalysis(file);
            };
            reader.readAsDataURL(blob);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        startAnalysis(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async (file: File) => {
    setAnalyzing(true);
    setResult(null);
    setShowExplain(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/analyze-chip`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const status = data.status === "INSPECTION_UNAVAILABLE" || data.error
        ? (data.status || "INSPECTION_UNAVAILABLE")
        : data.status;

      setResult({
        ...data,
        status,
        confidence: data.confidence === null || data.confidence === undefined ? null : Number(data.confidence),
        defects: Array.isArray(data.defects) ? data.defects : [],
        detections: Array.isArray(data.detections) ? data.detections : [],
        batchId: "BATCH-2026-004821",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      setResult({
        status: "INSPECTION_UNAVAILABLE",
        confidence: null,
        defects: [],
        detections: [],
        image_quality: "UNKNOWN",
        batchId: "BATCH-2026-004821",
        timestamp: new Date().toISOString(),
        error: "Backend connection failed",
        recommendation: "Inspection unavailable. Ensure the FastAPI backend is running on port 8000.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const resetView = () => {
    setResult(null);
    setUploadedImage(null);
    setShowExplain(false);
    setShowCamera(false);
  };

  const viewportSrc = showExplain && result?.explanation_image
    ? `data:image/jpeg;base64,${result.explanation_image}`
    : result?.annotated_image
      ? `data:image/jpeg;base64,${result.annotated_image}`
      : uploadedImage;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Chip Inspection</h1>
        <p className="text-muted-foreground mt-1">
          Hybrid computer-vision inspection: localization, defect detection, anomaly scoring.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 bg-white/[0.01] border-white/5 backdrop-blur-xl flex flex-col">
          <CardHeader>
            <CardTitle>Inspection Viewport</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="border-2 border-dashed border-white/20 rounded-lg flex-1 min-h-[500px] flex flex-col items-center justify-center bg-black/20 relative overflow-hidden">
              
              {!analyzing && !result && !showCamera && (
                <div className="flex flex-col items-center justify-center space-y-6 p-8">
                  <div className="flex flex-col md:flex-row gap-6 w-full max-w-md justify-center">
                    {/* Live Camera Button */}
                    <button 
                      onClick={startCamera}
                      className="flex-1 flex flex-col items-center justify-center p-6 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="w-7 h-7 text-cyan-400" />
                      </div>
                      <span className="font-semibold text-white/90">Live Camera Scan</span>
                      <span className="text-xs text-muted-foreground mt-1 text-center">Scan chip using device camera</span>
                    </button>

                    {/* Upload Photo Button */}
                    <label className="flex-1 flex flex-col items-center justify-center p-6 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7 text-emerald-400" />
                      </div>
                      <span className="font-semibold text-white/90">Upload Photo</span>
                      <span className="text-xs text-muted-foreground mt-1 text-center">Upload from mobile or desktop</span>
                    </label>
                  </div>
                </div>
              )}

              {showCamera && !analyzing && (
                <div className="absolute inset-0 w-full h-full flex flex-col bg-black">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Camera UI Overlay */}
                  <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50 flex flex-col items-center justify-center">
                    <div className="w-64 h-64 border-2 border-cyan-500/50 relative">
                      {/* Corner markers */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400"></div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400"></div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400"></div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400"></div>
                      {/* Scanning laser */}
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] animate-[pulse_2s_ease-in-out_infinite]" style={{ animationName: 'scan' }} />
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-10 px-4">
                    <button 
                      onClick={stopCamera} 
                      className="px-6 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={captureAndAnalyze} 
                      className="px-8 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Capture & Analyze
                    </button>
                  </div>
                </div>
              )}

              {analyzing && (
                <div className="text-center w-full h-full flex flex-col items-center justify-center relative">
                  {uploadedImage && (
                    <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${uploadedImage})` }} />
                  )}
                  <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4 relative z-10" />
                  <h3 className="text-lg font-medium text-white/90 relative z-10">Running inspection pipeline...</h3>
                  <p className="text-sm text-muted-foreground mt-2 relative z-10">Quality gate, localization, detector, anomaly model</p>
                </div>
              )}

              {result && viewportSrc && (
                <div className="w-full h-full relative p-4 flex items-center justify-center">
                  <img src={viewportSrc} alt="Analyzed Chip" className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    {result.explanation_image && (
                      <button
                        className="px-3 py-2 text-xs bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 text-white/90"
                        onClick={() => setShowExplain((v) => !v)}
                      >
                        {showExplain ? "Detections" : "Explanation"}
                      </button>
                    )}
                    <button className="p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-colors shadow-lg" onClick={resetView}>
                      <Upload className="w-5 h-5 text-white/90" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-center text-muted-foreground py-12">
                Upload or scan an image to see analysis results.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Overall Status</p>
                    <div className="flex items-center gap-2">
                      {result.status === "DEFECT" ? (
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                      ) : result.status === "MANUAL" ? (
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                      ) : result.status === "INSPECTION_UNAVAILABLE" ? (
                        <Ban className="w-6 h-6 text-zinc-300" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      )}
                      <span className={`text-2xl font-bold ${statusStyle(result.status)}`}>
                        {result.status === "DEFECT" ? "DEFECT DETECTED" : result.status.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Confidence</p>
                    <span className="text-2xl font-bold text-white/90">{formatConfidence(result.confidence)}</span>
                    {result.confidence_band && (
                      <p className="text-[10px] text-muted-foreground mt-1">{result.confidence_band}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Detected Defects</p>
                  <div className="flex flex-wrap gap-2">
                    {result.defects.length === 0 ? (
                      <Badge variant="secondary" className="bg-white/5 text-white/70 border-white/10">
                        None detected
                      </Badge>
                    ) : (
                      result.defects.map((d: string) => (
                        <Badge
                          key={d}
                          variant="destructive"
                          className="bg-red-500/20 text-red-400 border-red-500/30"
                        >
                          {d.replaceAll("_", " ")}
                        </Badge>
                      ))
                    )}
                  </div>
                  {result.defects.length === 0 || (result.defects.length === 1 && result.defects[0].toLowerCase() === "none detected") ? (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground border-l-2 border-emerald-500/50 pl-2">
                        <span className="font-semibold text-emerald-400">Good to go:</span> The chip meets all quality standards. No physical defects were detected on the surface or pins.
                      </p>
                    </div>
                  ) : result.defects[0] !== "SYSTEM ERROR" ? (
                    <div className="mt-3 space-y-2">
                      {result.defects.map((d: string) => {
                        if (d.toLowerCase() === "none detected") return null;
                        const descriptions: Record<string, string> = {
                          "crack": "A physical fracture in the semiconductor casing or substrate.",
                          "corrosion": "Chemical degradation, oxidation, or rust on metallic contacts.",
                          "bent_pin": "One or more pins are physically deformed or misaligned.",
                          "broken_pin": "A pin is completely severed or missing from the array.",
                          "scratch": "Surface-level abrasion on the chip exterior.",
                          "burn": "Thermal damage causing discoloration or blistering.",
                          "foreign_material": "Unidentified debris or contamination on the surface.",
                          "unknown_anomaly": "The AI detected an irregular pattern that requires human review."
                        };
                        const desc = descriptions[d.toLowerCase()] || "Anomaly detected on the chip surface.";
                        return (
                          <p key={`desc-${d}`} className="text-xs text-muted-foreground border-l-2 border-red-500/30 pl-2">
                            <span className="font-semibold text-white/70 capitalize">{d.replaceAll("_", " ")}:</span> {desc}
                          </p>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3 text-sm bg-black/20 p-4 rounded-lg border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Image quality</span>
                    <span className="font-mono text-white/80">{result.image_quality || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Batch ID</span>
                    <span className="font-mono text-white/80">{result.batchId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timestamp</span>
                    <span className="text-white/80">{new Date(result.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className={`border p-4 rounded-lg shadow-lg ${
                  result.status === "NORMAL"
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : result.status === "MANUAL" || result.status === "INSPECTION_UNAVAILABLE"
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-red-500/10 border-red-500/20"
                }`}>
                  <p className="text-xs font-bold mb-2 flex items-center gap-2 uppercase tracking-wide text-white/80">
                    <Cpu className="w-4 h-4" /> Recommendation
                  </p>
                  <p className="text-sm text-white/80">{result.recommendation}</p>
                  {result.reason && (
                    <p className="text-xs text-muted-foreground mt-2">{result.reason}</p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Automatically logged to Batch Record {result.batchId}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
