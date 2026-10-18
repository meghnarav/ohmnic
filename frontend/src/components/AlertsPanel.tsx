import React from "react";
import { VehicleRecord } from "@/app/page";
import { Bell, AlertTriangle, CheckCircle2 } from "lucide-react";

interface AlertsPanelProps {
    fleet: VehicleRecord[];
    onSelectVin?: (vin: string) => void;
}

export default function AlertsPanel({ fleet, onSelectVin }: AlertsPanelProps) {
    const alerts = fleet.filter(v => v.status === "FAULT" || v.status === "WARN");

    return (
        <div className="h-full flex flex-col bg-[#FFFFFF] text-[#0F131A]">
            {/* Titlebar Rack Strip */}
            <div className="bg-[#DFE3DC] px-3 py-1.5 border-b-2 border-[#1E2229] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-[#1E2229] bg-white px-1.5 py-0.5 border border-[#1E2229]">
                        [QUEUE // ALERTS]
                    </span>
                    <span className="text-xs font-mono font-black uppercase tracking-widest text-[#1E2229]">
                        ANOMALY TICKETS
                    </span>
                </div>
                <span className={`text-[9px] font-mono font-black px-2 py-0.5 border border-[#1E2229] ${
                    alerts.length > 0
                        ? "bg-[#FEE2E2] text-[#DC2626]"
                        : "bg-[#ECEEEA] text-[#4B5565]"
                }`}>
                    {alerts.length} ALERTS
                </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-[#FFFFFF]">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 border-2 border-dashed border-[#1E2229] bg-[#ECEEEA] p-4">
                        <CheckCircle2 className="w-6 h-6 text-[#059669]" strokeWidth={2.5} />
                        <span className="text-xs font-mono font-bold uppercase text-[#0F131A]">ZERO_ANOMALY_TICKETS</span>
                        <span className="text-[9px] font-mono text-[#4B5565] font-semibold">All fleet battery packs within nominal 3-sigma bounds.</span>
                    </div>
                ) : (
                    alerts.map((alert, i) => (
                        <div 
                            key={`${alert.vin}-${i}`} 
                            onClick={() => onSelectVin && onSelectVin(alert.vin)}
                            className="border-2 border-[#1E2229] p-2.5 flex flex-col transition-all cursor-pointer bg-[#FFFFFF] shadow-[2px_2px_0px_#1E2229] hover:bg-[#F8FAF7]"
                        >
                            <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#1E2229]/20">
                                <div className="flex items-center space-x-1.5">
                                    <AlertTriangle className={`w-3.5 h-3.5 ${alert.status === "FAULT" ? "text-[#DC2626]" : "text-[#D97706]"}`} />
                                    <span className="font-mono text-xs font-black text-[#0F131A] uppercase">{alert.vin}</span>
                                </div>
                                <span className={`text-[8px] px-1.5 py-0.5 font-mono font-black border border-[#1E2229] ${
                                    alert.status === "FAULT" ? "text-[#DC2626] bg-[#FEE2E2]" : "text-[#D97706] bg-[#FEF3C7]"
                                }`}>
                                    {alert.status}
                                </span>
                            </div>
                            <div className="text-[10px] font-mono text-[#4B5565] leading-tight font-medium mt-1">
                                {alert.status === "FAULT" 
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
