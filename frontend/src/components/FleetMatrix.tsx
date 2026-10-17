import React from 'react';
import { VehicleRecord } from '@/app/page';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function FleetMatrix({ vehicles, selectedVin, onSelectVin }: { 
    vehicles: VehicleRecord[], 
    selectedVin: string | null,
    onSelectVin: (vin: string) => void 
}) {
    if (vehicles.length === 0) {
        return (
            <div className="text-xs font-mono text-[#64748B] border border-dashed border-[#2A2E3D] p-6 text-center bg-[#0D0F14]">
                AWAITING_TELEMETRY_INGESTION...
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2.5 pb-2">
            {vehicles.map((v) => {
                const isSelected = v.vin === selectedVin;
                const isFault = v.status === 'FAULT';
                const isWarn = v.status === 'WARN';

                let borderColor = '#2A2E3D';
                let statusBadgeColor = '#10B981';
                let cardBg = isSelected ? 'bg-[#1C202B]' : 'bg-[#0D0F14]';

                if (isSelected) {
                    borderColor = '#06B6D4';
                }
                if (isFault) {
                    statusBadgeColor = '#EF4444';
                    if (!isSelected) borderColor = '#EF444466';
                } else if (isWarn) {
                    statusBadgeColor = '#F59E0B';
                    if (!isSelected) borderColor = '#F59E0B66';
                }

                return (
                    <div 
                        key={v.vin} 
                        onClick={() => onSelectVin(v.vin)}
                        style={{ borderColor }}
                        className={`clickable cursor-pointer p-3 flex flex-col transition-all border shadow-[2px_2px_0px_#000000] ${cardBg} ${
                            isSelected ? 'translate-x-1 shadow-[3px_3px_0px_#000000]' : 'hover:border-[#3E455B]'
                        }`}
                    >
                        {/* Card Header */}
                        <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-[#2A2E3D]">
                            <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 flex items-center justify-center">
                                    {isFault ? (
                                        <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                                    ) : isWarn ? (
                                        <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                                    )}
                                </div>
                                <span className="font-mono text-xs font-bold text-[#F3F4F6] tracking-tight">
                                    {v.vin}
                                </span>
                            </div>
                            <span 
                                style={{ color: statusBadgeColor, borderColor: statusBadgeColor }}
                                className="text-[9px] font-mono px-1.5 py-0.5 border bg-[#161922] font-bold tracking-wider"
                            >
                                {v.status}
                            </span>
                        </div>

                        {/* Telemetry Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div className="flex flex-col bg-[#161922] p-1.5 border border-[#2A2E3D]">
                                <span className="text-[8px] text-[#64748B] uppercase">HEALTH INDEX</span>
                                <span className="text-xs font-bold text-[#F3F4F6] text-right">
                                    {(100 - (v.score * 100)).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex flex-col bg-[#161922] p-1.5 border border-[#2A2E3D]">
                                <span className="text-[8px] text-[#64748B] uppercase">CORE TEMP</span>
                                <span className="text-xs font-bold text-[#F3F4F6] text-right">
                                    {v.maxTemp.toFixed(1)}°C
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
