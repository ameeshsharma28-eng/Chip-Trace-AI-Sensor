"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

const productionData = [
  { name: 'Aug 25', volume: 4000, defect: 240 },
  { name: 'Aug 26', volume: 3000, defect: 139 },
  { name: 'Aug 27', volume: 2000, defect: 980 },
  { name: 'Aug 28', volume: 2780, defect: 390 },
  { name: 'Aug 29', volume: 1890, defect: 480 },
  { name: 'Aug 30', volume: 2390, defect: 380 },
  { name: 'Aug 31', volume: 3490, defect: 430 },
];

const supplierData = [
  { name: 'Alpha', score: 94 },
  { name: 'Global', score: 82 },
  { name: 'NexGen', score: 65 },
  { name: 'Silicon', score: 98 },
];

const shipmentRiskData = [
  { name: 'On Time', value: 65, color: '#10b981' }, // emerald
  { name: 'Delayed', value: 20, color: '#f59e0b' }, // amber
  { name: 'Critical', value: 15, color: '#ef4444' }, // red
];

export default function AnalyticsDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="flex flex-col bg-white/[0.01] border-white/5 backdrop-blur-xl shadow-2xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-sm font-semibold text-white/90 uppercase tracking-wider">Production Volume vs Defect Rate</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex-1 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={productionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVolume2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDefect2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(3,7,18,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="volume" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume2)" />
              <Area type="monotone" dataKey="defect" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDefect2)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col bg-white/[0.01] border-white/5 backdrop-blur-xl shadow-2xl flex-1">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-sm font-semibold text-white/90 uppercase tracking-wider">Supplier Performance Score</CardTitle>
          </CardHeader>
          <CardContent className="p-6 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: 'rgba(3,7,18,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="score" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                  {supplierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score > 90 ? '#10b981' : entry.score > 80 ? '#0ea5e9' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col bg-white/[0.01] border-white/5 backdrop-blur-xl shadow-2xl flex-1">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-sm font-semibold text-white/90 uppercase tracking-wider">Shipment Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-2 min-h-[300px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shipmentRiskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {shipmentRiskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(3,7,18,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white/90">35%</span>
              <span className="text-[10px] text-muted-foreground uppercase">At Risk</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
