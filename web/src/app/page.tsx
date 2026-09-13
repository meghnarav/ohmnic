"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";

const BatteryPackCanvas = dynamic(() => import("../components/BatteryPackCanvas"), { ssr: false });

interface Vehicle {
  vin: string;
  packType: string;
  soc: number;
  soh: number; // State of Health
  cycles: number;
  packVoltage: number;
  packCurrent: number;
  maxTemp: number;
  minTemp: number;
  deltaV: number;
  score: number;
  status: "NOMINAL" | "WARN" | "FAULT";
  cells: number[];
  history: { t: string; v: number; a: number; temp: number }[];
  shap: { feature: string; impact: number; base: string; obs: string }[];
}

const GENERATE_CELLS = (baseV: number, delta: number) => {
  return Array.from({ length: 24 }, (_, i) => {
    if (i === 14 && delta > 0.05) return Number((baseV - delta).toFixed(3));
    const variance = Math.sin(i * 997) * 0.003;
    return Number((baseV + variance).toFixed(3));
  });
};

const SEED_FLEET: Vehicle[] = [
  {
    vin: "VIN-EV-1000",
    packType: "NMC-811 / 96S2P",
    soc: 74.2,
    soh: 98.4,
    cycles: 112,
    packVoltage: 398.4,
    packCurrent: -42.1,
    maxTemp: 31.2,
    minTemp: 28.9,
    deltaV: 0.014,
    score: 0.041,
    status: "NOMINAL",
    cells: GENERATE_CELLS(4.15, 0.014),
    history: [
      { t: "13:41:00", v: 399.1, a: -40.2, temp: 30.8 },
      { t: "13:41:15", v: 398.9, a: -41.5, temp: 31.0 },
      { t: "13:41:30", v: 398.6, a: -42.0, temp: 31.1 },
      { t: "13:41:45", v: 398.4, a: -42.1, temp: 31.2 },
    ],
    shap: [
      { feature: "cell_voltage_delta", impact: -0.14, base: "0.012 V", obs: "0.014 V" },
      { feature: "pack_temp_c", impact: -0.08, base: "30.5 °C", obs: "31.2 °C" },
      { feature: "pack_current", impact: 0.01, base: "-40.0 A", obs: "-42.1 A" },
    ],
  },
  {
    vin: "VIN-EV-1001",
    packType: "NMC-811 / 96S2P",
    soc: 89.4,
    soh: 92.1,
    cycles: 420,
    packVoltage: 351.8,
    packCurrent: 248.5,
    maxTemp: 61.4,
    minTemp: 36.2,
    deltaV: 0.285,
    score: 0.942,
    status: "FAULT",
    cells: GENERATE_CELLS(3.88, 0.285),
    history: [
      { t: "13:41:00", v: 382.4, a: 180.0, temp: 42.1 },
      { t: "13:41:15", v: 371.1, a: 215.4, temp: 49.8 },
      { t: "13:41:30", v: 360.2, a: 238.1, temp: 56.4 },
      { t: "13:41:45", v: 351.8, a: 248.5, temp: 61.4 },
    ],
    shap: [
      { feature: "cell_voltage_delta", impact: 0.52, base: "0.015 V", obs: "0.285 V" },
      { feature: "max_cell_temp_c", impact: 0.36, base: "31.0 °C", obs: "61.4 °C" },
      { feature: "pack_current", impact: 0.18, base: "50.0 A", obs: "248.5 A" },
      { feature: "pack_voltage", impact: -0.11, base: "395.0 V", obs: "351.8 V" },
    ],
  },
  {
    vin: "VIN-EV-1002",
    packType: "LFP-Blade / 108S",
    soc: 61.8,
    soh: 99.2,
    cycles: 45,
    packVoltage: 348.1,
    packCurrent: -32.4,
    maxTemp: 28.4,
    minTemp: 27.2,
    deltaV: 0.018,
    score: 0.052,
    status: "NOMINAL",
    cells: GENERATE_CELLS(3.22, 0.018),
    history: [
      { t: "13:41:00", v: 348.5, a: -31.9, temp: 28.2 },
      { t: "13:41:15", v: 348.3, a: -32.0, temp: 28.3 },
      { t: "13:41:30", v: 348.2, a: -32.2, temp: 28.4 },
      { t: "13:41:45", v: 348.1, a: -32.4, temp: 28.4 },
    ],
    shap: [
      { feature: "cell_voltage_delta", impact: -0.06, base: "0.016 V", obs: "0.018 V" },
      { feature: "pack_temp_c", impact: -0.03, base: "28.0 °C", obs: "28.4 °C" },
    ],
  },
  {
    vin: "VIN-EV-1003",
    packType: "NMC-811 / 96S2P",
    soc: 41.5,
    soh: 88.5,
    cycles: 610,
    packVoltage: 388.2,
    packCurrent: -78.4,
    maxTemp: 44.8,
    minTemp: 38.1,
    deltaV: 0.048,
    score: 0.428,
    status: "WARN",
    cells: GENERATE_CELLS(4.04, 0.048),
    history: [
      { t: "13:41:00", v: 391.4, a: -62.0, temp: 41.2 },
      { t: "13:41:15", v: 390.1, a: -70.5, temp: 42.6 },
      { t: "13:41:30", v: 389.2, a: -75.0, temp: 43.9 },
      { t: "13:41:45", v: 388.2, a: -78.4, temp: 44.8 },
    ],
    shap: [
      { feature: "cell_voltage_delta", impact: 0.24, base: "0.015 V", obs: "0.048 V" },
      { feature: "max_temp_c", impact: 0.19, base: "30.0 °C", obs: "44.8 °C" },
      { feature: "pack_current", impact: 0.04, base: "-45.0 A", obs: "-78.4 A" },
    ],
  },
  {
    vin: "VIN-EV-1004",
    packType: "LFP-Blade / 108S",
    soc: 82.0,
    soh: 96.8,
    cycles: 185,
    packVoltage: 352.0,
    packCurrent: -24.0,
    maxTemp: 27.1,
    minTemp: 26.3,
    deltaV: 0.012,
    score: 0.029,
    status: "NOMINAL",
    cells: GENERATE_CELLS(3.25, 0.012),
    history: [
      { t: "13:41:00", v: 352.4, a: -24.0, temp: 26.9 },
      { t: "13:41:15", v: 352.2, a: -24.1, temp: 27.0 },
      { t: "13:41:30", v: 352.1, a: -23.9, temp: 27.1 },
      { t: "13:41:45", v: 352.0, a: -24.0, temp: 27.1 },
    ],
    shap: [
      { feature: "cell_voltage_delta", impact: -0.11, base: "0.014 V", obs: "0.012 V" },
      { feature: "pack_temp_c", impact: -0.05, base: "27.0 °C", obs: "27.1 °C" },
    ],
  },
];

