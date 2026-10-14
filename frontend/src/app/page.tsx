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
import { Activity, AlertTriangle, ShieldCheck, Grid, Zap, Layers } from 'lucide-react';

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

    const fetchFleet = async () => {
        try {
            const res = await fetch('/api/fleet');
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();

            setLoading(false);
            if (data.data && data.data.length > 0) {
                setFleet(data.data);

                // Add to log firehose
                setTelemetryLogs(prev => {
                    const newLogs = [...prev, ...data.data].slice(-120);
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

        setTelemetryLogs(prev => [...prev, ...burst].slice(-150));
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
            <div className="flex min-h-screen w-full items-center justify-center bg-[var(--color-canvas)] font-heading text-4xl text-[var(--color-border-dark)] font-black">
                <div className="neo-card p-8 bg-[var(--color-accent-amber)] animate-pulse">
                    BOOTING UP ΩHMNIC_
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen w-full flex flex-col bg-[var(--color-canvas)] text-[var(--color-text-primary)]">
            {/* Top Ribbon KPIs */}
            <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between border-b-4 border-[var(--color-border-dark)] px-6 py-2 bg-[var(--color-accent-amber)] shadow-[0_4px_0_0_#111]">
                <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 border-2 border-[var(--color-border-dark)] bg-white flex items-center justify-center shadow-[2px_2px_0_0_#111]">
                            <Activity className="w-6 h-6 text-[var(--color-border-dark)]" strokeWidth={3} />
                        </div>
                        <div>
                            <div className="text-[10px] text-[var(--color-border-dark)] font-bold uppercase tracking-widest">Active Fleet</div>
                            <div className="text-xl font-heading text-[var(--color-border-dark)]">{fleet.length} UNITS</div>
                        </div>
                    </div>

                    <div className="hidden sm:block w-1 h-8 bg-[var(--color-border-dark)]" />

                    <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 border-2 border-[var(--color-border-dark)] flex items-center justify-center shadow-[2px_2px_0_0_#111] ${faultCount > 0 ? 'bg-[var(--color-accent-pink)]' : 'bg-white'}`}>
                            <AlertTriangle className="w-6 h-6 text-[var(--color-border-dark)]" strokeWidth={3} />
                        </div>
                        <div>
                            <div className="text-[10px] text-[var(--color-border-dark)] font-bold uppercase tracking-widest">Critical Tickets</div>
                            <div className="text-xl font-heading text-[var(--color-border-dark)]">{faultCount} ALERTS</div>
                        </div>
                    </div>

                    <div className="hidden sm:block w-1 h-8 bg-[var(--color-border-dark)]" />

                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 border-2 border-[var(--color-border-dark)] bg-[var(--color-accent-emerald)] flex items-center justify-center shadow-[2px_2px_0_0_#111]">
                            <ShieldCheck className="w-6 h-6 text-[var(--color-border-dark)]" strokeWidth={3} />
                        </div>
                        <div>
                            <div className="text-[10px] text-[var(--color-border-dark)] font-bold uppercase tracking-widest">System Health</div>
                            <div className="text-xl font-heading text-[var(--color-border-dark)]">{systemHealth}%</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3 border-4 border-[var(--color-border-dark)] bg-white px-4 py-1.5 shadow-[2px_2px_0_0_#111] mt-2 sm:mt-0">
                    <span className="text-sm font-heading tracking-wider text-[var(--color-border-dark)]">ΩHMNIC SCADA</span>
                    <div className="h-3 w-3 border-2 border-black bg-[var(--color-accent-emerald)] animate-pulse" />
                </div>
            </header>

            {/* Scrollable Main Multi-Column Console */}
            <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Column 1: Live Tickets, Event Stream & Edge Gateway (lg:col-span-3) */}
                <section className="lg:col-span-3 flex flex-col gap-4">
                    <div className="neo-card h-[250px] overflow-hidden flex flex-col">
                        <AlertsPanel fleet={fleet} />
                    </div>
                    <div className="neo-card h-[270px] overflow-hidden bg-black text-white flex flex-col">
                        <TelemetryLog fleet={telemetryLogs} selectedVin={selectedVin} />
                    </div>
                    <div className="neo-card h-[240px] overflow-hidden flex flex-col">
                        <EdgeGatewayCard 
                            fleetCount={fleet.length} 
                            faultCount={faultCount} 
                            onRefresh={handleManualRefresh}
                            onSimulateBurst={handleSimulateBurst}
                            isRefreshing={isRefreshing}
                        />
                    </div>
                </section>

                {/* Column 2: Fleet Matrix Asset Grid (lg:col-span-3) */}
                <section className="lg:col-span-3 neo-card bg-white p-4 flex flex-col h-[792px]">
                    <div className="border-b-4 border-[var(--color-border-dark)] pb-2 mb-3">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-heading text-[var(--color-border-dark)]">ASSET GRID</h2>
                            <span className="text-xs font-mono bg-black text-white px-2 py-0.5 font-bold">LIVE</span>
                        </div>
                        {/* Status Filter Badges */}
                        <div className="flex gap-1">
                            <button 
                                onClick={() => setFilterStatus('ALL')}
                                className={`text-[9px] font-mono font-bold px-2 py-0.5 border-2 border-black transition-all ${filterStatus === 'ALL' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                                ALL ({fleet.length})
                            </button>
                            <button 
                                onClick={() => setFilterStatus('CRITICAL')}
                                className={`text-[9px] font-mono font-bold px-2 py-0.5 border-2 border-black transition-all ${filterStatus === 'CRITICAL' ? 'bg-[var(--color-accent-pink)] text-black' : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                                ALERTS ({faultCount})
                            </button>
                            <button 
                                onClick={() => setFilterStatus('NOMINAL')}
                                className={`text-[9px] font-mono font-bold px-2 py-0.5 border-2 border-black transition-all ${filterStatus === 'NOMINAL' ? 'bg-[var(--color-accent-emerald)] text-black' : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                                NOMINAL ({fleet.length - faultCount})
                            </button>
                        </div>
                    </div>

                    {error && <div className="text-xs font-bold border-2 border-black bg-[var(--color-accent-pink)] text-black p-2 mb-3">{error}</div>}

                    <div className="flex-1 overflow-y-auto pr-1">
                        <FleetMatrix vehicles={filteredFleet} selectedVin={selectedVin} onSelectVin={setSelectedVin} />
                    </div>

                    {/* Fleet Distribution Summary Footer */}
                    <div className="border-t-2 border-black pt-2 mt-2 shrink-0">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold mb-1">
                            <span className="text-gray-500 uppercase">FLEET DISPERSION</span>
                            <span>{fleet.length > 0 ? `${(((fleet.length - faultCount) / fleet.length) * 100).toFixed(0)}% HEALTHY` : '0%'}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 border border-black flex overflow-hidden">
                            <div 
                                style={{ width: `${fleet.length > 0 ? ((fleet.length - faultCount) / fleet.length) * 100 : 100}%` }} 
                                className="bg-[var(--color-accent-emerald)] h-full" 
                            />
                            <div 
                                style={{ width: `${fleet.length > 0 ? (faultCount / fleet.length) * 100 : 0}%` }} 
                                className="bg-[var(--color-accent-pink)] h-full" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-gray-600 mt-1.5">
                            <div>AVG TEMP: <strong className="text-black">{avgTemp}°C</strong></div>
                            <div className="text-right">AVG ΔV: <strong className="text-black">{avgDeltaV} mV</strong></div>
                        </div>
                    </div>
                </section>

                {/* Column 3: Active Vehicle Probe Deep Dive (lg:col-span-6) */}
                <section className="lg:col-span-6 flex flex-col gap-4 min-w-0">
                    {activeVehicle ? (
                        <div className="flex flex-col gap-4">
                            {/* Probe Banner with View Mode Selector */}
                            <div className="neo-card bg-[var(--color-accent-blue)] p-4 flex flex-wrap justify-between items-center gap-3">
                                <div>
                                    <h3 className="text-2xl font-heading text-white flex items-center uppercase tracking-tight">
                                        <div className={`w-4 h-4 border-2 border-white mr-3 ${activeVehicle.status === 'FAULT' ? 'bg-[var(--color-accent-pink)] animate-ping' : activeVehicle.status === 'WARN' ? 'bg-[var(--color-accent-amber)]' : 'bg-[var(--color-accent-emerald)]'}`} />
                                        PROBE: {activeVehicle.vin}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-[10px] font-mono text-white/90 uppercase font-bold bg-black/40 inline-block px-2 py-0.5 border border-white/20">
                                            LAST_TX: {formatTimestamp(activeVehicle.timestamp)}
                                        </span>
                                        <span className="text-[10px] font-mono text-white/90 uppercase font-bold bg-black/40 inline-block px-2 py-0.5 border border-white/20">
                                            HEALTH: {(100 - (activeVehicle.score * 100)).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                {/* View Switcher Buttons */}
                                <div className="flex items-center border-4 border-black bg-white p-1 shadow-[3px_3px_0_0_#111] space-x-1">
                                    <button 
                                        onClick={() => setProbeView('gauges')}
                                        className={`px-3 py-1 text-xs font-heading tracking-wider uppercase transition-all flex items-center ${probeView === 'gauges' ? 'bg-[var(--color-accent-amber)] text-black border-2 border-black font-black shadow-[2px_2px_0_0_#111]' : 'text-gray-700 hover:text-black font-bold'}`}
                                    >
                                        <Zap className="w-3.5 h-3.5 mr-1" /> Gauges
                                    </button>
                                    <button 
                                        onClick={() => setProbeView('thermal')}
                                        className={`px-3 py-1 text-xs font-heading tracking-wider uppercase transition-all flex items-center ${probeView === 'thermal' ? 'bg-[var(--color-accent-pink)] text-white border-2 border-black font-black shadow-[2px_2px_0_0_#111]' : 'text-gray-700 hover:text-black font-bold'}`}
                                    >
                                        <Grid className="w-3.5 h-3.5 mr-1" /> Thermal Map
                                    </button>
                                    <button 
                                        onClick={() => setProbeView('split')}
                                        className={`px-3 py-1 text-xs font-heading tracking-wider uppercase transition-all flex items-center ${probeView === 'split' ? 'bg-[var(--color-accent-emerald)] text-black border-2 border-black font-black shadow-[2px_2px_0_0_#111]' : 'text-gray-700 hover:text-black font-bold'}`}
                                    >
                                        <Layers className="w-3.5 h-3.5 mr-1" /> Dual View
                                    </button>
                                </div>
                            </div>

                            {/* Top Section: Gauges / Thermal Matrix (Spacious & Clean) */}
                            {probeView === 'gauges' && (
                                <div className="neo-card bg-white min-h-[260px] overflow-hidden">
                                    <DiagnosticsPanel 
                                        vehicle={activeVehicle} 
                                        onSwitchToThermal={() => setProbeView('thermal')} 
                                    />
                                </div>
                            )}

                            {probeView === 'thermal' && (
                                <div className="neo-card bg-white min-h-[260px] overflow-hidden">
                                    <PackHeatmap 
                                        vehicle={activeVehicle} 
                                        onSwitchToGauges={() => setProbeView('gauges')} 
                                    />
                                </div>
                            )}

                            {probeView === 'split' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="neo-card bg-white min-h-[260px] overflow-hidden">
                                        <DiagnosticsPanel vehicle={activeVehicle} />
                                    </div>
                                    <div className="neo-card bg-white min-h-[260px] overflow-hidden">
                                        <PackHeatmap vehicle={activeVehicle} />
                                    </div>
                                </div>
                            )}

                            {/* Bottom Section: AI Triage and TreeSHAP Diagnostics */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[280px]">
                                <div className="md:col-span-5 neo-card bg-white overflow-hidden flex flex-col">
                                    <AITriageAdvisory vehicle={activeVehicle} />
                                </div>
                                <div className="md:col-span-7 neo-card bg-white overflow-hidden flex flex-col">
                                    <AttributionTable shap={activeVehicle.shap} anomalyScore={activeVehicle.score} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="neo-card min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-white space-y-4">
                            <div className="w-24 h-24 border-4 border-black bg-[var(--color-accent-amber)] flex items-center justify-center shadow-[6px_6px_0_0_#111]">
                                <Activity className="w-12 h-12 text-black" strokeWidth={3} />
                            </div>
                            <span className="text-3xl font-heading tracking-widest text-black">NO ASSET SELECTED</span>
                            <p className="font-mono text-gray-600 font-bold max-w-sm">
                                Select an EV asset from the Asset Grid matrix on the left to initiate telemetry diagnostics.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
