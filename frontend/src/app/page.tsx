'use client';

import { useState, useEffect } from "react";
import FleetMatrix from "@/components/FleetMatrix";
import DiagnosticsPanel from "@/components/DiagnosticsPanel";
import AttributionTable from "@/components/AttributionTable";
import AlertsPanel from "@/components/AlertsPanel";
import TelemetryLog from "@/components/TelemetryLog";
import PackHeatmap from "@/components/PackHeatmap";
import AITriageAdvisory from "@/components/AITriageAdvisory";
import EdgeGatewayCard from "@/components/EdgeGatewayCard";
import { Activity, AlertTriangle, ShieldCheck, Grid, Zap, Layers, Car, Bell } from "lucide-react";

function formatTimestamp(ts: string | number | undefined): string {
    if (!ts) return new Date().toISOString();
    const date = new Date(ts);
    if (!isNaN(date.getTime())) return date.toISOString();
    const dateFromSec = new Date(Number(ts) * 1000);
    if (!isNaN(dateFromSec.getTime())) return dateFromSec.toISOString();
    return String(ts);
}

export interface ShapDriver {
    feature: string;
    impact: number;
    observed: string;
}

export interface VehicleRecord {
    vin: string;
    timestamp: string | number;
    packVoltage: number;
    packCurrent: number;
    maxTemp: number;
    deltaV: number;
    status: string;
    score: number;
    shap: ShapDriver[];
}

