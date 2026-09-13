"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface Telemetry {
  timestamp: string;
  pack_voltage: number;
  pack_current: number;
  pack_temp_c: number;
  cell_voltage_delta: number;
  max_cell_temp_c: number;
  state_of_charge?: number;
}

interface FleetVehicle {
  vehicle_id: string;
  is_anomaly: boolean;
  anomaly_score: number;
  latest_telemetry: Telemetry;
  history: number[][]; // [voltage, current, temp, delta_v, max_temp]
  shap_attributions: Record<string, number>;
  timestamp: string;
}

export default function FleetConsole() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const res = await fetch("/api/fleet");
        if (res.ok) {
          const data = await res.json();
          setVehicles(data);
          if (data.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(data[0].vehicle_id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch fleet data:", err);
      }
    };

    fetchFleet();
    const interval = setInterval(fetchFleet, 2000); // Polling every 2 seconds
    return () => clearInterval(interval);
  }, [selectedVehicleId]);

  const selectedVehicle = vehicles.find((v) => v.vehicle_id === selectedVehicleId);

  // Parse history into chart-friendly format
  const chartData = selectedVehicle?.history.map((h, i) => ({
    index: i,
    pack_voltage: h[0],
    pack_current: h[1],
    pack_temp_c: h[2],
    cell_voltage_delta: h[3],
    max_cell_temp_c: h[4],
  })) || [];

  // Parse SHAP attributions
  const shapData = Object.entries(selectedVehicle?.shap_attributions || {}).map(([name, val]) => ({
    feature: name,
    value: val,
  })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <main className="p-4 h-screen max-w-full mx-auto flex flex-col font-mono text-xs">
      <header className="flex justify-between items-center pb-2 border-b border-border-subtle mb-4">
        <div>
          <h1 className="text-xl font-bold uppercase">Ωhmnic Engineering Console</h1>
          <p className="text-text-muted">High-density fleet telemetry tracking</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse"></span>
          <span>Live Sync: 2000ms</span>
        </div>
      </header>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left: Compact Fleet Table */}
        <section className="w-1/2 flex flex-col min-h-0 border border-border-subtle overflow-hidden">
          <div className="bg-surface-card-hover p-2 font-bold flex text-text-secondary uppercase">
            <div className="w-24">VIN</div>
            <div className="w-16">SoC (%)</div>
            <div className="w-20">Voltage (V)</div>
            <div className="w-20">Current (A)</div>
            <div className="w-20">Temp (°C)</div>
            <div className="w-24">Cell ΔV (V)</div>
            <div className="w-24">Anomaly</div>
            <div className="flex-1 text-right">Timestamp</div>
          </div>
          <div className="flex-1 overflow-auto bg-surface-card">
            {vehicles.map((v) => (
              <div
                key={v.vehicle_id}
                onClick={() => setSelectedVehicleId(v.vehicle_id)}
                className={`flex p-2 cursor-pointer border-b border-border-subtle hover:bg-surface-card-hover ${
                  selectedVehicleId === v.vehicle_id ? "bg-surface-card-hover border-l-2 border-l-accent-cyan" : ""
                }`}
              >
                <div className="w-24 font-bold">{v.vehicle_id}</div>
                <div className="w-16">{v.latest_telemetry.state_of_charge?.toFixed(1) || "-"}</div>
                <div className="w-20">{v.latest_telemetry.pack_voltage.toFixed(1)}</div>
                <div className="w-20">{v.latest_telemetry.pack_current.toFixed(1)}</div>
                <div className="w-20">{v.latest_telemetry.pack_temp_c.toFixed(1)}</div>
                <div className={`w-24 font-bold ${v.latest_telemetry.cell_voltage_delta > 0.1 ? "text-accent-pank" : "text-accent-emerald"}`}>
                  {v.latest_telemetry.cell_voltage_delta.toFixed(3)}
                </div>
                <div className={`w-24 ${v.is_anomaly ? "text-accent-pank font-bold" : "text-text-muted"}`}>
                  {v.anomaly_score.toFixed(3)}
                </div>
                <div className="flex-1 text-right text-text-muted">{new Date(v.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Charts */}
        <section className="w-1/2 flex flex-col gap-4 min-h-0">
          
          {/* Top: Dual Time-series */}
          <div className="h-1/2 flex flex-col gap-2">
            <div className="flex-1 border border-border-subtle bg-surface-card p-2 relative">
              <h3 className="absolute top-2 left-2 text-text-muted z-10">Voltage & Current</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} syncId="telemetrySync" margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242933" />
                  <XAxis dataKey="index" hide />
                  <YAxis yAxisId="left" stroke="#F3F4F6" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <YAxis yAxisId="right" orientation="right" stroke="#06B6D4" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: "#111317", border: "1px solid #242933" }} />
                  <Line yAxisId="left" type="monotone" dataKey="pack_voltage" stroke="#F3F4F6" dot={false} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="pack_current" stroke="#06B6D4" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 border border-border-subtle bg-surface-card p-2 relative">
              <h3 className="absolute top-2 left-2 text-text-muted z-10">Thermal Gradient & Cell ΔV</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} syncId="telemetrySync" margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242933" />
                  <XAxis dataKey="index" hide />
                  <YAxis yAxisId="left" stroke="#F5A623" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ff4876" tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: "#111317", border: "1px solid #242933" }} />
                  <Line yAxisId="left" type="monotone" dataKey="pack_temp_c" stroke="#F5A623" dot={false} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="cell_voltage_delta" stroke="#ff4876" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom: SHAP Waterfall */}
          <div className="h-1/2 border border-border-subtle bg-surface-card p-4 flex flex-col relative">
            <h3 className="text-text-secondary uppercase mb-4">SHAP Attribution ($\Delta$ Anomaly Probability)</h3>
            {shapData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242933" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#9CA3AF" tick={{fontSize: 10}} />
                  <YAxis dataKey="feature" type="category" stroke="#9CA3AF" tick={{fontSize: 10}} />
                  <Tooltip cursor={{fill: '#1F232B'}} contentStyle={{ backgroundColor: "#111317", border: "1px solid #242933" }} />
                  <Bar dataKey="value" fill="#ff4876" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted">
                {selectedVehicle?.is_anomaly ? "Loading attributions..." : "No anomaly detected."}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}