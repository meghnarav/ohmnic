// frontend/src/app/page.tsx
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

    // Keep track of the raw telemetry firehose (up to 50 logs)
    const [telemetryLogs, setTelemetryLogs] = useState<VehicleRecord[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchFleetData = async () => {
            try {
                const response = await fetch('/api/fleet');
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        if (isMounted) {
                            setFleet(result.data);
                            setTelemetryLogs(prev => {
                                const merged = [...prev, ...result.data];
                                return merged.slice(-50); // Keep last 50
                            });
                            setError(null);
                            setLoading(false);
                        }
                    }
                } else {
                    if (isMounted) setError('SCADA UPLINK ERROR: ' + response.statusText);
                }
            } catch (err) {
                if (isMounted) setError('SCADA UPLINK DISCONNECTED. ATTEMPTING RECONNECT...');
            }
        };

        fetchFleetData(); // Initial fetch
        const pollInterval = setInterval(fetchFleetData, 1000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, []);

    const activeVehicle = fleet.find((v) => v.vin === selectedVin) || null;
    const faultCount = fleet.filter(v => v.status === 'FAULT' || v.status === 'WARN').length;
    const systemHealth = fleet.length > 0 ? (100 - (faultCount / fleet.length) * 100).toFixed(1) : '100.0';

    if (loading && fleet.length === 0) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#0B0C0E] text-sm font-mono text-[#ff4876]">
                INITIALIZING SCADA TELEMETRY UPLINK...
            </div>
        );
    }

    return (
        <main className="flex h-screen w-screen flex-col bg-[#0B0C0E] font-mono text-gray-200 overflow-hidden select-none">
            {/* Top Ribbon KPIs */}
            <header className="flex h-16 items-center justify-between border-b border-[#242933] px-6 bg-[#0E1013]">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Active Fleet Size</div>
                            <div className="text-lg font-bold text-gray-200">{fleet.length} Units</div>
                        </div>
                    </div>
                    
                    <div className="w-px h-8 bg-[#242933]"></div>
                    
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className={`w-5 h-5 ${faultCount > 0 ? 'text-[#ff4876]' : 'text-gray-600'}`} />
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Critical Triage Tickets</div>
                            <div className={`text-lg font-bold ${faultCount > 0 ? 'text-[#ff4876]' : 'text-gray-200'}`}>{faultCount} Active</div>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-[#242933]"></div>
                    
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-5 h-5 text-[#06B6D4]" />
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">System Health Index</div>
                            <div className="text-lg font-bold text-[#06B6D4]">{systemHealth}%</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <span className="text-sm font-bold tracking-wider text-gray-400 font-sans">ΩHMNIC SCADA COMMAND</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Alerts & Logs */}
                <section className="w-1/4 min-w-[320px] flex flex-col border-r border-[#242933] bg-[#0E1013] p-4 space-y-4">
                    <div className="flex-1 min-h-0">
                        <AlertsPanel fleet={fleet} />
                    </div>
                    <div className="h-1/3 min-h-[200px]">
                        <TelemetryLog fleet={telemetryLogs} />
                    </div>
                </section>

                {/* Middle Panel: Fleet Operations */}
                <section className="w-1/4 min-w-[320px] border-r border-[#242933] bg-[#0B0C0E] p-4 overflow-y-auto">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-[#242933] pb-2">
                        Asset Operations Grid
                    </h2>
                    {error && <div className="text-[10px] text-[#ff4876] bg-[#ff4876]/10 border border-[#ff4876]/30 p-2 rounded mb-2">{error}</div>}
                    <FleetMatrix vehicles={fleet} selectedVin={selectedVin} onSelectVin={setSelectedVin} />
                </section>

                {/* Right Panel: Active Probe */}
                <section className="flex-1 flex flex-col overflow-hidden bg-[#0E1013]">
                    {activeVehicle ? (
                        <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
                            <div className="border-b border-[#242933] pb-2 flex justify-between items-end">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-100 flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-2 ${activeVehicle.status === 'FAULT' ? 'bg-[#ff4876] shadow-[0_0_8px_#ff4876]' : activeVehicle.status === 'WARN' ? 'bg-[#F5A623]' : 'bg-emerald-500'}`}></div>
                                        DIAGNOSTICS PROBE: {activeVehicle.vin}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase">LAST INGESTION: {formatTimestamp(activeVehicle.timestamp)}</p>
                                </div>
                            </div>

                            {/* Top Row: Metrics and Heatmap */}
                            <div className="flex h-[35%] min-h-[220px] space-x-4">
                                <div className="flex-1 min-w-0">
                                    <DiagnosticsPanel vehicle={activeVehicle} />
                                </div>
                                <div className="w-[30%] min-w-[200px]">
                                    <PackHeatmap vehicle={activeVehicle} />
                                </div>
                            </div>

                            {/* Bottom Row: AI Triage and TreeSHAP */}
                            <div className="flex flex-1 space-x-4 pt-2">
                                <div className="w-[40%] min-w-[250px]">
                                    <AITriageAdvisory vehicle={activeVehicle} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <AttributionTable shap={activeVehicle.shap} anomalyScore={activeVehicle.score} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center text-xs text-gray-600 space-y-2">
                            <div className="w-16 h-16 border-2 border-[#242933] rounded-full flex items-center justify-center opacity-50">
                                <Activity className="w-8 h-8" />
                            </div>
                            <span className="uppercase tracking-widest">NO ASSET SELECTED</span>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
