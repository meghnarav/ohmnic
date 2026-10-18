import React from 'react';
import { VehicleRecord } from '@/app/page';
import { Battery, Zap, Thermometer, Activity, Grid } from 'lucide-react';

const BlockyProgress = ({ value, max, label, color, unit, icon: Icon, tag }: any) => {
    const progress = Math.min((value / max) * 100, 100);

    return (
        <div className="flex flex-col border-2 border-[#242938] p-3 bg-[#0A0C10] shadow-[3px_3px_0px_#000000]">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#242938]/60">
                <div className="flex items-center space-x-2">
                    <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={2.5} />
                    <span className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold tracking-wider">{label}</span>
                </div>
                <span className="text-[9px] font-mono text-[#64748B] font-bold">[{tag}]</span>
            </div>
            
            <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline space-x-1">
                    <span className="font-mono font-black text-3xl tracking-tight text-white leading-none">{value}</span>
                    <span className="font-mono text-xs font-bold text-[#64748B]">{unit}</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-[#64748B]">MAX {max}{unit}</span>
            </div>

            {/* High-contrast dark inset track */}
            <div className="w-full h-3.5 border border-[#242938] bg-[#0A0C10] relative overflow-hidden">
                <div 
                    className="absolute top-0 bottom-0 left-0 transition-all duration-300" 
                    style={{ 
                        width: `${progress}%`, 
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}88`
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
        <div className="h-full flex flex-col bg-[#12151D]">
            {/* Two-tone Mechanical Header Bar */}
            <div className="bg-[#181C26] px-3 py-1.5 border-b-2 border-[#242938] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-[#0A0C10] border border-[#242938] text-[#00F0FF]">
                        [MOD-01 // TELEMETRY]
                    </span>
                    <span className="text-xs font-heading font-black tracking-wider uppercase text-white">
                        TELEMETRY INSTRUMENTATION
                    </span>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-mono bg-[#0A0C10] text-[#10B981] border border-[#242938] px-2 py-0.5 font-bold">
                        {isSingleCell ? 'BENCH_CELL_4S' : 'PACK_BUS_HV'}
                    </span>
                    {onSwitchToThermal && (
                        <button
                            onClick={onSwitchToThermal}
                            className="neo-btn text-[9px] font-mono font-bold px-2 py-0.5 text-white hover:text-[#00F0FF] flex items-center uppercase tracking-wider"
                            title="Switch to Thermal Matrix"
                        >
                            <Grid className="w-3 h-3 mr-1 text-[#FFD000]" />
                            Thermal Map →
                        </button>
                    )}
                </div>
            </div>
            
            {/* 4 Instrumentation Wells */}
            <div className="p-3.5 flex-1 grid grid-cols-2 gap-3 bg-[#12151D]">
                <BlockyProgress 
                    value={vehicle.packVoltage.toFixed(2)} 
                    max={maxVoltage} 
                    label={isSingleCell ? "Cell Potential" : "Pack Potential"} 
                    unit="V"
                    tag="VOLT_DC"
                    color="#10B981" 
                    icon={Zap}
                />
                
                <BlockyProgress 
                    value={absCurrent.toFixed(1)} 
                    max={maxCurrent} 
                    label="Bus Current Draw" 
                    unit="A"
                    tag="CURR_RMS"
                    color={isCurrentHigh ? '#FFD000' : '#00F0FF'} 
                    icon={Activity}
                />
                
                <BlockyProgress 
                    value={vehicle.maxTemp.toFixed(1)} 
                    max={maxTemp} 
                    label="Core Thermal Peak" 
                    unit="°C"
                    tag="TEMP_JUNCT"
                    color={vehicle.maxTemp > 50 ? '#EF4444' : vehicle.maxTemp > 35 ? '#FFD000' : '#10B981'} 
                    icon={Thermometer}
                />

                <BlockyProgress 
                    value={(vehicle.deltaV * (isSingleCell ? 1 : 1000)).toFixed(1)} 
                    max={isSingleCell ? 0.05 : 150} 
                    label="Cell Imbalance" 
                    unit={isSingleCell ? "V" : "mV"}
                    tag="DELTA_VAR"
                    color={vehicle.deltaV > (isSingleCell ? 0.03 : 0.08) ? '#EF4444' : '#10B981'} 
                    icon={Battery}
                />
            </div>
        </div>
    );
}
