'use client';

import { useState, useEffect } from 'react';
import FleetMatrix from '@/components/FleetMatrix';
import DiagnosticsPanel from '@/components/DiagnosticsPanel';
import AttributionTable from '@/components/AttributionTable';
import AlertsPanel from '@/components/AlertsPanel';
import TelemetryLog from '@/components/TelemetryLog';
import PackHeatmap from '@/components/PackHeatmap';
import AITriageAdvisory from '@/components/AITriageAdvisory';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

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
    const [error, setError] = useState<string | null>(null);
    const [telemetryLogs, setTelemetryLogs] = useState<VehicleRecord[]>([]);

    useEffect(() => {
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
                        const newLogs = [...prev, ...data.data].slice(-100);
                        return newLogs;
                    });

                    // Auto-select first if none selected
                    setSelectedVin(current => current || data.data[0].vin);
                    setLoading(false);
                }
            } catch (err: any) {
                setError(err.message);
            }
        };

        const interval = setInterval(fetchFleet, 1000);
        return () => clearInterval(interval);
    }, []);

    const activeVehicle = fleet.find((v) => v.vin === selectedVin) || null;
    const faultCount = fleet.filter(v => v.status === 'FAULT' || v.status === 'WARN').length;
    const systemHealth = fleet.length > 0 ? (100 - (faultCount / fleet.length) * 100).toFixed(1) : '100.0';

    if (loading && fleet.length === 0) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-canvas)] font-heading text-4xl text-[var(--color-border-dark)] font-black">
                <div className="neo-card p-8 bg-[var(--color-accent-amber)] animate-pulse">
                    BOOTING UP ΩHMNIC_
                </div>
            </div>
        );
    }

    return (
        <main className="flex h-screen w-screen flex-col overflow-hidden select-none">
            {/* Top Ribbon KPIs */}
            <header className="flex h-16 items-center justify-between border-b-4 border-[var(--color-border-dark)] px-6 bg-[var(--color-accent-amber)] shadow-[0_4px_0_0_#111] z-20 shrink-0">
                <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 border-2 border-[var(--color-border-dark)] bg-white flex items-center justify-center shadow-[2px_2px_0_0_#111]">
                            <Activity className="w-6 h-6 text-[var(--color-border-dark)]" strokeWidth={3} />
                        </div>
                        <div>
                            <div className="text-[10px] text-[var(--color-border-dark)] font-bold uppercase tracking-widest">Active Fleet</div>
                            <div className="text-xl font-heading text-[var(--color-border-dark)]">{fleet.length} UNITS</div>
                        </div>
                    </div>

                    <div className="w-1 h-10 bg-[var(--color-border-dark)]"></div>

                    <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 border-2 border-[var(--color-border-dark)] flex items-center justify-center shadow-[2px_2px_0_0_#111] ${faultCount > 0 ? 'bg-[var(--color-accent-pink)]' : 'bg-white'}`}>
                            <AlertTriangle className="w-6 h-6 text-[var(--color-border-dark)]" strokeWidth={3} />
                        </div>
                        <div>
                            <div className="text-[10px] text-[var(--color-border-dark)] font-bold uppercase tracking-widest">Critical Tickets</div>
                            <div className="text-xl font-heading text-[var(--color-border-dark)]">{faultCount} ALERTS</div>
                        </div>
                    </div>

                    <div className="w-1 h-10 bg-[var(--color-border-dark)]"></div>

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

                <div className="flex items-center space-x-3 border-4 border-[var(--color-border-dark)] bg-white px-4 py-1 shadow-[2px_2px_0_0_#111]">
                    <span className="text-sm font-heading tracking-wider text-[var(--color-border-dark)]">ΩHMNIC SCADA</span>
                    <div className="h-3 w-3 border-2 border-black bg-[var(--color-accent-emerald)] animate-pulse" />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden p-4 space-x-4">
                {/* Left Panel: Alerts & Logs */}
                <section className="w-1/4 min-w-[320px] flex flex-col space-y-4">
                    <div className="flex-1 min-h-0 neo-card overflow-hidden">
                        <AlertsPanel fleet={fleet} />
                    </div>
                    <div className="h-1/3 min-h-[200px] neo-card overflow-hidden bg-black text-white">
                        <TelemetryLog fleet={telemetryLogs} />
                    </div>
                </section>

                {/* Middle Panel: Fleet Operations */}
                <section className="w-1/4 min-w-[320px] neo-card bg-white p-4 flex flex-col overflow-hidden">
                    <h2 className="text-xl font-heading text-[var(--color-border-dark)] mb-4 border-b-4 border-[var(--color-border-dark)] pb-2 flex justify-between items-center">
                        ASSET GRID
                        <span className="text-xs font-mono bg-black text-white px-2 py-1">LIVE</span>
                    </h2>
                    {error && <div className="text-sm font-bold border-4 border-black bg-[var(--color-accent-pink)] text-black p-2 mb-4 shadow-[2px_2px_0_0_#111]">{error}</div>}
                    <div className="flex-1 overflow-y-auto pr-2">
                        <FleetMatrix vehicles={fleet} selectedVin={selectedVin} onSelectVin={setSelectedVin} />
                    </div>
                </section>

                {/* Right Panel: Active Probe */}
                <section className="flex-1 flex flex-col min-w-0">
                    {activeVehicle ? (
                        <div className="flex-1 flex flex-col space-y-4 min-h-0">
                            <div className="neo-card bg-[var(--color-accent-blue)] p-4 flex justify-between items-end shrink-0">
                                <div>
                                    <h3 className="text-2xl font-heading text-white flex items-center uppercase tracking-tight">
                                        <div className={`w-4 h-4 border-2 border-white mr-3 ${activeVehicle.status === 'FAULT' ? 'bg-[var(--color-accent-pink)]' : activeVehicle.status === 'WARN' ? 'bg-[var(--color-accent-amber)]' : 'bg-[var(--color-accent-emerald)]'}`}></div>
                                        PROBE: {activeVehicle.vin}
                                    </h3>
                                    <p className="text-xs font-mono text-white/80 mt-1 uppercase font-bold bg-black/20 inline-block px-2 py-1 border border-white/20">LAST_TX: {formatTimestamp(activeVehicle.timestamp)}</p>
                                </div>
                            </div>

                            {/* Top Row: Metrics and Heatmap */}
                            <div className="flex h-[35%] min-h-[220px] space-x-4 shrink-0">
                                <div className="flex-1 min-w-0 neo-card bg-white overflow-hidden">
                                    <DiagnosticsPanel vehicle={activeVehicle} />
                                </div>
                                <div className="w-[35%] min-w-[200px] neo-card bg-white overflow-hidden">
                                    <PackHeatmap vehicle={activeVehicle} />
                                </div>
                            </div>

                            {/* Bottom Row: AI Triage and TreeSHAP */}
                            <div className="flex flex-1 space-x-4 min-h-0">
                                <div className="w-[40%] min-w-[250px] neo-card bg-white overflow-hidden">
                                    <AITriageAdvisory vehicle={activeVehicle} />
                                </div>
                                <div className="flex-1 min-w-0 neo-card bg-white overflow-hidden">
                                    <AttributionTable shap={activeVehicle.shap} anomalyScore={activeVehicle.score} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="neo-card flex-1 flex flex-col items-center justify-center text-center space-y-4 bg-white">
                            <div className="w-24 h-24 border-4 border-black bg-[var(--color-accent-amber)] flex items-center justify-center shadow-[4px_4px_0_0_#111]">
                                <Activity className="w-12 h-12 text-black" strokeWidth={3} />
                            </div>
                            <span className="text-3xl font-heading tracking-widest text-black">NO ASSET</span>
                            <span className="font-mono text-gray-500 font-bold border-2 border-dashed border-gray-300 p-2">AWAITING SELECTION</span>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
