import React from 'react';
import { VehicleRecord } from '@/app/page';
import { Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AlertsPanelProps {
    fleet: VehicleRecord[];
    onSelectVin?: (vin: string) => void;
}

export default function AlertsPanel({ fleet, onSelectVin }: AlertsPanelProps) {
    const alerts = fleet.filter(v => v.status === 'FAULT' || v.status === 'WARN');

    return (
        <div className="h-full flex flex-col bg-[#12151D] text-white">
            {/* Titlebar */}
            <div className="bg-[#181C26] px-3 py-1.5 border-b-2 border-[#242938] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-[#0A0C10] border border-[#242938] text-[#FFD000]">
                        [QUEUE // ALERTS]
                    </span>
                    <span className="text-xs font-heading font-black uppercase tracking-wider text-white">
                        ANOMALY TICKETS
                    </span>
                </div>
                <span className={`text-[9px] font-mono font-black px-2 py-0.5 border ${
                    alerts.length > 0
                        ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]'
                        : 'bg-[#0A0C10] text-[#64748B] border-[#2A2E3D]'
                }`}>
                    {alerts.length} ALERTS
                </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 border-2 border-dashed border-[#242938] bg-[#0A0C10] p-4">
                        <CheckCircle2 className="w-6 h-6 text-[#10B981]" strokeWidth={2.5} />
                        <span className="text-xs font-mono font-bold uppercase text-white">ZERO_ANOMALY_TICKETS</span>
                        <span className="text-[9px] font-mono text-[#64748B]">All fleet battery packs within nominal 3-sigma bounds.</span>
                    </div>
                ) : (
                    alerts.map((alert, i) => (
                        <div 
                            key={`${alert.vin}-${i}`} 
                            onClick={() => onSelectVin && onSelectVin(alert.vin)}
                            className={`border-2 p-2.5 flex flex-col transition-all cursor-pointer bg-[#0A0C10] shadow-[2px_2px_0px_#000000] hover:border-[#00F0FF] ${
                                alert.status === 'FAULT' ? 'border-[#EF4444]' : 'border-[#FFD000]'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#242938]">
                                <div className="flex items-center space-x-1.5">
                                    <AlertTriangle className={`w-3.5 h-3.5 ${alert.status === 'FAULT' ? 'text-[#EF4444]' : 'text-[#FFD000]'}`} />
                                    <span className="font-mono text-xs font-bold text-white uppercase">{alert.vin}</span>
                                </div>
                                <span className={`text-[8px] px-1 py-0.5 font-mono font-black border ${
                                    alert.status === 'FAULT' ? 'text-[#EF4444] border-[#EF4444] bg-[#EF4444]/10' : 'text-[#FFD000] border-[#FFD000] bg-[#FFD000]/10'
                                }`}>
                                    {alert.status}
                                </span>
                            </div>
                            <div className="text-[10px] font-mono text-[#94A3B8] leading-tight">
                                {alert.status === 'FAULT' 
                                    ? `Critical fault detected. Health score dropped to ${(100 - (alert.score * 100)).toFixed(1)}%. Immediate cell triage recommended.`
                                    : `Elevated warning. Thermal sensor variance at ${alert.maxTemp.toFixed(1)}°C.`}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