export default function SCADAConsole() {
    const [fleet, setFleet] = useState<VehicleRecord[]>([]);
    const [selectedVin, setSelectedVin] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [telemetryLogs, setTelemetryLogs] = useState<VehicleRecord[]>([]);
    const [probeView, setProbeView] = useState<"gauges" | "thermal" | "split">("gauges");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "CRITICAL" | "NOMINAL">("ALL");
    const [sidebarTab, setSidebarTab] = useState<"FLEET" | "ALERTS">("FLEET");

    const fetchFleet = async () => {
        try {
            const res = await fetch("/api/fleet");
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();

            setLoading(false);
            if (data.data && data.data.length > 0) {
                setFleet(data.data);

                // Add to log stream
                setTelemetryLogs(prev => {
                    const newLogs = [...prev, ...data.data].slice(-150);
                    return newLogs;
                });

                // Auto-select first anomaly, or first vehicle if none selected
                setSelectedVin(current => {
                    if (current) return current;
                    const anomaly = data.data.find((v: VehicleRecord) => v.status === "FAULT" || v.status === "WARN");
                    return anomaly ? anomaly.vin : data.data[0].vin;
                });
            }
        } catch (err: any) {
            console.error("Fleet query failure:", err);
            setError("Failed to poll DynamoDB telemetry stream.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFleet();
        const pollTimer = setInterval(fetchFleet, 5000);
        return () => clearInterval(pollTimer);
    }, []);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await fetchFleet();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleSimulateBurst = () => {
        if (fleet.length === 0) return;
        const baseVehicle = activeVehicle || fleet[0];
        const now = Date.now();
        const burst: VehicleRecord[] = [];

        for (let i = 0; i < 6; i++) {
            const jitter = (Math.random() - 0.5) * 0.05;
            burst.push({
                ...baseVehicle,
                timestamp: now - (5 - i) * 200,
                packVoltage: +(baseVehicle.packVoltage + jitter).toFixed(3),
                packCurrent: +(baseVehicle.packCurrent + (Math.random() - 0.5) * 4).toFixed(1),
                deltaV: +(baseVehicle.deltaV + Math.random() * 0.004).toFixed(4),
            });
        }

        setTelemetryLogs(prev => [...prev, ...burst].slice(-180));
    };

    const activeVehicle = fleet.find((v) => v.vin === selectedVin) || null;
    const faultCount = fleet.filter(v => v.status === "FAULT" || v.status === "WARN").length;
    const systemHealth = fleet.length > 0 ? (100 - (faultCount / fleet.length) * 100).toFixed(1) : "100.0";

    const avgTemp = fleet.length > 0 ? (fleet.reduce((acc, v) => acc + v.maxTemp, 0) / fleet.length).toFixed(1) : "0.0";
    const avgDeltaV = fleet.length > 0 ? ((fleet.reduce((acc, v) => acc + v.deltaV, 0) / fleet.length) * 1000).toFixed(0) : "0";

    const filteredFleet = fleet.filter(v => {
        if (filterStatus === "CRITICAL") return v.status === "FAULT" || v.status === "WARN";
        if (filterStatus === "NOMINAL") return v.status === "NOMINAL";
        return true;
    });

    if (loading && fleet.length === 0) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-[#ECEEEA] font-mono text-sm text-[#0F131A]">
                <div className="neo-card p-6 bg-white border-2 border-[#1E2229] shadow-[4px_4px_0_0_#1E2229] flex items-center space-x-3">
                    <span className="w-2.5 h-2.5 bg-[#059669] animate-ping" />
                    <span className="font-mono font-black tracking-wider text-[#0F131A]">INITIALIZING_OHMNIC_SCADA_DECK...</span>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen w-full flex flex-col bg-[#ECEEEA] text-[#0F131A]">
            {/* Top Light Chassis Header Bar */}
            <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center justify-between border-b-2 border-[#1E2229] px-5 py-2 bg-white shadow-[0_4px_0_0_#1E2229]">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    {/* Brand / Heartbeat Pill */}
                    <div className="flex items-center space-x-2 bg-[#ECEEEA] border-2 border-[#1E2229] px-3 py-1 shadow-[2px_2px_0_0_#1E2229]">
                        <div className="w-2 h-2 bg-[#059669] animate-pulse" />
                        <span className="font-mono text-xs font-black tracking-wider text-[#0F131A]">
                            OHMNIC SCADA <span className="text-[#6B7280] font-normal">// v1.2-LIVE</span>
                        </span>
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-[#1E2229]" />

                    {/* Aggregate Counter: Active Fleet */}
                    <div className="flex items-center space-x-2">
                        <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span className="text-[10px] font-mono text-[#4B5565] uppercase font-bold">FLEET:</span>
                        <span className="font-mono font-black text-xs text-[#2563EB] bg-[#ECEEEA] px-2 py-0.5 border border-[#1E2229]">
                            {fleet.length} UNITS
                        </span>
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-[#1E2229]" />

                    {/* Aggregate Counter: Critical Tickets */}
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className={`w-3.5 h-3.5 ${faultCount > 0 ? "text-[#DC2626]" : "text-[#6B7280]"}`} />
                        <span className="text-[10px] font-mono text-[#4B5565] uppercase font-bold">TICKETS:</span>
                        <span className={`font-mono font-black text-xs px-2 py-0.5 border border-[#1E2229] ${
                            faultCount > 0 
                                ? "bg-[#FEE2E2] text-[#DC2626] animate-pulse" 
                                : "bg-[#ECEEEA] text-[#4B5565]"
                        }`}>
                            {faultCount} ALERTS
                        </span>
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-[#1E2229]" />

                    {/* Aggregate Counter: Health Index */}
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                        <span className="text-[10px] font-mono text-[#4B5565] uppercase font-bold">HEALTH:</span>
                        <span className="font-mono font-black text-xs text-[#059669] bg-[#ECEEEA] px-2 py-0.5 border border-[#1E2229]">
                            {systemHealth}%
                        </span>
                    </div>
                </div>

                {/* Right Status Pill */}
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    <span className="text-[9px] font-mono bg-[#ECEEEA] text-[#0F131A] px-2.5 py-1 border border-[#1E2229] shadow-[2px_2px_0_0_#1E2229] font-bold">
                        INGESTION: <strong className="text-[#2563EB]">AWS SQS / LAMBDA</strong>
                    </span>
                    <span className="text-[9px] font-mono bg-white text-[#059669] px-2 py-1 border border-[#1E2229] font-bold flex items-center shadow-[1px_1px_0_0_#1E2229]">
                        <span className="w-1.5 h-1.5 bg-[#059669] mr-1.5" /> 200_OK
                    </span>
                </div>
            </header>

            {/* Main Bento Grid */}
            <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Column 1: Fleet Assets & Anomaly Queue (lg:col-span-4) */}
                <section className="lg:col-span-4 flex flex-col gap-4">
                    
                    {/* Fleet Assets Master Panel */}
                    <div className="neo-card h-[490px] flex flex-col bg-white">
                        {/* Section Header with Tabs */}
                        <div className="bg-[#DFE3DC] px-3 py-1.5 border-b-2 border-[#1E2229] flex justify-between items-center shrink-0">
                            <div className="flex space-x-1.5">
                                <button
                                    onClick={() => setSidebarTab("FLEET")}
                                    className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase transition-all border border-[#1E2229] ${
                                        sidebarTab === "FLEET"
                                            ? "bg-white text-[#0F131A] shadow-[1px_1px_0_0_#1E2229]"
                                            : "bg-[#ECEEEA] text-[#4B5565] hover:bg-white"
                                    }`}
                                >
                                    <Car className="w-2.5 h-2.5 inline mr-1 text-[#2563EB]" />
                                    ASSETS ({fleet.length})
                                </button>
                                <button
                                    onClick={() => setSidebarTab("ALERTS")}
                                    className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase transition-all border border-[#1E2229] ${
                                        sidebarTab === "ALERTS"
                                            ? "bg-white text-[#DC2626] shadow-[1px_1px_0_0_#1E2229]"
                                            : "bg-[#ECEEEA] text-[#4B5565] hover:bg-white"
                                    }`}
                                >
                                    <Bell className="w-2.5 h-2.5 inline mr-1 text-[#D97706]" />
                                    TICKETS ({faultCount})
                                </button>
                            </div>
                            <span className="text-[8px] font-mono bg-white text-[#059669] px-1.5 py-0.5 border border-[#1E2229] font-bold">
                                SQS_FIFO
                            </span>
                        </div>

                        {/* Status Filters */}
                        {sidebarTab === "FLEET" && (
                            <div className="px-3 pt-2.5 pb-2 flex gap-1.5 border-b border-[#1E2229]/20 bg-[#ECEEEA]">
                                <button 
                                    onClick={() => setFilterStatus("ALL")}
                                    className={`text-[8px] font-mono font-black px-2 py-0.5 border border-[#1E2229] transition-all ${
                                        filterStatus === "ALL" 
                                            ? "bg-white text-[#0F131A] shadow-[1px_1px_0_0_#1E2229]" 
                                            : "bg-[#ECEEEA] text-[#4B5565] hover:bg-white"
                                    }`}
                                >
                                    ALL ({fleet.length})
                                </button>
                                <button 
                                    onClick={() => setFilterStatus("CRITICAL")}
                                    className={`text-[8px] font-mono font-black px-2 py-0.5 border border-[#1E2229] transition-all ${
                                        filterStatus === "CRITICAL" 
                                            ? "bg-[#FEE2E2] text-[#DC2626] shadow-[1px_1px_0_0_#1E2229]" 
                                            : "bg-[#ECEEEA] text-[#4B5565] hover:bg-white"
                                    }`}
                                >
                                    ALERTS ({faultCount})
                                </button>
                                <button 
                                    onClick={() => setFilterStatus("NOMINAL")}
                                    className={`text-[8px] font-mono font-black px-2 py-0.5 border border-[#1E2229] transition-all ${
                                        filterStatus === "NOMINAL" 
                                            ? "bg-[#E2F7ED] text-[#059669] shadow-[1px_1px_0_0_#1E2229]" 
                                            : "bg-[#ECEEEA] text-[#4B5565] hover:bg-white"
                                    }`}
                                >
                                    NOMINAL ({fleet.length - faultCount})
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="text-[10px] font-mono border-2 border-[#DC2626] bg-[#FEE2E2] text-[#DC2626] p-2 m-2">
                                {error}
                            </div>
                        )}

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-2.5 bg-white">
                            {sidebarTab === "FLEET" ? (
                                <FleetMatrix 
                                    vehicles={filteredFleet} 
                                    selectedVin={selectedVin} 
                                    onSelectVin={setSelectedVin} 
                                />
                            ) : (
                                <AlertsPanel 
                                    fleet={fleet} 
                                    onSelectVin={(vin) => {
                                        setSelectedVin(vin);
                                        setSidebarTab("FLEET");
                                    }} 
                                />
                            )}
                        </div>

                        {/* Fleet Dispersion Summary Footer */}
                        <div className="border-t-2 border-[#1E2229] p-2.5 shrink-0 bg-[#ECEEEA]">
                            <div className="flex justify-between items-center text-[9px] font-mono mb-1 font-bold">
                                <span className="text-[#4B5565] uppercase">FLEET DISPERSION</span>
                                <span className="text-[#059669]">
                                    {fleet.length > 0 ? `${(((fleet.length - faultCount) / fleet.length) * 100).toFixed(0)}% HEALTHY` : "0%"}
                                </span>
                            </div>
                            {/* Recessed Mechanical Dispersion Track */}
                            <div className="w-full bg-white h-3 border-2 border-[#1E2229] flex p-[1px] overflow-hidden">
                                <div 
                                    style={{ width: `${fleet.length > 0 ? ((fleet.length - faultCount) / fleet.length) * 100 : 100}%` }} 
                                    className="bg-[#059669] h-full" 
                                />
                                <div 
                                    style={{ width: `${fleet.length > 0 ? (faultCount / fleet.length) * 100 : 0}%` }} 
                                    className="bg-[#DC2626] h-full" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[8px] font-mono text-[#4B5565] mt-1.5 font-bold">
                                <div>AVG TEMP: <strong className="text-[#0F131A] font-mono font-black">{avgTemp}°C</strong></div>
                                <div className="text-right">AVG ΔV: <strong className="text-[#0F131A] font-mono font-black">{avgDeltaV} mV</strong></div>
                            </div>
                        </div>
                    </div>

                    {/* Edge Ingestion Gateway Card */}
                    <div className="neo-card h-[290px] overflow-hidden flex flex-col bg-white">
                        <EdgeGatewayCard 
                            fleetCount={fleet.length} 
                            faultCount={faultCount} 
                            onRefresh={handleManualRefresh}
                            onSimulateBurst={handleSimulateBurst}
                            isRefreshing={isRefreshing}
                        />
                    </div>
                </section>

                {/* Column 2: Vehicle Operations & Telemetry Bench (lg:col-span-8) */}
                <section className="lg:col-span-8 flex flex-col gap-4 min-w-0">
                    {activeVehicle ? (
                        <div className="flex flex-col gap-4">
                            
                            {/* Probe Banner with View Mode Selector */}
                            <div className="neo-card bg-white p-3 flex flex-wrap justify-between items-center gap-2">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2.5 h-2.5 ${
                                            activeVehicle.status === "FAULT" 
                                                ? "bg-[#DC2626] animate-ping" 
                                                : activeVehicle.status === "WARN" 
                                                ? "bg-[#D97706]" 
                                                : "bg-[#059669]"
                                        }`} />
                                        <h3 className="text-base font-mono font-black text-[#0F131A] tracking-wider uppercase">
                                            PROBE // <span className="text-[#2563EB]">{activeVehicle.vin}</span>
                                        </h3>
                                        <span className={`text-[9px] font-mono font-black px-2 py-0.5 border border-[#1E2229] ${
                                            activeVehicle.status === "FAULT"
                                                ? "bg-[#FEE2E2] text-[#DC2626]"
                                                : activeVehicle.status === "WARN"
                                                ? "bg-[#FEF3C7] text-[#D97706]"
                                                : "bg-[#E2F7ED] text-[#059669]"
                                        }`}>
                                            {activeVehicle.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-[9px] font-mono text-[#4B5565] bg-[#ECEEEA] px-2 py-0.5 border border-[#1E2229]">
                                            LAST_TX: <span className="font-mono font-bold text-[#0F131A]">{formatTimestamp(activeVehicle.timestamp)}</span>
                                        </span>
                                        <span className="text-[9px] font-mono text-[#4B5565] bg-[#ECEEEA] px-2 py-0.5 border border-[#1E2229]">
                                            HEALTH: <span className="font-mono font-black text-[#059669]">{(100 - (activeVehicle.score * 100)).toFixed(1)}%</span>
                                        </span>
                                    </div>
                                </div>

                                {/* View Switcher Buttons */}
                                <div className="flex items-center bg-[#ECEEEA] p-1 border-2 border-[#1E2229] space-x-1 shadow-[2px_2px_0_0_#1E2229]">
                                    <button 
                                        onClick={() => setProbeView("gauges")}
                                        className={`px-2.5 py-1 text-[9px] font-mono tracking-wider uppercase transition-all flex items-center font-bold ${
                                            probeView === "gauges" 
                                                ? "bg-white text-[#2563EB] border border-[#1E2229] shadow-[1px_1px_0_0_#1E2229]" 
                                                : "text-[#4B5565] hover:text-[#0F131A]"
                                        }`}
                                    >
                                        <Zap className="w-3 h-3 mr-1 text-[#2563EB]" /> Gauges
                                    </button>
                                    <button 
                                        onClick={() => setProbeView("thermal")}
                                        className={`px-2.5 py-1 text-[9px] font-mono tracking-wider uppercase transition-all flex items-center font-bold ${
                                            probeView === "thermal" 
                                                ? "bg-white text-[#D97706] border border-[#1E2229] shadow-[1px_1px_0_0_#1E2229]" 
                                                : "text-[#4B5565] hover:text-[#0F131A]"
                                        }`}
                                    >
                                        <Grid className="w-3 h-3 mr-1 text-[#D97706]" /> Thermal Matrix
                                    </button>
                                    <button 
                                        onClick={() => setProbeView("split")}
                                        className={`px-2.5 py-1 text-[9px] font-mono tracking-wider uppercase transition-all flex items-center font-bold ${
                                            probeView === "split" 
                                                ? "bg-white text-[#059669] border border-[#1E2229] shadow-[1px_1px_0_0_#1E2229]" 
                                                : "text-[#4B5565] hover:text-[#0F131A]"
                                        }`}
                                    >
                                        <Layers className="w-3 h-3 mr-1 text-[#059669]" /> Dual View
                                    </button>
                                </div>
                            </div>

                            {/* Top Hero Section: Telemetry Gauges / Thermal Matrix */}
                            {probeView === "gauges" && (
                                <div className="neo-card bg-white min-h-[270px] overflow-hidden">
                                    <DiagnosticsPanel 
                                        vehicle={activeVehicle} 
                                        onSwitchToThermal={() => setProbeView("thermal")} 
                                    />
                                </div>
                            )}

                            {probeView === "thermal" && (
                                <div className="neo-card bg-white min-h-[270px] overflow-hidden">
                                    <PackHeatmap 
                                        vehicle={activeVehicle} 
                                        onSwitchToGauges={() => setProbeView("gauges")} 
                                    />
                                </div>
                            )}

                            {probeView === "split" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="neo-card bg-white min-h-[270px] overflow-hidden">
                                        <DiagnosticsPanel vehicle={activeVehicle} />
                                    </div>
                                    <div className="neo-card bg-white min-h-[270px] overflow-hidden">
                                        <PackHeatmap vehicle={activeVehicle} />
                                    </div>
                                </div>
                            )}

                            {/* Middle Section: AI Triage and TreeSHAP Diagnostics */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[260px]">
                                <div className="md:col-span-5 neo-card overflow-hidden flex flex-col bg-white">
                                    <AITriageAdvisory vehicle={activeVehicle} />
                                </div>
                                <div className="md:col-span-7 neo-card overflow-hidden flex flex-col bg-white">
                                    <AttributionTable shap={activeVehicle.shap} anomalyScore={activeVehicle.score} />
                                </div>
                            </div>

                            {/* Bottom Hero Section: Docked Raw CAN Telemetry Stream */}
                            <div className="neo-card h-[220px] overflow-hidden flex flex-col bg-white">
                                <TelemetryLog fleet={telemetryLogs} selectedVin={selectedVin} />
                            </div>

                        </div>
                    ) : (
                        <div className="neo-card min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-white space-y-4">
                            <div className="w-16 h-16 border-2 border-[#1E2229] bg-[#ECEEEA] flex items-center justify-center shadow-[4px_4px_0_0_#1E2229]">
                                <Activity className="w-8 h-8 text-[#2563EB]" />
                            </div>
                            <span className="text-xl font-mono font-black tracking-widest text-[#0F131A]">NO ASSET SELECTED</span>
                            <p className="font-mono text-xs text-[#4B5565] max-w-sm">
                                Select an EV asset from the Fleet Matrix on the left to initiate telemetry diagnostics.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
