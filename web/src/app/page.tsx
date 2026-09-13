"use client";

import React, { useState, useEffect, useMemo } from "react";
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

interface Vehicle {
  vin: string;
  packType: string;
  soc: number;
  packVoltage: number;
  packCurrent: number;
  maxTemp: number;
  minTemp: number;
  deltaV: number;
  score: number;
  status: "NOMINAL" | "WARN" | "FAULT";
  cells: number[]; // 24 representative cell voltages
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
  const [fleet] = useState<Vehicle[]>(SEED_FLEET);
  const [selectedVin, setSelectedVin] = useState<string>("VIN-EV-1001");
  const [activeTab, setActiveTab] = useState<"SIGNALS" | "CELLS" | "SHAP">("CELLS");

  useEffect(() => {
    setMounted(true);
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
      <header style={{ height: "36px", borderBottom: "1px solid #242933", backgroundColor: "#111317", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontWeight: 800, letterSpacing: "0.05em", color: "#F3F4F6" }}>ΩHMNIC // BMS-RTX</span>
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
        </div>
      </header>

      {/* 2. Main Workbench */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "480px 1fr", overflow: "hidden" }}>

        {/* LEFT COLUMN: High-Density Telemetry Matrix */}
        <aside style={{ borderRight: "1px solid #242933", backgroundColor: "#0E1014", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Table Controls */}
          <div style={{ height: "30px", borderBottom: "1px solid #242933", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#14171D", color: "#9CA3AF", fontSize: "10px" }}>
            <span>FLEET STATUS ({fleet.length} MONITORED UNITS)</span>
            <span style={{ color: "#6B7280" }}>SORT: SEVERITY DESC</span>
          </div>

          {/* Table Header */}
          <div style={{ display: "grid", gridTemplateColumns: "110px 55px 70px 65px 75px 1fr", padding: "6px 12px", borderBottom: "1px solid #242933", color: "#6B7280", fontSize: "10px", fontWeight: 700 }}>
            <div>VIN</div>
            <div style={{ textAlign: "right" }}>SOC</div>
            <div style={{ textAlign: "right" }}>V_PACK</div>
            <div style={{ textAlign: "right" }}>T_MAX</div>
            <div style={{ textAlign: "right" }}>ΔV_CELL</div>
            <div style={{ textAlign: "right" }}>SCORE</div>
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
                  onClick={() => setSelectedVin(item.vin)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "110px 55px 70px 65px 75px 1fr",
                    padding: "8px 12px",
                    borderBottom: "1px solid #191D24",
                    backgroundColor: isSelected ? "#1F232B" : "transparent",
                    cursor: "pointer",
                    alignItems: "center",
                    borderLeft: isSelected ? "2px solid #06B6D4" : "2px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{
                      width: "6px",
                      height: "6px",
                      backgroundColor: isFault ? "#ff4876" : isWarn ? "#F5A623" : "#10B981"
                    }} />
                    <span style={{ color: isSelected ? "#F3F4F6" : "#D1D5DB", fontWeight: 600 }}>{item.vin}</span>
                  </div>
                  <div style={{ textAlign: "right", color: "#9CA3AF" }}>{item.soc}%</div>
                  <div style={{ textAlign: "right", color: "#D1D5DB" }}>{item.packVoltage.toFixed(1)}V</div>
                  <div style={{ textAlign: "right", color: item.maxTemp > 50 ? "#ff4876" : "#9CA3AF" }}>{item.maxTemp}°C</div>
                  <div style={{ textAlign: "right", color: item.deltaV > 0.1 ? "#ff4876" : item.deltaV > 0.03 ? "#F5A623" : "#10B981", fontWeight: 700 }}>
                    {item.deltaV.toFixed(3)}
                  </div>
                  <div style={{ textAlign: "right", color: isFault ? "#ff4876" : "#6B7280", fontWeight: 700 }}>
                    {item.score.toFixed(3)}
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
              {(["CELLS", "SIGNALS", "SHAP"] as const).map((tab) => (
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

            {/* TAB 1: 24-Cell Series Voltage Ladder */}
            {activeTab === "CELLS" && (
              <div>
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
                    <div style={{ color: "#6B7280", fontSize: "10px" }}>TOTAL VOLTAGE</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#F3F4F6", marginTop: "4px" }}>{v.packVoltage} V</div>
                  </div>
                  <div style={{ backgroundColor: "#111317", border: "1px solid #242933", padding: "10px" }}>
                    <div style={{ color: "#6B7280", fontSize: "10px" }}>CURRENT (NET)</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: v.packCurrent > 150 ? "#ff4876" : "#F3F4F6", marginTop: "4px" }}>{v.packCurrent} A</div>
                  </div>
                  <div style={{ backgroundColor: "#111317", border: "1px solid #242933", padding: "10px" }}>
                    <div style={{ color: "#6B7280", fontSize: "10px" }}>THERMAL GRADIENT</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#F3F4F6", marginTop: "4px" }}>{(v.maxTemp - v.minTemp).toFixed(1)} °C</div>
                  </div>
                  <div style={{ backgroundColor: "#111317", border: "1px solid #242933", padding: "10px" }}>
                    <div style={{ color: "#6B7280", fontSize: "10px" }}>ANOMALY PROBABILITY</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: v.score > 0.6 ? "#ff4876" : "#10B981", marginTop: "4px" }}>{(v.score * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Stepped Telemetry Waveforms */}
            {activeTab === "SIGNALS" && (
              <div>
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
              </div>
            )}

            {/* TAB 3: Mathematical Explainability (Kernel SHAP) */}
            {activeTab === "SHAP" && (
              <div>
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
              </div>
            )}

          </div>

          {/* Diagnostic Console Footer Ribbon */}
          <div style={{ height: "28px", borderTop: "1px solid #242933", backgroundColor: "#0E1014", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#6B7280", fontSize: "10px" }}>
            <span>DIAGNOSTIC ADVISORY: {v.status === "FAULT" ? "CRITICAL IMBALANCE DETECTED (CELL 15 UNDERVOLTAGE UNDER HEAVY LOAD)" : "ALL CELLS WITHIN ±15mV SAFE OPERATING WINDOW"}</span>
            <span>BUFFER: 50 SAMPLES</span>
          </div>

        </main>
      </div>
    </div>
  );
}