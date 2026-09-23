import React from 'react';
import { VehicleRecord } from '@/app/page';
import { Bell, AlertTriangle, Info } from 'lucide-react';

export default function AlertsPanel({ fleet }: { fleet: VehicleRecord[] }) {
    const alerts = fleet.filter(v => v.status === 'FAULT' || v.status === 'WARN');

    return (
        <div className="glass-card h-full flex flex-col rounded-xl overflow-hidden border-white/5">
            <div className="border-b border-white/10 px-4 py-3 flex justify-between items-center bg-black/20">
                <div className="flex items-center text-gray-200">
                    <Bell className="w-4 h-4 mr-2 text-white" />
                    <span className="text-xs font-bold uppercase tracking-widest">Active Alerts</span>
                </div>
                {alerts.length > 0 && (
                    <span className="bg-[var(--color-accent-pink)]/20 text-[var(--color-accent-pink)] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[var(--color-accent-pink)]/30 animate-pulse">
                        {alerts.length} Critical
                    </span>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2 opacity-50">
                        <CheckCircle2 className="w-8 h-8 text-[var(--color-accent-emerald)]" />
                        <span className="text-xs uppercase tracking-widest">No active alerts</span>
                    </div>
                ) : (
                    alerts.map((alert, i) => (
                        <div key={`${alert.vin}-${i}`} className="bg-black/40 border border-white/5 rounded-lg p-3 flex flex-col relative overflow-hidden animate-slide-in">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.status === 'FAULT' ? 'bg-[var(--color-accent-pink)]' : 'bg-[var(--color-accent-amber)]'}`} />
                            <div className="flex items-start justify-between pl-2">
                                <div className="flex items-center">
                                    <AlertTriangle className={`w-3 h-3 mr-1.5 ${alert.status === 'FAULT' ? 'text-[var(--color-accent-pink)]' : 'text-[var(--color-accent-amber)]'}`} />
                                    <span className="font-bold text-gray-200 text-xs tracking-wider">{alert.vin}</span>
                                </div>
                                <span className="text-[9px] text-gray-500 font-mono">JUST NOW</span>
                            </div>
                            <div className="mt-1 pl-2 text-[10px] text-gray-400 font-sans leading-relaxed">
                                {alert.status === 'FAULT' 
                                    ? `Critical threshold exceeded. Health Score dropped to ${(100 - (alert.score * 100)).toFixed(1)}%. Immediate investigation required.`
                                    : `Warning: Anomalous behavior detected. Max Temp at ${alert.maxTemp.toFixed(1)}°C.`}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
import { CheckCircle2 } from 'lucide-react';
