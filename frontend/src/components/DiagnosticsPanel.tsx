import React from "react";
import { VehicleRecord } from "@/app/page";
import { Battery, Zap, Thermometer, Activity, Grid } from "lucide-react";

const BlockyProgress = ({ value, max, label, color, unit, icon: Icon, tag }: any) => {
    const progress = Math.min((parseFloat(value) / max) * 100, 100);

    return (
        <div className="flex flex-col border-2 border-[#1E2229] p-2.5 bg-[#FFFFFF] shadow-[3px_3px_0px_#1E2229]">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#1E2229]/20">
                <div className="flex items-center space-x-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={2.5} />
                    <span className="text-[#4B5565] font-mono font-bold text-xs uppercase tracking-wider">{label}</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-[#4B5565]">[{tag}]</span>
            </div>
            
            <div className="flex items-baseline justify-between mb-1.5">
                <div className="flex items-baseline space-x-1.5">
                    <span className="text-[#0F131A] font-mono font-black tracking-tighter text-3xl leading-none">{value}</span>
                    <span className="text-[#1E2229] font-mono font-bold text-[10px] bg-[#ECEEEA] px-1 border border-[#1E2229]">{unit}</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-[#4B5565]">MAX {max}{unit}</span>
            </div>

            {/* Recessed Mechanical Track */}
            <div className="bg-[#ECEEEA] border-2 border-[#1E2229] h-4 w-full p-[2px] flex items-center overflow-hidden">
                <div 
                    className="h-full transition-all duration-200" 
                    style={{ 
                        width: `${Math.max(2, progress)}%`, 
                        backgroundColor: color
                    }}
                />
            </div>
        </div>
    );
};

interface DiagnosticsPanelProps {
    vehicle: VehicleRecord;
    onSwitchToThermal?: () => void;
}

export default function DiagnosticsPanel({ vehicle, onSwitchToThermal }: DiagnosticsPanelProps) {
    const isSingleCell = vehicle.packVoltage < 10;
    
    const maxVoltage = isSingleCell ? 4.5 : 450;
    const maxCurrent = isSingleCell ? 5.0 : 200;
    const maxTemp = isSingleCell ? 60 : 80;

    const absCurrent = Math.abs(vehicle.packCurrent);
    const isCurrentHigh = isSingleCell ? absCurrent > 3.0 : absCurrent > 150;

    return (
        <div className="h-full flex flex-col bg-[#FFFFFF] text-[#0F131A]">
            {/* Module Rack Strip Header */}
            <div className="bg-[#DFE3DC] px-3 py-1.5 border-b-2 border-[#1E2229] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-[#1E2229] bg-white px-1.5 py-0.5 border border-[#1E2229]">
                        [MOD-01]
                    </span>
                    <h2 className="text-xs font-mono font-black tracking-widest text-[#1E2229] uppercase">
                        BATTERY CELL TELEMETRY
                    </h2>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-[#1E2229] bg-[#ECEEEA] px-1.5 py-0.5 border border-[#1E2229]">
                        {isSingleCell ? "BENCH_CELL_4S" : "PACK_BUS_HV"}
                    </span>
                    {onSwitchToThermal && (
                        <button
                            onClick={onSwitchToThermal}
                            className="neo-btn text-[9px] font-mono font-bold px-2 py-0.5 text-[#1E2229] hover:bg-[#DFE3DC] flex items-center uppercase tracking-wider"
                            title="Switch to Thermal Matrix"
                        >
                            <Grid className="w-3 h-3 mr-1 text-[#D97706]" />
                            Thermal Map →
                        </button>
                    )}
                </div>
            </div>
            
            {/* 4 Instrumentation Wells */}
            <div className="p-2.5 flex-1 grid grid-cols-2 gap-2.5 bg-[#FFFFFF]">
                <BlockyProgress 
                    value={vehicle.packVoltage.toFixed(2)} 
                    max={maxVoltage} 
                    label={isSingleCell ? "Cell Potential" : "Pack Potential"} 
                    unit="V"
                    tag="VOLT_DC"
                    color="#059669" 
                    icon={Zap}
                />
                
                <BlockyProgress 
                    value={absCurrent.toFixed(1)} 
                    max={maxCurrent} 
                    label="Bus Current Draw" 
                    unit="A"
                    tag="CURR_RMS"
                    color={isCurrentHigh ? "#D97706" : "#2563EB"} 
                    icon={Activity}
                />
                
                <BlockyProgress 
                    value={vehicle.maxTemp.toFixed(1)} 
                    max={maxTemp} 
                    label="Core Thermal Peak" 
                    unit="°C"
                    tag="TEMP_JUNCT"
                    color={vehicle.maxTemp > 50 ? "#DC2626" : vehicle.maxTemp > 35 ? "#D97706" : "#059669"} 
                    icon={Thermometer}
                />

                <BlockyProgress 
                    value={(vehicle.deltaV * (isSingleCell ? 1 : 1000)).toFixed(1)} 
                    max={isSingleCell ? 0.05 : 150} 
                    label="Cell Imbalance" 
                    unit={isSingleCell ? "V" : "mV"}
                    tag="DELTA_VAR"
                    color={vehicle.deltaV > (isSingleCell ? 0.03 : 0.08) ? "#DC2626" : "#059669"} 
                    icon={Battery}
                />
            </div>
        </div>
    );
}
