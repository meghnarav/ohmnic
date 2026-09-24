import React from 'react';
import { VehicleRecord } from '@/app/page';
import { Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AlertsPanel({ fleet }: { fleet: VehicleRecord[] }) {
    const alerts = fleet.filter(v => v.status === 'FAULT' || v.status === 'WARN');

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="border-b-4 border-black px-4 py-3 flex justify-between items-center bg-[var(--color-accent-pink)]">
                <div className="flex items-center text-black">
                    <Bell className="w-5 h-5 mr-2" strokeWidth={3} />
                    <span className="text-sm font-heading uppercase">Alerts</span>
                </div>
                <span className="bg-black text-white px-2 py-1 text-[10px] font-mono font-bold border-2 border-white shadow-[2px_2px_0_0_#111]">
                    {alerts.length} TICKETS
                </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-black space-y-3 border-4 border-dashed border-gray-300 p-4">
                        <CheckCircle2 className="w-10 h-10 text-[var(--color-accent-emerald)]" strokeWidth={3} />
                        <span className="text-sm font-heading uppercase text-center">Zero Active Alerts</span>
                    </div>
                ) : (
                    alerts.map((alert, i) => (
                        <div key={`${alert.vin}-${i}`} className={`border-4 border-black p-3 flex flex-col shadow-[4px_4px_0_0_#111] ${alert.status === 'FAULT' ? 'bg-white' : 'bg-[var(--color-canvas)]'}`}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center">
                                    <AlertTriangle className={`w-4 h-4 mr-2 ${alert.status === 'FAULT' ? 'text-[var(--color-accent-pink)]' : 'text-[var(--color-accent-amber)]'}`} strokeWidth={3} />
                                    <span className="font-heading text-black text-sm uppercase">{alert.vin}</span>
                                </div>
                                <span className="text-[10px] bg-black text-white px-1 font-mono font-bold">LIVE</span>
                            </div>
                            <div className="text-[10px] font-mono font-bold text-gray-700 leading-tight uppercase">
                                {alert.status === 'FAULT' 
                                    ? `Critical fault. Health dropped to ${(100 - (alert.score * 100)).toFixed(1)}%. Inspect immediately.`
                                    : `Warning: Anomalous behavior. Max Temp ${alert.maxTemp.toFixed(1)}°C.`}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
