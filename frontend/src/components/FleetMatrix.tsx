import React from "react";
import { VehicleRecord } from "@/app/page";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

export default function FleetMatrix({ vehicles, selectedVin, onSelectVin }: { 
    vehicles: VehicleRecord[], 
    selectedVin: string | null,
    onSelectVin: (vin: string) => void 
}) {
    if (vehicles.length === 0) {
        return (
            <div className="text-xs font-mono text-[#4B5565] border-2 border-dashed border-[#1E2229] p-6 text-center bg-[#ECEEEA] font-bold">
                AWAITING_TELEMETRY_INGESTION...
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2.5 pb-1">
            {vehicles.map((v) => {
                const isSelected = v.vin === selectedVin;
                const isFault = v.status === "FAULT";
                const isWarn = v.status === "WARN";

                let statusBadgeBg = "bg-[#E2F7ED] text-[#059669]";
                let cardBg = isSelected ? "bg-[#DFE3DC]" : "bg-[#FFFFFF]";

                if (isFault) {
                    statusBadgeBg = "bg-[#FEE2E2] text-[#DC2626]";
                } else if (isWarn) {
                    statusBadgeBg = "bg-[#FEF3C7] text-[#D97706]";
                }

                return (
                    <div 
                        key={v.vin} 
                        onClick={() => onSelectVin(v.vin)}
                        className={`clickable cursor-pointer p-3 flex flex-col transition-all border-2 border-[#1E2229] shadow-[3px_3px_0px_#1E2229] ${cardBg} ${
                            isSelected ? "translate-x-1 shadow-[4px_4px_0px_#1E2229] ring-1 ring-[#1E2229]" : "hover:bg-[#F8FAF7]"
                        }`}
                    >
                        {/* Card Header */}
                        <div className="flex justify-between items-center mb-2 pb-1 border-b border-[#1E2229]/20">
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 flex items-center justify-center">
                                    {isFault ? (
                                        <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                                    ) : isWarn ? (
                                        <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                                    )}
                                </div>
                                <span className="font-mono text-xs font-black text-[#0F131A] tracking-tight">
                                    {v.vin}
                                </span>
                            </div>
                            <span 
                                className={`text-[9px] font-mono px-1.5 py-0.5 border border-[#1E2229] font-black tracking-wider ${statusBadgeBg}`}
                            >
                                {v.status}
                            </span>
                        </div>

                        {/* Telemetry Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div className="flex flex-col bg-[#ECEEEA] p-1.5 border border-[#1E2229]">
                                <span className="text-[8px] text-[#4B5565] uppercase font-bold">HEALTH INDEX</span>
                                <span className="font-mono font-black text-sm text-[#0F131A] text-right">
                                    {(100 - (v.score * 100)).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex flex-col bg-[#ECEEEA] p-1.5 border border-[#1E2229]">
                                <span className="text-[8px] text-[#4B5565] uppercase font-bold">CORE TEMP</span>
                                <span className="font-mono font-black text-sm text-[#0F131A] text-right">
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
