"use client";

import { useState } from "react";
import { AlertTriangle, TrendingDown, Thermometer, Box, Truck, CheckCircle2, Clock, MapPin, Navigation, UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RiskCenterPage() {
  const risks = [
    {
      id: "RSK-001",
      severity: "HIGH",
      entity: "Shipment SHIP-88231",
      type: "Logistics",
      icon: Truck,
      reason: "Port congestion at destination + customs delay",
      impact: "Expected delivery delayed by 2 days, jeopardizing production schedule.",
      recommendation: "Consider alternate logistics route or expedite customs processing via premium agent.",
      carrier: "Global Logistics Ltd",
      driverNo: "DRV-9942 (Hans Mueller)",
      vehicle: "HGV-AB1234",
      timeline: [
        { stage: "Factory Origin", status: "done", time: "Aug 25, 08:00" },
        { stage: "Export Customs", status: "done", time: "Aug 26, 14:30" },
        { stage: "Ocean Transit", status: "done", time: "Aug 27 - Sep 01" },
        { stage: "Destination Port", status: "problem", time: "Currently Stuck", problem: "Severe congestion & customs hold" },
        { stage: "Inland Transport", status: "pending", time: "Pending clearance" },
        { stage: "Final Delivery", status: "pending", time: "Delayed to Sep 06" },
      ]
    },
    {
      id: "RSK-002",
      severity: "HIGH",
      entity: "Inventory MCU-AX45",
      type: "Stockout",
      icon: Box,
      reason: "Predicted demand outpaces current stock + incoming supply.",
      impact: "Stockout predicted in 5 days, halting assembly line B.",
      recommendation: "Reorder immediately. Contact Alpha Semiconductor for expedited batch.",
      carrier: "N/A",
      driverNo: "N/A",
      vehicle: "N/A",
      timeline: [
        { stage: "Stock Level 100k", status: "done", time: "Aug 15" },
        { stage: "Surge in Demand", status: "done", time: "Aug 20 - Aug 30" },
        { stage: "Current Stock: 82.4k", status: "done", time: "Sep 01" },
        { stage: "Projected Shortfall", status: "problem", time: "Sep 06 (5 Days)", problem: "Demand 90k > Supply 82.4k" },
        { stage: "Assembly Line Halt", status: "pending", time: "Sep 07" },
      ]
    },
    {
      id: "RSK-003",
      severity: "MEDIUM",
      entity: "Supplier NexGen Components",
      type: "Supplier",
      icon: TrendingDown,
      reason: "Delivery performance decreased 23% over 30 days.",
      impact: "Increases lead time variability across 4 product lines.",
      recommendation: "Issue formal performance warning and dual-source critical components.",
      carrier: "N/A",
      driverNo: "N/A",
      vehicle: "N/A",
      timeline: [
        { stage: "Quarterly Review Q1", status: "done", time: "Mar 31" },
        { stage: "Quarterly Review Q2", status: "done", time: "Jun 30" },
        { stage: "Recent Delivery Batch 1", status: "done", time: "Aug 10 (+2 Days late)" },
        { stage: "Recent Delivery Batch 2", status: "done", time: "Aug 20 (+4 Days late)" },
        { stage: "Performance Drop", status: "problem", time: "Last 30 Days", problem: "Avg delay increased to 4.5 days" },
        { stage: "Supplier Audit", status: "pending", time: "Scheduled Sep 15" },
      ]
    },
    {
      id: "RSK-004",
      severity: "MEDIUM",
      entity: "Batch BATCH-2026-004822",
      type: "Quality",
      icon: AlertTriangle,
      reason: "Temperature fluctuation detected during transport.",
      impact: "Potential degradation of thermal sensitivity.",
      recommendation: "Flag for secondary quality inspection upon arrival.",
      carrier: "ColdChain Transport",
      driverNo: "DRV-1102 (Sarah Connor)",
      vehicle: "REEFER-XYZ89",
      timeline: [
        { stage: "Wafer Fab", status: "done", time: "Aug 28" },
        { stage: "Packaging", status: "done", time: "Aug 29" },
        { stage: "Transport Start", status: "done", time: "Aug 30, 09:00" },
        { stage: "Temperature Spike", status: "problem", time: "Aug 31, 14:22", problem: "Sensor read 28°C (Target: 20°C)" },
        { stage: "Arrival at Warehouse", status: "pending", time: "ETA Sep 02" },
        { stage: "Secondary Inspection", status: "pending", time: "Mandatory" },
      ]
    },
  ];

  const [selectedRisk, setSelectedRisk] = useState(risks[0]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Center</h1>
          <p className="text-muted-foreground mt-1">
            Cross-domain intelligence feed of supply chain vulnerabilities.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="px-3 py-1 text-sm">2 High Risk</Badge>
          <Badge variant="warning" className="px-3 py-1 text-sm">1 Medium Risk</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 lg:min-h-[600px]">
        {/* Left column: Feed */}
        <div className="lg:col-span-5 space-y-4 lg:overflow-y-auto lg:pr-2 lg:max-h-[calc(100vh-12rem)]">
          {risks.map(risk => (
            <Card 
              key={risk.id} 
              onClick={() => setSelectedRisk(risk)}
              className={`overflow-hidden border-l-4 cursor-pointer transition-all duration-200 group ${
                selectedRisk.id === risk.id 
                  ? risk.severity === 'HIGH' ? 'border-l-red-500 bg-white/[0.05] shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-l-amber-500 bg-white/[0.05] shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                  : 'border-l-transparent hover:bg-white/[0.03]'
              }`} 
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${risk.severity === 'HIGH' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <risk.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-white/90 truncate mr-2">{risk.entity}</span>
                      <Badge variant={risk.severity === 'HIGH' ? 'destructive' : 'warning'} className="text-[10px] py-0 h-4">
                        {risk.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[9px] h-4 py-0 leading-none bg-white/[0.03] border-white/10">{risk.type}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{risk.id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{risk.reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right column: Detail View */}
        <div className="lg:col-span-7 h-full">
          <Card className="h-full flex flex-col bg-black/20 backdrop-blur-md border-white/10 shadow-2xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    {selectedRisk.entity}
                    <Badge variant={selectedRisk.severity === 'HIGH' ? 'destructive' : 'warning'} className="ml-2">
                      {selectedRisk.severity} RISK
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Detailed risk analysis and resolution tracking</p>
                </div>
                <div className={`p-3 rounded-xl ${selectedRisk.severity === 'HIGH' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  <selectedRisk.icon className="w-6 h-6" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 flex-1 overflow-y-auto space-y-8">
              
              {/* Problem Statement */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">The Problem</h3>
                  <p className="text-base font-medium text-white/90">{selectedRisk.reason}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 text-sm">
                  <span className="font-semibold text-muted-foreground mr-2">Business Impact:</span>
                  <span className="text-white/80">{selectedRisk.impact}</span>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                  <div className="flex items-center gap-2 font-bold text-primary mb-1">
                    <AlertTriangle className="w-4 h-4" /> AI Recommendation
                  </div>
                  <p className="text-primary/90">{selectedRisk.recommendation}</p>
                </div>
              </div>

              {/* Driver & Carrier Info (if applicable) */}
              {selectedRisk.carrier !== "N/A" && (
                <div>
                   <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Carrier & Driver Details</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 flex items-center gap-3">
                       <Truck className="w-8 h-8 text-muted-foreground p-1.5 bg-white/5 rounded-md" />
                       <div>
                         <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Carrier</p>
                         <p className="text-sm font-medium">{selectedRisk.carrier}</p>
                         <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{selectedRisk.vehicle}</p>
                       </div>
                     </div>
                     <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 flex items-center gap-3">
                       <UserCircle className="w-8 h-8 text-muted-foreground p-1.5 bg-white/5 rounded-md" />
                       <div>
                         <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Driver No.</p>
                         <p className="text-sm font-medium">{selectedRisk.driverNo}</p>
                       </div>
                     </div>
                   </div>
                </div>
              )}

              {/* Status Timeline Map */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Event Timeline (Done vs Pending)</h3>
                <div className="relative pl-6 border-l-2 border-white/10 ml-4 space-y-6">
                  {selectedRisk.timeline.map((event, idx) => (
                    <div key={idx} className="relative">
                      {/* Node indicator */}
                      <div className={`absolute -left-[35px] w-5 h-5 rounded-full border-[3px] bg-[#030712] flex items-center justify-center
                        ${event.status === 'done' ? 'border-emerald-500' : 
                          event.status === 'problem' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 
                          'border-white/20'}`}
                      >
                        {event.status === 'done' && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                        {event.status === 'problem' && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                      </div>
                      
                      <div className={`flex flex-col ${event.status === 'pending' ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-start">
                          <h4 className={`text-sm font-bold ${event.status === 'problem' ? 'text-red-400' : 'text-white/90'}`}>
                            {event.stage}
                          </h4>
                          <span className="text-xs text-muted-foreground">{event.time}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={event.status === 'done' ? 'success' : event.status === 'problem' ? 'destructive' : 'outline'} className="text-[9px] h-4 py-0">
                            {event.status.toUpperCase()}
                          </Badge>
                        </div>

                        {event.problem && (
                          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-300 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span><strong className="text-red-400">Bottleneck:</strong> {event.problem}</span>
                          </div>
                        )}
                      </div>
                    </div>
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