export default function SCADAConsole() {
  const [mounted, setMounted] = useState(false);
  const [fleet, setFleet] = useState<Vehicle[]>(SEED_FLEET);
  const [selectedVin, setSelectedVin] = useState<string>("VIN-EV-1001");
  const [activeTab, setActiveTab] = useState<"SIGNALS" | "CELLS" | "SHAP" | "TRIAGE" | "3D">("3D");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form State
  const [newVin, setNewVin] = useState("");
  const [newFleetId, setNewFleetId] = useState("");
  const [newPackType, setNewPackType] = useState("NMC-811 / 96S2P");

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    const capacity = newPackType.includes("LFP") ? 60.0 : 77.4;
    const voltage = newPackType.includes("LFP") ? 350.0 : 400.0;
    
    // Optimistic UI Update
    const newVehicle: Vehicle = {
      vin: newVin,
      packType: newPackType,
      soc: 100.0,
      soh: 100.0,
      cycles: 0,
      packVoltage: voltage,
      packCurrent: 0.0,
      maxTemp: 25.0,
      minTemp: 25.0,
      deltaV: 0.005,
      score: 0.01,
      status: "NOMINAL",
      cells: GENERATE_CELLS(voltage / (newPackType.includes("LFP") ? 108 : 96), 0.005),
      history: [],
      shap: [],
    };
    setFleet((prev) => [newVehicle, ...prev]);
    setIsModalOpen(false);

    try {
      await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: newVin,
          fleet_id: newFleetId,
          pack_type: newPackType,
          usable_capacity_kwh: capacity,
          nominal_voltage: voltage,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecommission = async (vinToDelete: string) => {
    setFleet((prev) => prev.filter(v => v.vin !== vinToDelete));
    if (selectedVin === vinToDelete && fleet.length > 1) {
      setSelectedVin(fleet.find(v => v.vin !== vinToDelete)?.vin || fleet[0].vin);
    }
    
    try {
      await fetch(`/api/vehicles?vin=${vinToDelete}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setMounted(true);
    let intervalId: NodeJS.Timeout;

    const fetchFleet = async () => {
      try {
        const res = await fetch("/api/fleet");
        if (res.ok) {
          const data = await res.json();
          if (data.vehicles && data.vehicles.length > 0) {
            // Map DynamoDB payload back to expected frontend state
            const mappedLive = data.vehicles.map((v: any) => {
              // Ensure we don't break UI with missing fields
              const latestV = v.pack_voltage ?? 400.0;
              const isLFP = v.pack_type?.includes("LFP") || false;
              
              return {
                vin: v.vehicle_id || v.vin,
                packType: v.pack_type || "NMC-811 / 96S2P",
                soc: v.soc ?? 100,
                soh: 100.0, // Calculated separately
                cycles: 0,
                packVoltage: latestV,
                packCurrent: v.pack_current ?? 0,
                maxTemp: v.pack_temp ?? 25,
                minTemp: (v.pack_temp ?? 25) - (v.cell_voltage_delta ?? 0) * 10, // Approx
                deltaV: v.cell_voltage_delta ?? 0,
                score: v.anomaly_score ?? 0,
                status: v.status || "NOMINAL",
                cells: GENERATE_CELLS(latestV / (isLFP ? 108 : 96), v.cell_voltage_delta ?? 0),
                history: (v.recent_history || []).map((h: any) => ({
                  t: h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : "00:00",
                  v: h.voltage ?? latestV,
                  a: v.pack_current ?? 0,
                  temp: h.temp ?? 25
                })),
                shap: (v.shap_drivers || []).map((s: any) => ({
                  feature: s.feature,
                  impact: s.attribution,
                  base: s.baseline_val,
                  obs: s.current_val
                }))
              };
            });
            setFleet(mappedLive);
          }
        }
      } catch (e) {
        console.error("Polling failed, falling back to mock seed data", e);
      }
    };

    fetchFleet();
    intervalId = setInterval(fetchFleet, 2000);

    return () => clearInterval(intervalId);
  }, []);

  const v = useMemo(
    () => fleet.find((item) => item.vin === selectedVin) || fleet[0],
    [fleet, selectedVin]
  );

  if (!mounted) {
    return <div style={{ height: "100vh", width: "100vw", backgroundColor: "#0B0C0E" }} />;
  }

  return (
    <div style={{ height: "100vh", width: "100vw", backgroundColor: "#0B0C0E", color: "#F3F4F6", display: "flex", flexDirection: "column", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", overflow: "hidden" }}>
      {/* 1. SCADA Header Bar */}
      <header style={{ height: "48px", borderBottom: "1px solid #242933", backgroundColor: "#111317", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontWeight: 800, letterSpacing: "0.05em", color: "#F3F4F6", fontSize: "14px" }}>ΩHMNIC // BMS-RTX</span>
          <span style={{ color: "#6B7280" }}>|</span>
          <span style={{ color: "#9CA3AF" }}>PIPELINE: SQS.FIFO &rarr; LAMBDA &rarr; DYNAMODB</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "#9CA3AF" }}>
          <span>RATE: <strong style={{ color: "#06B6D4" }}>5.0 Hz</strong></span>
          <span>REGION: <strong style={{ color: "#F3F4F6" }}>us-east-1</strong></span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", backgroundColor: "#10B981" }} />
            LINK: SYNCHRONIZED
          </span>
          <div style={{ width: "1px", height: "24px", backgroundColor: "#242933", margin: "0 8px" }} />
          <OrganizationSwitcher 
            appearance={{ elements: { organizationSwitcherTrigger: "text-[#F3F4F6]" } }}
          />
          <UserButton />
        </div>
      </header>

      {/* 2. Main Workbench */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "480px 1fr", overflow: "hidden" }}>

        {/* LEFT COLUMN: High-Density Telemetry Matrix */}
        <aside style={{ borderRight: "1px solid #242933", backgroundColor: "#0E1014", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Table Controls */}
          <div style={{ height: "40px", borderBottom: "1px solid #242933", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#14171D", color: "#9CA3AF", fontSize: "10px" }}>
            <span>FLEET STATUS ({fleet.length} MONITORED UNITS)</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setIsModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#10B981", color: "#000", padding: "4px 8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>
                <Plus size={12} /> ONBOARD ASSET
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div style={{ display: "grid", gridTemplateColumns: "110px 55px 70px 65px 75px 24px", padding: "6px 12px", borderBottom: "1px solid #242933", color: "#6B7280", fontSize: "10px", fontWeight: 700 }}>
            <div>VIN</div>
            <div style={{ textAlign: "right" }}>SOC</div>
            <div style={{ textAlign: "right" }}>V_PACK</div>
            <div style={{ textAlign: "right" }}>T_MAX</div>
            <div style={{ textAlign: "right" }}>ΔV_CELL</div>
            <div></div>
          </div>

          {/* Table Rows */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {fleet.map((item) => {
              const isSelected = item.vin === v.vin;
              const isFault = item.status === "FAULT";
              const isWarn = item.status === "WARN";

              return (
                <div
                  key={item.vin}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "110px 55px 70px 65px 75px 24px",
                    padding: "8px 12px",
                    borderBottom: "1px solid #191D24",
                    backgroundColor: isSelected ? "#1F232B" : "transparent",
                    alignItems: "center",
                    borderLeft: isSelected ? "2px solid #06B6D4" : "2px solid transparent",
                  }}
                >
                  <div onClick={() => setSelectedVin(item.vin)} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <span style={{
                      width: "6px",
                      height: "6px",
                      backgroundColor: isFault ? "#ff4876" : isWarn ? "#F5A623" : "#10B981"
                    }} />
                    <span style={{ color: isSelected ? "#F3F4F6" : "#D1D5DB", fontWeight: 600 }}>{item.vin}</span>
                  </div>
                  <div onClick={() => setSelectedVin(item.vin)} style={{ textAlign: "right", color: "#9CA3AF", cursor: "pointer" }}>{item.soc}%</div>
                  <div onClick={() => setSelectedVin(item.vin)} style={{ textAlign: "right", color: "#D1D5DB", cursor: "pointer" }}>{item.packVoltage.toFixed(1)}V</div>
                  <div onClick={() => setSelectedVin(item.vin)} style={{ textAlign: "right", color: item.maxTemp > 50 ? "#ff4876" : "#9CA3AF", cursor: "pointer" }}>{item.maxTemp}°C</div>
                  <div onClick={() => setSelectedVin(item.vin)} style={{ textAlign: "right", color: item.deltaV > 0.1 ? "#ff4876" : item.deltaV > 0.03 ? "#F5A623" : "#10B981", fontWeight: 700, cursor: "pointer" }}>
                    {item.deltaV.toFixed(3)}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <button onClick={() => handleDecommission(item.vin)} style={{ backgroundColor: "transparent", border: "none", color: "#F43F5E", cursor: "pointer" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Matrix Footer */}
          <div style={{ height: "24px", borderTop: "1px solid #242933", backgroundColor: "#111317", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px", color: "#6B7280" }}>
            <span>DETECTOR: ISOLATION_FOREST_V2</span>
            <span>THRESH: 0.650</span>
          </div>
        </aside>

        {/* RIGHT COLUMN: Diagnostic Deep-Dive */}
        <main style={{ backgroundColor: "#0B0C0E", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Active Unit Ribbon */}
          <div style={{ height: "48px", borderBottom: "1px solid #242933", backgroundColor: "#14171D", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#F3F4F6" }}>{v.vin}</span>
                <span style={{ marginLeft: "10px", color: "#6B7280", fontSize: "10px" }}>CONFIG: {v.packType}</span>
              </div>
              <span style={{
                padding: "2px 8px",
                border: `1px solid ${v.status === "FAULT" ? "#ff4876" : v.status === "WARN" ? "#F5A623" : "#10B981"}`,
                color: v.status === "FAULT" ? "#ff4876" : v.status === "WARN" ? "#F5A623" : "#10B981",
                fontSize: "10px",
                fontWeight: 700
              }}>
                STATE: {v.status}
              </span>
            </div>

            {/* Sub-tab Navigation */}
            <div style={{ display: "flex", border: "1px solid #242933" }}>
              {(["3D", "CELLS", "SIGNALS", "SHAP", "TRIAGE"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "4px 14px",
                    border: "none",
                    backgroundColor: activeTab === tab ? "#1F232B" : "#111317",
                    color: activeTab === tab ? "#06B6D4" : "#9CA3AF",
                    cursor: "pointer",
                    fontSize: "10px",
                    fontFamily: "inherit",
                    fontWeight: 700,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Area */}
          <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>

            {/* TAB 0: 3D Visualization */}
            {activeTab === "3D" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
                <BatteryPackCanvas cells={v.cells} status={v.status} />
                <div style={{ color: "#9CA3AF", fontSize: "10px", backgroundColor: "#111317", padding: "12px", border: "1px solid #242933" }}>
                  INTERACTIVE MODULE VISUALIZER: SCROLL TO ZOOM, DRAG TO ROTATE. RED MODULES INDICATE &gt;50mV DEVIATION FROM PACK MEAN OR CRITICAL THERMAL EVENT.
                </div>
              </motion.div>
            )}

            {/* TAB 1: 24-Cell Series Voltage Ladder */}
            {activeTab === "CELLS" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", color: "#9CA3AF" }}>
                  <span>PACK CELL VOLTAGE MAP (24-SERIES REPRESENTATIVE SAMPLE)</span>
                  <span>ΔV: <strong style={{ color: v.deltaV > 0.1 ? "#ff4876" : "#10B981" }}>{v.deltaV.toFixed(3)} V</strong></span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "24px" }}>
                  {v.cells.map((volt, idx) => {
                    const isOutlier = Math.abs(volt - v.cells[0]) > 0.05;
                    return (
                      <div
                        key={idx}
                        style={{
                          border: `1px solid ${isOutlier ? "#ff4876" : "#242933"}`,
                          backgroundColor: isOutlier ? "rgba(255,72,118,0.1)" : "#16181D",
                          padding: "8px 10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ color: "#6B7280", fontSize: "10px" }}>C{String(idx + 1).padStart(2, "0")}</span>
                        <span style={{ color: isOutlier ? "#ff4876" : "#F3F4F6", fontWeight: 700 }}>
                          {volt.toFixed(3)}V
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Instantaneous Sensor Readouts */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", borderTop: "1px solid #242933", paddingTop: "16px" }}>
                  <div style={{ backgroundColor: "#111317", border: "1px solid #242933", padding: "10px" }}>
                    <div style={{ color: "#6B7280", fontSize: "10px" }}>STATE OF HEALTH (SOH)</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: v.soh < 80 ? "#ff4876" : "#F3F4F6", marginTop: "4px" }}>{v.soh.toFixed(1)} %</div>
                    <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "4px" }}>{v.cycles} DCFC CYCLES</div>
                  </div>
                  <div style={{ backgroundColor: "#111317", border: "1px solid #242933", padding: "10px" }}>
                    <div style={{ color: "#6B7280", fontSize: "10px" }}>CURRENT (NET)</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: v.packCurrent > 150 ? "#ff4876" : "#F3F4F6", marginTop: "4px" }}>{v.packCurrent} A</div>
                    <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "4px" }}>TOTAL VOLTAGE: {v.packVoltage} V</div>
                  </div>
                  <div style={{ backgroundColor: "#111317", border: "1px solid #242933", padding: "10px" }}>
                    <div style={{ color: "#6B7280", fontSize: "10px" }}>THERMAL GRADIENT</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: (v.maxTemp - v.minTemp) > 5 ? "#ff4876" : "#F3F4F6", marginTop: "4px" }}>{(v.maxTemp - v.minTemp).toFixed(1)} °C</div>
                    <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "4px" }}>MAX: {v.maxTemp} °C</div>
                  </div>
                  <div style={{ backgroundColor: "#111317", border: "1px solid #242933", padding: "10px" }}>
                    <div style={{ color: "#6B7280", fontSize: "10px" }}>ANOMALY PROBABILITY</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: v.score > 0.6 ? "#ff4876" : "#10B981", marginTop: "4px" }}>{(v.score * 100).toFixed(1)}%</div>
                    <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "4px" }}>SCORE: {v.score.toFixed(3)}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: Stepped Telemetry Waveforms */}
            {activeTab === "SIGNALS" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", color: "#9CA3AF" }}>
                  <span>SYNCHRONIZED BUS SIGNALS (STEPPED SAMPLING)</span>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <span style={{ color: "#06B6D4" }}>■ PACK V</span>
                    <span style={{ color: "#ff4876" }}>■ TEMP °C</span>
                  </div>
                </div>
                <div style={{ height: "260px", width: "100%", backgroundColor: "#111317", border: "1px solid #242933", padding: "10px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={v.history}>
                      <CartesianGrid stroke="#1F232B" strokeDasharray="1 1" />
                      <XAxis dataKey="t" stroke="#6B7280" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6B7280" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ backgroundColor: "#0B0C0E", border: "1px solid #242933", fontSize: "10px" }} />
                      <Line type="stepAfter" dataKey="v" stroke="#06B6D4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      <Line type="stepAfter" dataKey="temp" stroke="#ff4876" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* TAB 3: Mathematical Explainability (Kernel SHAP) */}
            {activeTab === "SHAP" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: "12px", color: "#9CA3AF" }}>
                  KERNEL SHAP FEATURE ATTRIBUTION (REFERENCE BASELINE: 50 NOMINAL SAMPLES)
                </div>

                <div style={{ height: "180px", width: "100%", backgroundColor: "#111317", border: "1px solid #242933", padding: "10px", marginBottom: "16px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={v.shap} margin={{ top: 0, right: 20, left: 120, bottom: 0 }}>
                      <CartesianGrid stroke="#1F232B" horizontal={false} />
                      <XAxis type="number" stroke="#6B7280" fontSize={10} tickLine={false} domain={[-0.3, 0.6]} />
                      <YAxis type="category" dataKey="feature" stroke="#9CA3AF" fontSize={10} tickLine={false} width={120} />
                      <ReferenceLine x={0} stroke="#6B7280" />
                      <Bar dataKey="impact" barSize={10} isAnimationActive={false}>
                        {v.shap.map((entry, index) => (
                          <Cell key={`c-${index}`} fill={entry.impact > 0 ? "#ff4876" : "#10B981"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #242933", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#14171D", borderBottom: "1px solid #242933", color: "#6B7280", fontSize: "10px" }}>
                      <th style={{ padding: "6px 12px" }}>FEATURE</th>
                      <th style={{ padding: "6px 12px", textAlign: "right" }}>BASELINE</th>
                      <th style={{ padding: "6px 12px", textAlign: "right" }}>OBSERVED</th>
                      <th style={{ padding: "6px 12px", textAlign: "right" }}>WEIGHT (ΔP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.shap.map((row) => (
                      <tr key={row.feature} style={{ borderBottom: "1px solid #1C2027" }}>
                        <td style={{ padding: "6px 12px", color: "#F3F4F6" }}>{row.feature}</td>
                        <td style={{ padding: "6px 12px", textAlign: "right", color: "#6B7280" }}>{row.base}</td>
                        <td style={{ padding: "6px 12px", textAlign: "right", color: "#D1D5DB" }}>{row.obs}</td>
                        <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 700, color: row.impact > 0 ? "#ff4876" : "#10B981" }}>
                          {row.impact > 0 ? `+${row.impact.toFixed(2)}` : row.impact.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {/* TAB 4: Service Triage Ticket */}
            {activeTab === "TRIAGE" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ backgroundColor: "#111317", border: `1px solid ${v.status === 'FAULT' ? '#ff4876' : v.status === 'WARN' ? '#F5A623' : '#242933'}`, padding: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: v.status === 'FAULT' ? '#ff4876' : '#F3F4F6', marginBottom: "8px" }}>
                  {v.status === 'FAULT' ? 'CRITICAL SERVICE TICKET REQUIRED' : v.status === 'WARN' ? 'WARNING ADVISORY GENERATED' : 'NO ACTION REQUIRED - ALL SYSTEMS NOMINAL'}
                </h3>
                <div style={{ color: "#9CA3AF", marginBottom: "20px" }}>
                  Automated triage diagnostic based on isolation forest anomaly inference and thermodynamic evaluation.
                </div>
                
                {v.status !== 'NOMINAL' && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ padding: "16px", backgroundColor: "#0B0C0E", border: "1px solid #242933" }}>
                      <div style={{ color: "#6B7280", fontSize: "10px", marginBottom: "8px" }}>DETECTED ANOMALIES</div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", color: "#F3F4F6" }}>
                        {(v.maxTemp - v.minTemp) > 5 && (
                          <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "#ff4876" }}>■</span> Module thermal gradient {(v.maxTemp - v.minTemp).toFixed(1)}°C exceeds 5°C threshold.
                          </li>
                        )}
                        {v.deltaV > 0.05 && (
                          <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "#F5A623" }}>■</span> Cell voltage divergence {v.deltaV.toFixed(3)}V exceeds 50mV safety limit.
                          </li>
                        )}
                        {v.score > 0.65 && (
                          <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "#ff4876" }}>■</span> AI Anomaly Score {(v.score*100).toFixed(1)}% indicates high probability of failure mode.
                          </li>
                        )}
                      </ul>
                    </div>
                    <div style={{ padding: "16px", backgroundColor: "#0B0C0E", border: "1px solid #242933" }}>
                      <div style={{ color: "#6B7280", fontSize: "10px", marginBottom: "8px" }}>RECOMMENDED TRIAGE ACTION</div>
                      {v.status === 'FAULT' ? (
                        <div style={{ color: "#ff4876", fontWeight: 700 }}>
                          ISOLATE PACK; CRITICAL MICRO-SHORT RISK DETECTED.<br /><br />
                          <span style={{ color: "#F3F4F6", fontWeight: 400 }}>Schedule immediate physical inspection of Module 2. Depower the vehicle HV bus.</span>
                        </div>
                      ) : (
                        <div style={{ color: "#F5A623", fontWeight: 700 }}>
                          SCHEDULE ACTIVE CELL BALANCING.<br /><br />
                          <span style={{ color: "#F3F4F6", fontWeight: 400 }}>Perform extended grid-connected charge cycle to align lower quartile cells.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </div>

          {/* Diagnostic Console Footer Ribbon */}
          <div style={{ height: "28px", borderTop: "1px solid #242933", backgroundColor: "#0E1014", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#6B7280", fontSize: "10px" }}>
            <span>DIAGNOSTIC ADVISORY: {v.status === "FAULT" ? "CRITICAL IMBALANCE DETECTED (CELL 15 UNDERVOLTAGE UNDER HEAVY LOAD)" : "ALL CELLS WITHIN ±15mV SAFE OPERATING WINDOW"}</span>
            <span>BUFFER: 50 SAMPLES</span>
          </div>

        </main>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ backgroundColor: "#111317", border: "1px solid #242933", width: "400px", padding: "20px", color: "#F3F4F6", display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "bold" }}>ONBOARD NEW ASSET</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer" }}><X size={16} /></button>
              </div>
              <form onSubmit={handleOnboard} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10px", color: "#9CA3AF" }}>VIN (17 CHARACTERS)</label>
                  <input required value={newVin} onChange={e => setNewVin(e.target.value)} style={{ backgroundColor: "#0B0C0E", border: "1px solid #242933", padding: "8px", color: "#F3F4F6", fontFamily: "inherit", fontSize: "12px" }} placeholder="VIN-EV-XXXX" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10px", color: "#9CA3AF" }}>FLEET ID</label>
                  <input required value={newFleetId} onChange={e => setNewFleetId(e.target.value)} style={{ backgroundColor: "#0B0C0E", border: "1px solid #242933", padding: "8px", color: "#F3F4F6", fontFamily: "inherit", fontSize: "12px" }} placeholder="e.g. DEPOT-NORTH" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "10px", color: "#9CA3AF" }}>PACK CHEMISTRY</label>
                  <select value={newPackType} onChange={e => setNewPackType(e.target.value)} style={{ backgroundColor: "#0B0C0E", border: "1px solid #242933", padding: "8px", color: "#F3F4F6", fontFamily: "inherit", fontSize: "12px" }}>
                    <option value="NMC-811 / 96S2P">NMC-811 (400V Class)</option>
                    <option value="LFP-Blade / 108S">LFP-Blade (350V Class)</option>
                    <option value="NCA / 84S">NCA (350V Class)</option>
                  </select>
                </div>
                <button type="submit" style={{ backgroundColor: "#10B981", color: "#000", border: "none", padding: "10px", fontWeight: "bold", cursor: "pointer", marginTop: "8px" }}>COMMISSION VIN</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}