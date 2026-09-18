// frontend/src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import FleetMatrix from '@/components/FleetMatrix';
import DiagnosticsPanel from '@/components/DiagnosticsPanel';
import AttributionTable from '@/components/AttributionTable';
import AlertsPanel from '@/components/AlertsPanel';

interface Telemetry {
    pack_voltage: number;
    pack_current: number;
    pack_temp_c: number;
    cell_voltage_delta: number;
    max_cell_temp_c: number;
    charge_rate_kw: number;
    ambient_temp_c?: number;
    regen_kwh?: number;
    consumed_kwh?: number;
    soh?: number;
    speed_mph?: number;
    gps_lat?: number;
    gps_lng?: number;
}

interface VehicleRecord {
    vin: string;
    depot: string;
    status: 'NOMINAL' | 'CRITICAL_FAULT';
    anomaly_score: number;
    last_updated: string;
    telemetry: Telemetry;
    shap_attribution: Record<string, number>;
}

export default function OperationsConsole() {
    const [fleet, setFleet] = useState<VehicleRecord[]>([]);
    const [selectedVin, setSelectedVin] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let latestData: VehicleRecord[] | null = null;
        const eventSource = new EventSource('/api/stream');

        eventSource.onmessage = (event) => {
            try {
                const result = JSON.parse(event.data);
                if (result.success) {
                    latestData = result.data;
                    setError(null);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error parsing SSE data:', err);
            }
        };

        eventSource.onerror = () => {
            setError('Operational Telemetry Stream Disconnected. Reconnecting...');
        };

        const throttleInterval = setInterval(() => {
            if (latestData) {
                setFleet(latestData);
                latestData = null;
            }
        }, 1000);

        return () => {
            eventSource.close();
            clearInterval(throttleInterval);
        };
    }, []);

    const activeVehicle = fleet.find((v) => v.vin === selectedVin) || null;

    if (loading && fleet.length === 0) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#0B0C0E] text-sm font-mono text-[#ff4876]">
                INITIALIZING CORE ΩHMNIC TELEMETRY LEDGER STREAMS...
            </div>
        );
    }

    return (
        <main className="flex h-screen w-screen flex-col bg-[#0B0C0E] font-mono text-gray-200 overflow-hidden select-none">
            <header className="flex h-14 items-center justify-between border-b border-[#242933] px-6 bg-[#0E1013]">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-bold tracking-wider text-[#ff4876] font-sans">ΩHMNIC PLATFORM</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-gray-400">BMS INGESTION LAYER LIVE</span>
                </div>
                <div className="text-xs text-gray-400">CONSOLE // POLLING INTERVAL [1000ms]</div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <section className="w-1/4 border-r border-[#242933] p-6 overflow-y-auto bg-[#0E1013]">
                    <AlertsPanel fleet={fleet} />
                </section>

                <section className="w-1/4 border-r border-[#242933] p-6 overflow-y-auto bg-[#0B0C0E]">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-[#242933] pb-2">
                        Asset Operations Grid
                    </h2>
                    {error && <div className="text-xs text-[#ff4876] mb-2">{error}</div>}
                    <FleetMatrix vehicles={fleet} selectedVin={selectedVin} onSelectVin={setSelectedVin} />
                </section>

                <section className="w-1/2 flex flex-col overflow-hidden bg-[#0E1013]">
                    {activeVehicle ? (
                        <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-6">
                            <div className="border-b border-[#242933] pb-4">
                                <h3 className="text-sm font-bold text-gray-100">DIAGNOSTICS PROBE: {activeVehicle.vin}</h3>
                                <p className="text-xs text-gray-500 mt-1">LAST INGESTION: {activeVehicle.last_updated}</p>
                            </div>

                            <div className="flex-1 min-h-[220px]">
                                <DiagnosticsPanel telemetry={activeVehicle.telemetry} status={activeVehicle.status} vin={activeVehicle.vin} />
                            </div>

                            <div className="h-[250px] border-t border-[#242933] pt-4 overflow-y-auto">
                                <h4 className="text-xs font-bold text-[#ff4876] mb-2 uppercase tracking-wide">
                                    Kernel SHAP Anomaly Feature Attribution Matrix
                                </h4>
                                <AttributionTable attributions={activeVehicle.shap_attribution} anomalyScore={activeVehicle.anomaly_score} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center text-xs text-gray-600">
                            NO ACTIVE VEHICLE CAPTURED IN INGESTION REGISTER
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
