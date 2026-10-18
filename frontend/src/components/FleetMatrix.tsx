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
            <div className="text-xs font-mono text-[#64748B] border-2 border-dashed border-[#242938] p-6 text-center bg-[#0A0C10]">
                AWAITING_TELEMETRY_INGESTION...
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2 pb-1">
            {vehicles.map((v) => {
                const isSelected = v.vin === selectedVin;
                const isFault = v.status === 'FAULT';
                const isWarn = v.status === 'WARN';

                let borderColor = '#242938';
                let statusBadgeColor = '#10B981';
                let cardBg = isSelected ? 'bg-[#181C26]' : 'bg-[#12151D]';

                if (isSelected) {
                    borderColor = '#00F0FF';
                }
                if (isFault) {
                    statusBadgeColor = '#EF4444';
                    if (!isSelected) borderColor = '#EF444488';
                } else if (isWarn) {
                    statusBadgeColor = '#FFD000';
                    if (!isSelected) borderColor = '#FFD00088';
                }

                return (
                    <div 
                        key={v.vin} 
                        onClick={() => onSelectVin(v.vin)}
                        style={{ borderColor }}
                        className={`clickable cursor-pointer p-3 flex flex-col transition-all border-2 shadow-[3px_3px_0px_#000000] ${cardBg} ${
                            isSelected ? 'translate-x-1 shadow-[4px_4px_0px_#000000]' : 'hover:border-[#384158]'
                        }`}
                    >
                        {/* Card Header */}
                        <div className="flex justify-between items-center mb-2 pb-1 border-b border-[#242938]">
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 flex items-center justify-center">
                                    {isFault ? (
                                        <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                                    ) : isWarn ? (
                                        <AlertTriangle className="w-4 h-4 text-[#FFD000]" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                                    )}
                                </div>
                                <span className="font-mono text-xs font-bold text-white tracking-tight">
                                    {v.vin}
                                </span>
                            </div>
                            <span 
                                style={{ color: statusBadgeColor, borderColor: statusBadgeColor }}
                                className="text-[9px] font-mono px-1.5 py-0.5 border bg-[#0A0C10] font-black tracking-wider"
                            >
                                {v.status}
                            </span>
                        </div>

                        {/* Telemetry Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div className="flex flex-col bg-[#0A0C10] p-1.5 border border-[#242938]">
                                <span className="text-[8px] text-[#64748B] uppercase font-bold">HEALTH INDEX</span>
                                <span className="font-mono font-black text-sm text-white text-right">
                                    {(100 - (v.score * 100)).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex flex-col bg-[#0A0C10] p-1.5 border border-[#242938]">
                                <span className="text-[8px] text-[#64748B] uppercase font-bold">CORE TEMP</span>
                                <span className="font-mono font-black text-sm text-white text-right">
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
