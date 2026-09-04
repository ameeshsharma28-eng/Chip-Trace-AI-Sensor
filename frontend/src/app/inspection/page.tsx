"use client";

import { useState } from "react";
import { Upload, AlertTriangle, CheckCircle, Cpu, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { batches } from "@/lib/mockData";

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
        batchId: batches[0].id,
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
        batchId: batches[0].id,
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
        <Card className="col-span-2 bg-white/[0.01] border-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Inspection Viewport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-white/20 rounded-lg h-[500px] flex flex-col items-center justify-center bg-black/20 relative overflow-hidden">
              {!analyzing && !result && (
                <label className="text-center cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center p-10 w-full h-full justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 border border-primary/30 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-white/90">Tap to Scan or Upload Image</h3>
                  <p className="text-sm text-muted-foreground mt-2">Camera will open on mobile devices</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG (Max 5MB)</p>
                </label>
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
