"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Cpu, Camera, Activity, Bell, Shield, Database, 
  User, Check, AlertTriangle, Info, Save, X, RotateCcw, 
  Monitor, Layout, Server, HardDrive, Download, Trash2, SlidersHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Reusable UI Components
const ToggleRow = ({ title, description, checked, onChange }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div className="space-y-0.5">
      <div className="text-sm font-medium text-white/90">{title}</div>
      {description && <div className="text-xs text-muted-foreground">{description}</div>}
    </div>
    <button 
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-cyan-500' : 'bg-gray-700'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  </div>
);

const SelectRow = ({ title, description, value, options, onChange }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div className="space-y-0.5">
      <div className="text-sm font-medium text-white/90">{title}</div>
      {description && <div className="text-xs text-muted-foreground">{description}</div>}
    </div>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="bg-gray-900 border border-white/10 rounded-md text-sm text-white/90 px-3 py-1.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
    >
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const SliderRow = ({ title, description, value, min, max, onChange, unit }: any) => (
  <div className="py-3 border-b border-white/5 last:border-0">
    <div className="flex items-center justify-between mb-2">
      <div className="space-y-0.5">
        <div className="text-sm font-medium text-white/90">{title}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
      <div className="text-sm font-semibold text-cyan-400">{value}{unit}</div>
    </div>
    <input 
      type="range" min={min} max={max} value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
    />
  </div>
);

const InputRow = ({ title, description, value, onChange, placeholder }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div className="space-y-0.5">
      <div className="text-sm font-medium text-white/90">{title}</div>
      {description && <div className="text-xs text-muted-foreground">{description}</div>}
    </div>
    <input 
      type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="bg-gray-900 border border-white/10 rounded-md text-sm text-white/90 px-3 py-1.5 w-64 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
    />
  </div>
);

const defaultSettings = {
  ai: {
    defectDetection: true,
    model: "ChipDefect-Vision v2.4",
    confidenceThreshold: 85,
    sensitivity: "High",
    autoClassify: true,
    autoSeverity: true,
    realtime: true,
    enhancement: true,
  },
  categories: {
    crack: { enabled: true, severity: "Critical" },
    scratch: { enabled: true, severity: "Low" },
    chipped_edge: { enabled: true, severity: "Medium" },
    missing_component: { enabled: true, severity: "Critical" },
    misalignment: { enabled: true, severity: "High" },
    solder_defect: { enabled: true, severity: "High" },
    burn_mark: { enabled: true, severity: "Critical" },
    contamination: { enabled: true, severity: "Medium" },
    surface_damage: { enabled: true, severity: "Low" },
    packaging_damage: { enabled: true, severity: "Low" },
  },
  vision: {
    resolution: "1920x1080",
    format: "PNG",
    minQuality: 80,
    lightingComp: true,
    autoFocus: true,
    preprocessing: true,
    blurDetection: true
  },
  decisions: {
    autoMarkFailed: true,
    requireHumanVerify: true
  },
  traceability: {
    autoGenBatch: true,
    autoGenChip: true,
    qrTracking: true,
    serialTracking: true,
    dateTracking: true,
    supplierTracking: true,
    locationTracking: true,
    retention: true,
    batchFormat: "CT-{YYYY}-{MM}-{XXXX}",
    chipFormat: "CHIP-{BATCH}-{SERIAL}"
  },
  notifications: {
    criticalDefect: { inApp: true, email: true, push: true },
    batchFailure: { inApp: true, email: true, push: true },
    aiComplete: { inApp: true, email: false, push: false },
    highDefectRate: { inApp: true, email: true, push: false },
    shipmentDelay: { inApp: true, email: true, push: true },
    inventoryAlert: { inApp: true, email: false, push: false },
    supplierRisk: { inApp: true, email: true, push: false },
    systemError: { inApp: true, email: true, push: true },
  },
  thresholds: {
    defectRate: 5,
    criticalDefects: 1,
    batchFailure: 10,
    lowStock: 100,
    shipmentDelay: 24
  },
  data: {
    autoBackup: true,
    cloudSync: true,
    retentionDays: "90 days",
    auditLogs: true
  },
  appearance: {
    theme: "Dark",
    density: "Comfortable",
    sidebar: "Expanded"
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [savedSettings, setSavedSettings] = useState(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const local = localStorage.getItem("chiptrace_settings");
    if (local) {
      const parsed = JSON.parse(local);
      setSettings(parsed);
      setSavedSettings(parsed);
    }
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(savedSettings));
  }, [settings, savedSettings]);

  const updateSection = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [key]: value
      }
    }));
  };

  const updateCategory = (key: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [key]: {
          ...(prev.categories as any)[key],
          [field]: value
        }
      }
    }));
  };

  const updateNotification = (key: string, channel: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: {
          ...(prev.notifications as any)[key],
          [channel]: value
        }
      }
    }));
  };

  const handleSave = () => {
    localStorage.setItem("chiptrace_settings", JSON.stringify(settings));
    setSavedSettings(settings);
    setHasChanges(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleReset = () => {
    setSettings(savedSettings);
  };

  const tabs = [
    { id: "ai", label: "AI & Vision", icon: <Cpu className="w-4 h-4" /> },
    { id: "trace", label: "Traceability", icon: <Database className="w-4 h-4" /> },
    { id: "alerts", label: "Alerts & Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "users", label: "Users & Access", icon: <Shield className="w-4 h-4" /> },
    { id: "system", label: "System & Data", icon: <Server className="w-4 h-4" /> },
    { id: "account", label: "Account", icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full min-h-screen pb-24 text-white/90 bg-background">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-cyan-400" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure AI inspection, system preferences, traceability, notifications and account settings.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          System Operational
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation Sidebar */}
        <nav className="flex flex-row lg:flex-col gap-1 w-full lg:w-64 overflow-x-auto lg:overflow-x-visible shrink-0 pb-2 lg:pb-0 hide-scrollbar sticky top-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 w-full space-y-6">
          
          {/* TAB: AI & VISION */}
          {activeTab === "ai" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    AI Inspection Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ToggleRow title="Defect Detection" checked={settings.ai.defectDetection} onChange={(v:any) => updateSection('ai', 'defectDetection', v)} />
                  <SelectRow title="AI Model" value={settings.ai.model} options={["ChipDefect-Vision v2.4", "High Accuracy"]} onChange={(v:any) => updateSection('ai', 'model', v)} />
                  <SliderRow title="Detection Confidence Threshold" description="Lower confidence thresholds detect more potential defects but may increase false positives." value={settings.ai.confidenceThreshold} min={50} max={99} unit="%" onChange={(v:any) => updateSection('ai', 'confidenceThreshold', v)} />
                  <SelectRow title="Inspection Sensitivity" value={settings.ai.sensitivity} options={["Low", "Medium", "High"]} onChange={(v:any) => updateSection('ai', 'sensitivity', v)} />
                  <ToggleRow title="Automatic Defect Classification" checked={settings.ai.autoClassify} onChange={(v:any) => updateSection('ai', 'autoClassify', v)} />
                  <ToggleRow title="Automatic Severity Detection" checked={settings.ai.autoSeverity} onChange={(v:any) => updateSection('ai', 'autoSeverity', v)} />
                  <ToggleRow title="Real-time Inspection" checked={settings.ai.realtime} onChange={(v:any) => updateSection('ai', 'realtime', v)} />
                  <ToggleRow title="Image Enhancement Before Inspection" checked={settings.ai.enhancement} onChange={(v:any) => updateSection('ai', 'enhancement', v)} />
                </CardContent>
              </Card>

              <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-cyan-400" />
                    Defect Detection Categories
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Configure which anomalies the AI should scan for.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(settings.categories).map(([key, data]: [string, any]) => (
                      <div key={key} className="p-3 border border-white/5 rounded-lg bg-black/20 flex items-center justify-between hover:border-cyan-500/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={data.enabled} onChange={(e) => updateCategory(key, 'enabled', e.target.checked)} className="accent-cyan-500 w-4 h-4 cursor-pointer" />
                          <span className="text-sm font-medium capitalize text-white/80">{key.replace('_', ' ')}</span>
                        </div>
                        <select 
                          value={data.severity} onChange={(e) => updateCategory(key, 'severity', e.target.value)}
                          className={`text-xs px-2 py-1 rounded bg-gray-900 border outline-none ${data.severity === 'Critical' ? 'border-red-500/30 text-red-400' : data.severity === 'High' ? 'border-orange-500/30 text-orange-400' : data.severity === 'Medium' ? 'border-amber-500/30 text-amber-400' : 'border-emerald-500/30 text-emerald-400'}`}
                        >
                          <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Camera className="w-5 h-5 text-cyan-400" />
                      Computer Vision Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <SelectRow title="Camera Resolution" value={settings.vision.resolution} options={["1280 × 720", "1920 × 1080", "3840 × 2160"]} onChange={(v:any) => updateSection('vision', 'resolution', v)} />
                    <SelectRow title="Image Format" value={settings.vision.format} options={["PNG", "JPG"]} onChange={(v:any) => updateSection('vision', 'format', v)} />
                    <SliderRow title="Minimum Image Quality" value={settings.vision.minQuality} min={50} max={100} unit="%" onChange={(v:any) => updateSection('vision', 'minQuality', v)} />
                    <ToggleRow title="Lighting Compensation" checked={settings.vision.lightingComp} onChange={(v:any) => updateSection('vision', 'lightingComp', v)} />
                    <ToggleRow title="Auto Focus" checked={settings.vision.autoFocus} onChange={(v:any) => updateSection('vision', 'autoFocus', v)} />
                    <ToggleRow title="Image Preprocessing" checked={settings.vision.preprocessing} onChange={(v:any) => updateSection('vision', 'preprocessing', v)} />
                    <ToggleRow title="Blur Detection" checked={settings.vision.blurDetection} onChange={(v:any) => updateSection('vision', 'blurDetection', v)} />
                    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-md">
                      <Check className="w-4 h-4" /> Camera Ready
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      Quality Control Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mb-6">
                      <div className="flex gap-4 items-start p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="font-bold text-emerald-400 w-16">PASS</div>
                        <div className="text-sm text-emerald-100/70">Defect confidence &lt; configured threshold</div>
                      </div>
                      <div className="flex gap-4 items-start p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="font-bold text-amber-400 w-16">REVIEW</div>
                        <div className="text-sm text-amber-100/70">Medium-risk defect detected</div>
                      </div>
                      <div className="flex gap-4 items-start p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="font-bold text-red-400 w-16">FAIL</div>
                        <div className="text-sm text-red-100/70">Critical/high-severity defect detected</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <ToggleRow title="Automatically mark failed chips" checked={settings.decisions.autoMarkFailed} onChange={(v:any) => updateSection('decisions', 'autoMarkFailed', v)} />
                      <ToggleRow title="Require human verification for critical defects" checked={settings.decisions.requireHumanVerify} onChange={(v:any) => updateSection('decisions', 'requireHumanVerify', v)} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB: TRACEABILITY */}
          {activeTab === "trace" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    Batch & Traceability
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Configure auto-generation patterns and tracking scope.</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <InputRow title="Batch ID Format" value={settings.traceability.batchFormat} onChange={(v:any) => updateSection('traceability', 'batchFormat', v)} />
                  <InputRow title="Chip ID Format" value={settings.traceability.chipFormat} onChange={(v:any) => updateSection('traceability', 'chipFormat', v)} />
                  <div className="pt-4 border-t border-white/5 mt-4">
                    <ToggleRow title="Auto-generate Batch ID" checked={settings.traceability.autoGenBatch} onChange={(v:any) => updateSection('traceability', 'autoGenBatch', v)} />
                    <ToggleRow title="Auto-generate Chip ID" checked={settings.traceability.autoGenChip} onChange={(v:any) => updateSection('traceability', 'autoGenChip', v)} />
                    <ToggleRow title="QR Code Tracking" checked={settings.traceability.qrTracking} onChange={(v:any) => updateSection('traceability', 'qrTracking', v)} />
                    <ToggleRow title="Serial Number Tracking" checked={settings.traceability.serialTracking} onChange={(v:any) => updateSection('traceability', 'serialTracking', v)} />
                    <ToggleRow title="Production Date Tracking" checked={settings.traceability.dateTracking} onChange={(v:any) => updateSection('traceability', 'dateTracking', v)} />
                    <ToggleRow title="Supplier Tracking" checked={settings.traceability.supplierTracking} onChange={(v:any) => updateSection('traceability', 'supplierTracking', v)} />
                    <ToggleRow title="Manufacturing Location" checked={settings.traceability.locationTracking} onChange={(v:any) => updateSection('traceability', 'locationTracking', v)} />
                    <ToggleRow title="Inspection History Retention" checked={settings.traceability.retention} onChange={(v:any) => updateSection('traceability', 'retention', v)} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: ALERTS & NOTIFICATIONS */}
          {activeTab === "alerts" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5 text-cyan-400" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground border-b border-white/5">
                        <tr>
                          <th className="pb-3 font-medium">Event</th>
                          <th className="pb-3 font-medium text-center">In-App</th>
                          <th className="pb-3 font-medium text-center">Email</th>
                          <th className="pb-3 font-medium text-center">Push Notification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {Object.entries(settings.notifications).map(([key, channels]: [string, any]) => (
                          <tr key={key} className="group hover:bg-white/[0.02]">
                            <td className="py-3 font-medium capitalize text-white/80">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                            <td className="py-3 text-center"><input type="checkbox" checked={channels.inApp} onChange={(e) => updateNotification(key, 'inApp', e.target.checked)} className="accent-cyan-500 w-4 h-4 cursor-pointer" /></td>
                            <td className="py-3 text-center"><input type="checkbox" checked={channels.email} onChange={(e) => updateNotification(key, 'email', e.target.checked)} className="accent-cyan-500 w-4 h-4 cursor-pointer" /></td>
                            <td className="py-3 text-center"><input type="checkbox" checked={channels.push} onChange={(e) => updateNotification(key, 'push', e.target.checked)} className="accent-cyan-500 w-4 h-4 cursor-pointer" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                    Risk & Alert Thresholds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-white/5 rounded-lg bg-black/20 space-y-2">
                      <label className="text-sm font-medium text-white/90">Defect Rate Alert</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">&gt;</span>
                        <input type="number" value={settings.thresholds.defectRate} onChange={(e) => updateSection('thresholds', 'defectRate', Number(e.target.value))} className="bg-gray-900 border border-white/10 rounded-md w-20 px-2 py-1 text-sm outline-none focus:border-cyan-500" />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="p-4 border border-white/5 rounded-lg bg-black/20 space-y-2">
                      <label className="text-sm font-medium text-white/90">Critical Defect Alert</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">&gt;</span>
                        <input type="number" value={settings.thresholds.criticalDefects} onChange={(e) => updateSection('thresholds', 'criticalDefects', Number(e.target.value))} className="bg-gray-900 border border-white/10 rounded-md w-20 px-2 py-1 text-sm outline-none focus:border-cyan-500" />
                        <span className="text-sm text-muted-foreground">critical defect</span>
                      </div>
                    </div>
                    <div className="p-4 border border-white/5 rounded-lg bg-black/20 space-y-2">
                      <label className="text-sm font-medium text-white/90">Batch Failure Threshold</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">&gt;</span>
                        <input type="number" value={settings.thresholds.batchFailure} onChange={(e) => updateSection('thresholds', 'batchFailure', Number(e.target.value))} className="bg-gray-900 border border-white/10 rounded-md w-20 px-2 py-1 text-sm outline-none focus:border-cyan-500" />
                        <span className="text-sm text-muted-foreground">% defective chips</span>
                      </div>
                    </div>
                    <div className="p-4 border border-white/5 rounded-lg bg-black/20 space-y-2">
                      <label className="text-sm font-medium text-white/90">Inventory Low Stock</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">&lt;</span>
                        <input type="number" value={settings.thresholds.lowStock} onChange={(e) => updateSection('thresholds', 'lowStock', Number(e.target.value))} className="bg-gray-900 border border-white/10 rounded-md w-20 px-2 py-1 text-sm outline-none focus:border-cyan-500" />
                        <span className="text-sm text-muted-foreground">units</span>
                      </div>
                    </div>
                    <div className="p-4 border border-white/5 rounded-lg bg-black/20 space-y-2">
                      <label className="text-sm font-medium text-white/90">Shipment Delay</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">&gt;</span>
                        <input type="number" value={settings.thresholds.shipmentDelay} onChange={(e) => updateSection('thresholds', 'shipmentDelay', Number(e.target.value))} className="bg-gray-900 border border-white/10 rounded-md w-20 px-2 py-1 text-sm outline-none focus:border-cyan-500" />
                        <span className="text-sm text-muted-foreground">hours</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: USERS & ACCESS */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    Users & Permissions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Manage role-based access control across the platform.</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { role: "Administrator", perms: ["View Inspections", "Upload Chip Images", "Run AI Inspection", "Approve/Reject Defects", "View Batches", "Manage Suppliers", "View Analytics", "Modify AI Settings", "Manage Users"] },
                      { role: "Quality Inspector", perms: ["View Inspections", "Upload Chip Images", "Run AI Inspection", "Approve/Reject Defects", "View Batches"] },
                      { role: "Production Manager", perms: ["View Inspections", "View Batches", "View Analytics", "Manage Suppliers"] },
                      { role: "Supply Chain Manager", perms: ["View Batches", "Manage Suppliers", "View Analytics"] },
                      { role: "Supplier", perms: ["View Own Batches", "View Own Analytics"] },
                    ].map(r => (
                      <div key={r.role} className="p-4 border border-white/5 rounded-lg bg-black/20 hover:border-cyan-500/20 transition-colors">
                        <div className="font-semibold text-white mb-3">{r.role}</div>
                        <div className="flex flex-wrap gap-2">
                          {r.perms.map(p => (
                            <span key={p} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-full text-muted-foreground">{p}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: SYSTEM & DATA */}
          {activeTab === "system" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-cyan-400" />
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ToggleRow title="Automatic Backup" checked={settings.data.autoBackup} onChange={(v:any) => updateSection('data', 'autoBackup', v)} />
                  <ToggleRow title="Cloud Sync" checked={settings.data.cloudSync} onChange={(v:any) => updateSection('data', 'cloudSync', v)} />
                  <ToggleRow title="Audit Logs" checked={settings.data.auditLogs} onChange={(v:any) => updateSection('data', 'auditLogs', v)} />
                  <SelectRow title="Inspection Image Retention" value={settings.data.retentionDays} options={["30 days", "90 days", "1 year", "Forever"]} onChange={(v:any) => updateSection('data', 'retentionDays', v)} />
                  
                  <div className="pt-6 mt-4 border-t border-white/5 flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors border border-white/10">
                      <Download className="w-4 h-4" /> Export Inspection Reports
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors border border-white/10">
                      <Download className="w-4 h-4" /> Export Batch Data
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors border border-red-500/20 ml-auto">
                      <Trash2 className="w-4 h-4" /> Delete Inspection Data
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Server className="w-5 h-5 text-cyan-400" />
                    System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 text-center">
                      <div className="text-xs text-muted-foreground mb-1">API Status</div>
                      <div className="text-sm font-semibold text-emerald-400">Connected</div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 text-center">
                      <div className="text-xs text-muted-foreground mb-1">AI Engine</div>
                      <div className="text-sm font-semibold text-emerald-400">Operational</div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Database</div>
                      <div className="text-sm font-semibold text-emerald-400">Connected</div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 text-center">
                      <div className="text-xs text-muted-foreground mb-1">CV Model</div>
                      <div className="text-sm font-semibold text-emerald-400">Operational</div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Storage</div>
                      <div className="text-sm font-semibold text-emerald-400">Healthy</div>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors border border-white/10">
                    Run System Diagnostics
                  </button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: ACCOUNT & UI */}
          {activeTab === "account" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-2xl font-bold">
                      AM
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Administrator</h3>
                      <p className="text-muted-foreground">admin@chiptrace.ai</p>
                      <p className="text-sm text-muted-foreground mt-1">ChipTrace Manufacturing Inc.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg text-sm transition-colors">
                      Edit Profile
                    </button>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors border border-white/10">
                      Change Password
                    </button>
                    <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors border border-red-500/20 ml-auto">
                      Sign Out
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.01] border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layout className="w-5 h-5 text-cyan-400" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SelectRow title="Theme" value={settings.appearance.theme} options={["Dark", "Light", "System"]} onChange={(v:any) => updateSection('appearance', 'theme', v)} />
                  <SelectRow title="Density" value={settings.appearance.density} options={["Comfortable", "Compact"]} onChange={(v:any) => updateSection('appearance', 'density', v)} />
                  <SelectRow title="Sidebar" value={settings.appearance.sidebar} options={["Expanded", "Collapsed"]} onChange={(v:any) => updateSection('appearance', 'sidebar', v)} />
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* Floating Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-[calc(50%+8rem)] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium whitespace-nowrap">
              <Info className="w-4 h-4" /> Unsaved changes
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/10 text-white/80 rounded-full text-xs font-medium transition-colors">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/10 text-white/80 rounded-full text-xs font-medium transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
              </button>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full text-xs font-bold transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl text-emerald-400 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3">
            <div className="bg-emerald-500/20 p-1 rounded-full">
              <Check className="w-4 h-4" />
            </div>
            <div className="text-sm font-medium">Settings saved successfully.</div>
          </div>
        </div>
      )}
    </div>
  );
}
