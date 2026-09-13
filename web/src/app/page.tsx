"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type SHAPDriver = {
  feature: string;
  attribution: number;
  baseline_val: string;
  current_val: string;
};

type RecentHistory = {
  timestamp: string;
  voltage: number;
  temp: number;
  deltaV: number;
};

type VehicleTelemetry = {
  vehicle_id: string;
  last_updated: string;
  status: "NOMINAL" | "WARNING" | "CRITICAL ANOMALY";
  soc: number;
  pack_voltage: number;
  pack_current: number;
  pack_temp: number;
  cell_voltage_delta: number;
  anomaly_score: number;
  shap_drivers: SHAPDriver[];
  recent_history: RecentHistory[];
};

export default function SCADADashboard() {
  const [vehicles, setVehicles] = useState<VehicleTelemetry[]>([]);
  const [syncTime, setSyncTime] = useState<string>("SYNC PENDING");
  const [selectedVid, setSelectedVid] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "WARNING" | "NOMINAL">("ALL");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/fleet");
        if (res.ok) {
          const data = await res.json();
          setVehicles(data.vehicles);
          setSyncTime(data.timestamp);
          if (data.vehicles.length > 0 && !selectedVid) {
            setSelectedVid(data.vehicles[0].vehicle_id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
    const intv = setInterval(fetchData, 2000);
    return () => clearInterval(intv);
  }, [selectedVid]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (filter === "ALL") return true;
      if (filter === "CRITICAL") return v.status === "CRITICAL ANOMALY";
      return v.status === filter;
    });
  }, [vehicles, filter]);

  const selectedVehicle = vehicles.find((v) => v.vehicle_id === selectedVid);

  const getStatusColor = (status?: string) => {
    if (status === "CRITICAL ANOMALY") return "text-[#F43F5E]";
    if (status === "WARNING") return "text-[#F59E0B]";
    return "text-[#10B981]";
  };

  return (
    <main className="h-screen w-full bg-[#090A0C] text-[#F3F4F6] font-mono tabular-nums flex flex-col p-4">
      {/* Top Navigation */}
      <header className="flex justify-between items-center bg-[#0E1116] border border-[#1F242C] p-3 mb-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-bold tracking-widest text-sm uppercase">ΩHMNIC SCADA SEC-01</span>
          </div>
          <div className="text-xs text-[#9CA3AF]">
            AWS REGION: <span className="text-[#F3F4F6]">us-east-1</span>
          </div>
          <div className="text-xs text-[#9CA3AF]">
            DB STATUS: <span className="text-[#10B981]">ONLINE</span>
          </div>
        </div>
        <div className="text-xs flex items-center space-x-4">
          <div className="text-[#9CA3AF]">
            FLEET SIZE: <span className="text-[#F3F4F6]">{vehicles.length} UNITS</span>
          </div>
          <div className="text-[#9CA3AF]">
            LAST SYNC: <span className="text-[#F3F4F6]">{syncTime}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 gap-4">
        {/* Left Panel: Matrix Table */}
        <section className="w-1/2 flex flex-col bg-[#0E1116] border border-[#1F242C]">
          <div className="flex justify-between items-center p-3 border-b border-[#1F242C]">
            <h2 className="text-sm font-bold uppercase tracking-wider">Fleet Matrix</h2>
            <div className="flex space-x-2 text-xs">
              {["ALL", "CRITICAL", "WARNING", "NOMINAL"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-2 py-1 border ${
                    filter === f ? "bg-[#1F242C] text-[#F3F4F6] border-[#F3F4F6]" : "border-[#1F242C] text-[#6B7280]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex bg-[#1F242C] text-xs font-bold p-2 text-[#9CA3AF] uppercase">
            <div className="w-28">VIN</div>
            <div className="w-24">Arch</div>
            <div className="w-12">SoC</div>
            <div className="w-16">ΔV</div>
            <div className="w-16">Temp</div>
            <div className="w-16">Score</div>
            <div className="flex-1 text-right">Status</div>
          </div>
          <div className="flex-1 overflow-auto">
            {filteredVehicles.map((v) => {
              const isCritVolt = v.cell_voltage_delta > 0.1;
              const isWarnVolt = v.cell_voltage_delta > 0.03 && !isCritVolt;
              const isCritTemp = v.pack_temp > 52;
              const isWarnTemp = v.pack_temp > 42 && !isCritTemp;

              return (
                <div
                  key={v.vehicle_id}
                  onClick={() => setSelectedVid(v.vehicle_id)}
                  className={`flex items-center p-2 text-xs border-b border-[#1F242C] cursor-pointer hover:bg-[#1F242C] ${
                    selectedVid === v.vehicle_id ? "bg-[#1F242C] border-l-2 border-l-[#06B6D4]" : ""
                  }`}
                >
                  <div className="w-28 font-bold">{v.vehicle_id}</div>
                  <div className="w-24 text-[#6B7280]">NMC-811</div>
                  <div className="w-12">{v.soc?.toFixed(1) || "-"}%</div>
                  <div className={`w-16 ${isCritVolt ? "text-[#F43F5E] font-bold" : isWarnVolt ? "text-[#F59E0B]" : ""}`}>
                    {v.cell_voltage_delta?.toFixed(3)}
                  </div>
                  <div className={`w-16 ${isCritTemp ? "text-[#F43F5E] font-bold" : isWarnTemp ? "text-[#F59E0B]" : ""}`}>
                    {v.pack_temp?.toFixed(1)}
                  </div>
                  <div className="w-16 text-[#9CA3AF]">{v.anomaly_score?.toFixed(2)}</div>
                  <div className={`flex-1 text-right font-bold ${getStatusColor(v.status)}`}>
                    {v.status || "NOMINAL"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Panel: Diagnostic Drill-Down */}
        <section className="w-1/2 flex flex-col gap-4 min-h-0">
          {/* Header */}
          <div className="bg-[#0E1116] border border-[#1F242C] p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedVehicle?.vehicle_id || "AWAITING SELECTION"}</h2>
                <div className={`text-sm font-bold ${getStatusColor(selectedVehicle?.status)}`}>
                  {selectedVehicle?.status || "---"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#9CA3AF]">INSTANTANEOUS V/I</div>
                <div className="text-lg">
                  {selectedVehicle?.pack_voltage?.toFixed(1)}V / {selectedVehicle?.pack_current?.toFixed(1)}A
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-[#9CA3AF]">
              <div>MAX CELL TEMP: <span className="text-[#F3F4F6]">{selectedVehicle?.pack_temp?.toFixed(1)}°C</span></div>
              <div>IMBALANCE: <span className="text-[#F3F4F6]">{selectedVehicle?.cell_voltage_delta?.toFixed(3)}V</span></div>
              <div>SCORE: <span className="text-[#F3F4F6]">{selectedVehicle?.anomaly_score?.toFixed(3)}</span></div>
            </div>
          </div>

          {/* Waveform Panel */}
          <div className="flex-1 bg-[#0E1116] border border-[#1F242C] p-3 flex flex-col relative">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] absolute top-3 left-3 z-10">
              Waveform: Pack Voltage & Temperature
            </h3>
            <div className="flex-1 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedVehicle?.recent_history || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1F242C" />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis yAxisId="left" stroke="#F3F4F6" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "#0E1116", border: "1px solid #1F242C", borderRadius: 0, fontFamily: "monospace" }} />
                  <Line yAxisId="left" type="stepAfter" dataKey="voltage" stroke="#F3F4F6" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                  <Line yAxisId="right" type="stepAfter" dataKey="temp" stroke="#F59E0B" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Explainability Engine */}
          <div className="flex-1 flex gap-4 bg-[#0E1116] border border-[#1F242C] p-3">
            <div className="flex-1 flex flex-col relative">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-4">
                SHAP Attribution ($\Delta$P)
              </h3>
              {selectedVehicle?.shap_drivers && selectedVehicle.shap_drivers.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={selectedVehicle.shap_drivers} margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#1F242C" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#9CA3AF" tick={{fontSize: 10}} />
                    <YAxis dataKey="feature" type="category" stroke="#9CA3AF" tick={{fontSize: 10}} width={120} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "#0E1116", border: "1px solid #1F242C", borderRadius: 0 }} />
                    <Bar dataKey="attribution" fill="#F43F5E" isAnimationActive={false} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[#6B7280] text-xs">NO CRITICAL ATTRIBUTIONS</div>
              )}
            </div>
            
            <div className="w-1/3 flex flex-col text-[10px]">
              <div className="flex border-b border-[#1F242C] pb-1 mb-2 text-[#9CA3AF]">
                <div className="flex-1">SENSOR</div>
                <div className="w-12 text-right">BASE</div>
                <div className="w-12 text-right">ACTUAL</div>
              </div>
              <div className="flex-1 overflow-auto space-y-2">
                {selectedVehicle?.shap_drivers?.map((driver) => (
                  <div key={driver.feature} className="flex">
                    <div className="flex-1 truncate pr-2 text-[#F3F4F6]">{driver.feature}</div>
                    <div className="w-12 text-right text-[#6B7280]">{driver.baseline_val}</div>
                    <div className="w-12 text-right text-[#F43F5E]">{driver.current_val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}