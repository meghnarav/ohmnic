'use client';

import { useState, useEffect } from 'react';
import FleetMatrix from '@/components/FleetMatrix';
import DiagnosticsPanel from '@/components/DiagnosticsPanel';
import AttributionTable from '@/components/AttributionTable';
import AlertsPanel from '@/components/AlertsPanel';
import TelemetryLog from '@/components/TelemetryLog';
import PackHeatmap from '@/components/PackHeatmap';
import AITriageAdvisory from '@/components/AITriageAdvisory';
import EdgeGatewayCard from '@/components/EdgeGatewayCard';
import { Activity, AlertTriangle, ShieldCheck, Grid, Zap, Layers, Car, Bell } from 'lucide-react';

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
    const [probeView, setProbeView] = useState<'gauges' | 'thermal' | 'split'>('gauges');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'CRITICAL' | 'NOMINAL'>('ALL');
    const [sidebarTab, setSidebarTab] = useState<'FLEET' | 'ALERTS'>('FLEET');

    const fetchFleet = async () => {
        try {
            const res = await fetch('/api/fleet');
            if (!res.ok) throw new Error('API Error');
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
                    const anomaly = data.data.find((v: VehicleRecord) => v.status === 'FAULT' || v.status === 'WARN');
                    return anomaly ? anomaly.vin : data.data[0].vin;
                });
            }
        } catch (err: any) {
            console.error('Fleet query failure:', err);
            setError('Failed to poll DynamoDB telemetry stream.');
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
    const faultCount = fleet.filter(v => v.status === 'FAULT' || v.status === 'WARN').length;
    const systemHealth = fleet.length > 0 ? (100 - (faultCount / fleet.length) * 100).toFixed(1) : '100.0';

    const avgTemp = fleet.length > 0 ? (fleet.reduce((acc, v) => acc + v.maxTemp, 0) / fleet.length).toFixed(1) : '0.0';
    const avgDeltaV = fleet.length > 0 ? ((fleet.reduce((acc, v) => acc + v.deltaV, 0) / fleet.length) * 1000).toFixed(0) : '0';

    const filteredFleet = fleet.filter(v => {
        if (filterStatus === 'CRITICAL') return v.status === 'FAULT' || v.status === 'WARN';
        if (filterStatus === 'NOMINAL') return v.status === 'NOMINAL';
        return true;
    });

    if (loading && fleet.length === 0) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-[#0F1117] font-mono text-xl text-[#F3F4F6]">
                <div className="neo-card p-6 bg-[#161922] border border-[#2A2E3D] shadow-[4px_4px_0_0_#000] flex items-center space-x-3">
                    <span className="w-3 h-3 bg-[#10B981] animate-ping" />
                    <span>INITIALIZING_OHMNIC_SCADA_DECK...</span>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen w-full flex flex-col bg-[#0F1117] text-[#F3F4F6]">
            {/* Top Compact Carbon Bar with Live Heartbeat Pill */}
            <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center justify-between border-b border-[#2A2E3D] px-5 py-2 bg-[#12141A] shadow-[0_2px_0_0_#000000]">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    {/* Brand / Heartbeat Pill */}
                    <div className="flex items-center space-x-2 bg-[#0D0F14] border border-[#2A2E3D] px-3 py-1 shadow-[2px_2px_0_0_#000]">
                        <div className="w-2.5 h-2.5 bg-[#10B981] animate-pulse rounded-full" />
                        <span className="font-mono text-xs font-black tracking-wider text-[#F3F4F6]">
                            OHMNIC SCADA <span className="text-[#64748B] font-normal">// v1.2-LIVE</span>
                        </span>
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-[#2A2E3D]" />

                    {/* Aggregate Counter: Active Fleet */}
                    <div className="flex items-center space-x-2">
                        <Activity className="w-3.5 h-3.5 text-[#06B6D4]" />
                        <span className="text-[10px] font-mono text-[#9CA3AF] uppercase">FLEET:</span>
                        <span className="text-xs font-mono font-bold text-[#06B6D4] bg-[#0D0F14] px-1.5 py-0.5 border border-[#2A2E3D]">
                            {fleet.length} UNITS
                        </span>
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-[#2A2E3D]" />

                    {/* Aggregate Counter: Critical Tickets */}
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className={`w-3.5 h-3.5 ${faultCount > 0 ? 'text-[#EF4444]' : 'text-[#64748B]'}`} />
                        <span className="text-[10px] font-mono text-[#9CA3AF] uppercase">TICKETS:</span>
                        <span className={`text-xs font-mono font-bold px-1.5 py-0.5 border ${
                            faultCount > 0 
                                ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/40 animate-pulse' 
                                : 'bg-[#0D0F14] text-[#64748B] border-[#2A2E3D]'
                        }`}>
                            {faultCount} ALERTS
                        </span>
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-[#2A2E3D]" />

                    {/* Aggregate Counter: Health Index */}
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                        <span className="text-[10px] font-mono text-[#9CA3AF] uppercase">HEALTH:</span>
                        <span className="text-xs font-mono font-bold text-[#10B981] bg-[#0D0F14] px-1.5 py-0.5 border border-[#2A2E3D]">
                            {systemHealth}%
                        </span>
                    </div>
                </div>

                {/* Right Status Pill */}
                <div className="flex items-center space-x-2.5 mt-2 sm:mt-0">
                    <span className="text-[9px] font-mono bg-[#0D0F14] text-[#9CA3AF] px-2.5 py-1 border border-[#2A2E3D] shadow-[2px_2px_0_0_#000]">
                        QUEUE: <strong className="text-[#06B6D4]">AWS SQS / LAMBDA</strong>
                    </span>
                    <span className="text-[9px] font-mono bg-[#0D0F14] text-[#10B981] px-2 py-1 border border-[#10B981]/40 flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#10B981] mr-1.5 rounded-full" /> 200_OK
                    </span>
                </div>
            </header>

            {/* Main Cyber-Industrial Bento Grid */}
            <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Column 1: Fleet Assets & Anomaly Queue (lg:col-span-4) */}
                <section className="lg:col-span-4 flex flex-col gap-4">
                    
                    {/* Fleet Assets Master Panel */}
                    <div className="neo-card h-[490px] flex flex-col p-3.5 bg-[#161922]">
                        {/* Section Header with Tabs */}
                        <div className="border-b border-[#2A2E3D] pb-2.5 mb-2.5">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => setSidebarTab('FLEET')}
                                        className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all border ${
                                            sidebarTab === 'FLEET'
                                                ? 'bg-[#1C202B] text-[#06B6D4] border-[#06B6D4]'
                                                : 'bg-[#0D0F14] text-[#9CA3AF] border-[#2A2E3D] hover:text-[#F3F4F6]'
                                        }`}
                                    >
                                        <Car className="w-3 h-3 inline mr-1" />
                                        FLEET MATRIX ({fleet.length})
                                    </button>
                                    <button
                                        onClick={() => setSidebarTab('ALERTS')}
                                        className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all border ${
                                            sidebarTab === 'ALERTS'
                                                ? 'bg-[#1C202B] text-[#EF4444] border-[#EF4444]'
                                                : 'bg-[#0D0F14] text-[#9CA3AF] border-[#2A2E3D] hover:text-[#F3F4F6]'
                                        }`}
                                    >
                                        <Bell className="w-3 h-3 inline mr-1" />
                                        TICKETS ({faultCount})
                                    </button>
                                </div>
                                <span className="text-[9px] font-mono bg-[#0D0F14] text-[#10B981] px-1.5 py-0.5 border border-[#10B981]/40">
                                    LIVE_STREAM
                                </span>
                            </div>

                            {/* Status Filters */}
                            {sidebarTab === 'FLEET' && (
                                <div className="flex gap-1.5 pt-1">
                                    <button 
                                        onClick={() => setFilterStatus('ALL')}
                                        className={`text-[9px] font-mono font-bold px-2 py-0.5 border transition-all ${
                                            filterStatus === 'ALL' 
                                                ? 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]' 
                                                : 'bg-[#0D0F14] text-[#64748B] border-[#2A2E3D] hover:text-[#F3F4F6]'
                                        }`}
                                    >
                                        ALL ({fleet.length})
                                    </button>
                                    <button 
                                        onClick={() => setFilterStatus('CRITICAL')}
                                        className={`text-[9px] font-mono font-bold px-2 py-0.5 border transition-all ${
                                            filterStatus === 'CRITICAL' 
                                                ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]' 
                                                : 'bg-[#0D0F14] text-[#64748B] border-[#2A2E3D] hover:text-[#F3F4F6]'
                                        }`}
                                    >
                                        ALERTS ({faultCount})
                                    </button>
                                    <button 
                                        onClick={() => setFilterStatus('NOMINAL')}
                                        className={`text-[9px] font-mono font-bold px-2 py-0.5 border transition-all ${
                                            filterStatus === 'NOMINAL' 
                                                ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]' 
                                                : 'bg-[#0D0F14] text-[#64748B] border-[#2A2E3D] hover:text-[#F3F4F6]'
                                        }`}
                                    >
                                        NOMINAL ({fleet.length - faultCount})
                                    </button>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="text-[10px] font-mono border border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444] p-2 mb-2">
                                {error}
                            </div>
                        )}

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto pr-1">
                            {sidebarTab === 'FLEET' ? (
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
                                        setSidebarTab('FLEET');
                                    }} 
                                />
                            )}
                        </div>

                        {/* Fleet Dispersion Summary Footer */}
                        <div className="border-t border-[#2A2E3D] pt-2 mt-2 shrink-0 bg-[#0D0F14] p-2">
                            <div className="flex justify-between items-center text-[9px] font-mono mb-1">
                                <span className="text-[#64748B] uppercase">FLEET HEALTH DISPERSION</span>
                                <span className="text-[#10B981] font-bold">
                                    {fleet.length > 0 ? `${(((fleet.length - faultCount) / fleet.length) * 100).toFixed(0)}% HEALTHY` : '0%'}
                                </span>
                            </div>
                            <div className="w-full bg-[#161922] h-1.5 border border-[#2A2E3D] flex overflow-hidden">
                                <div 
                                    style={{ width: `${fleet.length > 0 ? ((fleet.length - faultCount) / fleet.length) * 100 : 100}%` }} 
                                    className="bg-[#10B981] h-full" 
                                />
                                <div 
                                    style={{ width: `${fleet.length > 0 ? (faultCount / fleet.length) * 100 : 0}%` }} 
                                    className="bg-[#EF4444] h-full" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[8px] font-mono text-[#9CA3AF] mt-1.5">
                                <div>AVG TEMP: <strong className="text-[#F3F4F6]">{avgTemp}°C</strong></div>
                                <div className="text-right">AVG ΔV: <strong className="text-[#F3F4F6]">{avgDeltaV} mV</strong></div>
                            </div>
                        </div>
                    </div>

                    {/* Edge Ingestion Gateway Card */}
                    <div className="neo-card h-[290px] overflow-hidden flex flex-col">
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
                            <div className="neo-card p-3.5 bg-[#161922] flex flex-wrap justify-between items-center gap-3">
                                <div>
                                    <div className="flex items-center space-x-2.5">
                                        <div className={`w-2.5 h-2.5 rounded-full ${
                                            activeVehicle.status === 'FAULT' 
                                                ? 'bg-[#EF4444] animate-ping' 
                                                : activeVehicle.status === 'WARN' 
                                                ? 'bg-[#F59E0B]' 
                                                : 'bg-[#10B981]'
                                        }`} />
                                        <h3 className="text-lg font-heading text-[#F3F4F6] tracking-wider uppercase font-bold">
                                            PROBE // <span className="text-[#06B6D4] font-mono">{activeVehicle.vin}</span>
                                        </h3>
                                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border ${
                                            activeVehicle.status === 'FAULT'
                                                ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/40'
                                                : activeVehicle.status === 'WARN'
                                                ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/40'
                                                : 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/40'
                                        }`}>
                                            {activeVehicle.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        <span className="text-[9px] font-mono text-[#9CA3AF] bg-[#0D0F14] px-2 py-0.5 border border-[#2A2E3D]">
                                            LAST_TX: <span className="text-[#F3F4F6]">{formatTimestamp(activeVehicle.timestamp)}</span>
                                        </span>
                                        <span className="text-[9px] font-mono text-[#9CA3AF] bg-[#0D0F14] px-2 py-0.5 border border-[#2A2E3D]">
                                            HEALTH: <span className="text-[#10B981] font-bold">{(100 - (activeVehicle.score * 100)).toFixed(1)}%</span>
                                        </span>
                                    </div>
                                </div>

                                {/* View Switcher Buttons */}
                                <div className="flex items-center bg-[#0D0F14] p-1 border border-[#2A2E3D] space-x-1 shadow-[2px_2px_0_0_#000]">
                                    <button 
                                        onClick={() => setProbeView('gauges')}
                                        className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase transition-all flex items-center ${
                                            probeView === 'gauges' 
                                                ? 'bg-[#1C202B] text-[#06B6D4] border border-[#06B6D4] font-bold' 
                                                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                                        }`}
                                    >
                                        <Zap className="w-3 h-3 mr-1 text-[#06B6D4]" /> Gauges
                                    </button>
                                    <button 
                                        onClick={() => setProbeView('thermal')}
                                        className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase transition-all flex items-center ${
                                            probeView === 'thermal' 
                                                ? 'bg-[#1C202B] text-[#F59E0B] border border-[#F59E0B] font-bold' 
                                                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                                        }`}
                                    >
                                        <Grid className="w-3 h-3 mr-1 text-[#F59E0B]" /> Thermal Matrix
                                    </button>
                                    <button 
                                        onClick={() => setProbeView('split')}
                                        className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase transition-all flex items-center ${
                                            probeView === 'split' 
                                                ? 'bg-[#1C202B] text-[#10B981] border border-[#10B981] font-bold' 
                                                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                                        }`}
                                    >
                                        <Layers className="w-3 h-3 mr-1 text-[#10B981]" /> Dual View
                                    </button>
                                </div>
                            </div>

                            {/* Top Hero Section: Telemetry Gauges / Thermal Matrix */}
                            {probeView === 'gauges' && (
                                <div className="neo-card bg-[#161922] min-h-[270px] overflow-hidden">
                                    <DiagnosticsPanel 
                                        vehicle={activeVehicle} 
                                        onSwitchToThermal={() => setProbeView('thermal')} 
                                    />
                                </div>
                            )}

                            {probeView === 'thermal' && (
                                <div className="neo-card bg-[#161922] min-h-[270px] overflow-hidden">
                                    <PackHeatmap 
                                        vehicle={activeVehicle} 
                                        onSwitchToGauges={() => setProbeView('gauges')} 
                                    />
                                </div>
                            )}

                            {probeView === 'split' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="neo-card bg-[#161922] min-h-[270px] overflow-hidden">
                                        <DiagnosticsPanel vehicle={activeVehicle} />
                                    </div>
                                    <div className="neo-card bg-[#161922] min-h-[270px] overflow-hidden">
                                        <PackHeatmap vehicle={activeVehicle} />
                                    </div>
                                </div>
                            )}

                            {/* Middle Section: AI Triage and TreeSHAP Diagnostics */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[260px]">
                                <div className="md:col-span-5 neo-card overflow-hidden flex flex-col">
                                    <AITriageAdvisory vehicle={activeVehicle} />
                                </div>
                                <div className="md:col-span-7 neo-card overflow-hidden flex flex-col">
                                    <AttributionTable shap={activeVehicle.shap} anomalyScore={activeVehicle.score} />
                                </div>
                            </div>

                            {/* Bottom Hero Section: Docked Raw CAN Telemetry Stream */}
                            <div className="neo-card h-[210px] overflow-hidden flex flex-col">
                                <TelemetryLog fleet={telemetryLogs} selectedVin={selectedVin} />
                            </div>

                        </div>
                    ) : (
                        <div className="neo-card min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-[#161922] space-y-4">
                            <div className="w-16 h-16 border border-[#2A2E3D] bg-[#0D0F14] flex items-center justify-center shadow-[4px_4px_0_0_#000]">
                                <Activity className="w-8 h-8 text-[#06B6D4]" />
                            </div>
                            <span className="text-xl font-heading tracking-widest text-[#F3F4F6]">NO ASSET SELECTED</span>
                            <p className="font-mono text-xs text-[#9CA3AF] max-w-sm">
                                Select an EV asset from the Fleet Matrix on the left to initiate telemetry diagnostics.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
