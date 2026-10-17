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
        <div className="h-full flex flex-col bg-[#161922] text-[#F3F4F6]">
            {/* Header */}
            <div className="border-b border-[#2A2E3D] px-4 py-2.5 flex justify-between items-center bg-[#12141A] shrink-0">
                <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-[#EF4444]" />
                    <span className="text-xs font-heading uppercase tracking-wider text-[#F3F4F6]">
                        ACTIVE ANOMALY TICKETS
                    </span>
                </div>
                <span className="bg-[#0D0F14] text-[#EF4444] border border-[#EF4444] px-2 py-0.5 text-[9px] font-mono font-bold">
                    {alerts.length} ALERTS
                </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 border border-dashed border-[#2A2E3D] bg-[#0D0F14] p-4">
                        <CheckCircle2 className="w-7 h-7 text-[#10B981]" strokeWidth={2} />
                        <span className="text-xs font-heading uppercase text-[#F3F4F6]">ZERO ANOMALY TICKETS</span>
                        <span className="text-[10px] font-mono text-[#64748B]">All connected fleet units within nominal bounds.</span>
                    </div>
                ) : (
                    alerts.map((alert, i) => (
                        <div 
                            key={`${alert.vin}-${i}`} 
                            onClick={() => onSelectVin && onSelectVin(alert.vin)}
                            className={`border p-3 flex flex-col transition-all cursor-pointer bg-[#0D0F14] shadow-[2px_2px_0px_#000000] hover:border-[#06B6D4] ${
                                alert.status === 'FAULT' ? 'border-[#EF4444]/60' : 'border-[#F59E0B]/60'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#2A2E3D]">
                                <div className="flex items-center space-x-1.5">
                                    <AlertTriangle className={`w-3.5 h-3.5 ${alert.status === 'FAULT' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`} />
                                    <span className="font-mono text-xs font-bold text-[#F3F4F6] uppercase">{alert.vin}</span>
                                </div>
                                <span className="text-[8px] bg-[#161922] text-[#9CA3AF] px-1 py-0.5 font-mono border border-[#2A2E3D]">
                                    CRITICAL_SEV
                                </span>
                            </div>
                            <div className="text-[10px] font-mono text-[#9CA3AF] leading-relaxed">
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
