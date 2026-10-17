import React from 'react';
import { VehicleRecord } from '@/app/page';
import { Battery, Zap, Thermometer, Activity, Grid } from 'lucide-react';

const BlockyProgress = ({ value, max, label, color, unit, icon: Icon }: any) => {
    const progress = Math.min((value / max) * 100, 100);

    return (
        <div className="flex flex-col border border-[#2A2E3D] p-3.5 bg-[#0D0F14] shadow-[2px_2px_0px_#000000]">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-[#06B6D4]" strokeWidth={2.5} />
                    <span className="text-[11px] font-mono uppercase text-[#9CA3AF] tracking-wider">{label}</span>
                </div>
                <span className="text-[10px] font-mono text-[#64748B]">[{unit}]</span>
            </div>
            
            <div className="flex items-baseline justify-between mb-2">
                <span className="font-mono text-2xl font-black text-[#F3F4F6] tracking-tight">{value}</span>
                <span className="text-[10px] font-mono text-[#64748B]">MAX {max}{unit}</span>
            </div>

            <div className="w-full h-2.5 border border-[#2A2E3D] bg-[#161922] overflow-hidden relative">
                <div 
                    className="absolute top-0 bottom-0 left-0 transition-all duration-300" 
                    style={{ width: `${progress}%`, backgroundColor: color }}
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
        <div className="h-full flex flex-col p-4 bg-[#161922]">
            <div className="flex justify-between items-center mb-4 border-b border-[#2A2E3D] pb-3">
                <div className="flex items-center space-x-2.5">
                    <Zap className="w-4 h-4 text-[#06B6D4]" />
                    <span className="text-sm font-heading text-[#F3F4F6] tracking-wider uppercase">TELEMETRY INSTRUMENTATION</span>
                    <span className="text-[9px] font-mono bg-[#0D0F14] text-[#06B6D4] border border-[#2A2E3D] px-2 py-0.5 font-bold">
                        {isSingleCell ? 'BENCH_CELL' : 'FULL_PACK'}
                    </span>
                </div>

                {onSwitchToThermal && (
                    <button
                        onClick={onSwitchToThermal}
                        className="neo-btn text-[10px] font-mono px-2.5 py-1 text-[#F3F4F6] hover:text-[#06B6D4] flex items-center uppercase tracking-wider"
                        title="Switch to Thermal Matrix"
                    >
                        <Grid className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" />
                        Thermal Map →
                    </button>
                )}
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-3.5">
                <BlockyProgress 
                    value={vehicle.packVoltage.toFixed(2)} 
                    max={maxVoltage} 
                    label={isSingleCell ? "Cell Volts" : "Pack Voltage"} 
                    unit="V"
                    color="#10B981" 
                    icon={Zap}
                />
                
                <BlockyProgress 
                    value={absCurrent.toFixed(1)} 
                    max={maxCurrent} 
                    label="Bus Current" 
                    unit="A"
                    color={isCurrentHigh ? '#F59E0B' : '#06B6D4'} 
                    icon={Activity}
                />
                
                <BlockyProgress 
                    value={vehicle.maxTemp.toFixed(1)} 
                    max={maxTemp} 
                    label="Core Temp" 
                    unit="°C"
                    color={vehicle.maxTemp > 50 ? '#EF4444' : vehicle.maxTemp > 35 ? '#F59E0B' : '#10B981'} 
                    icon={Thermometer}
                />

                <BlockyProgress 
                    value={(vehicle.deltaV * (isSingleCell ? 1 : 1000)).toFixed(1)} 
                    max={isSingleCell ? 0.05 : 150} 
                    label="Cell Imbalance" 
                    unit={isSingleCell ? "V" : "mV"}
                    color={vehicle.deltaV > (isSingleCell ? 0.03 : 0.08) ? '#EF4444' : '#10B981'} 
                    icon={Battery}
                />
            </div>
        </div>
    );
}
