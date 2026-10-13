import React from 'react';
import { VehicleRecord } from '@/app/page';
import { Battery, Zap, Thermometer, Activity, Grid } from 'lucide-react';

const BlockyProgress = ({ value, max, label, color, unit, icon: Icon }: any) => {
    const progress = Math.min((value / max) * 100, 100);

    return (
        <div className="flex flex-col border-4 border-black p-3 bg-white shadow-[4px_4px_0_0_#111] min-w-[120px]">
            <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-black" strokeWidth={2.5} />
                <span className="font-heading text-xl text-black">{value}</span>
            </div>
            <div className="w-full h-4 border-2 border-black bg-gray-100 overflow-hidden relative">
                <div 
                    className="absolute top-0 bottom-0 left-0 border-r-2 border-black" 
                    style={{ width: `${progress}%`, backgroundColor: color }}
                />
            </div>
            <div className="mt-2 text-left flex justify-between items-end">
                <span className="text-[10px] font-mono font-bold uppercase text-black max-w-[65%] leading-tight">{label}</span>
                <span className="text-[10px] font-mono font-bold text-gray-500">[{unit}]</span>
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
        <div className="h-full flex flex-col p-4 bg-[var(--color-canvas)]">
            <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-2">
                <div className="flex items-center space-x-2">
                    <span className="text-xl font-heading text-black">TELEMETRY GAUGES</span>
                    <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 font-bold">
                        [{isSingleCell ? 'CELL BENCH' : 'PACK BUS'}]
                    </span>
                </div>

                {onSwitchToThermal && (
                    <button
                        onClick={onSwitchToThermal}
                        className="neo-btn text-[10px] font-heading px-2 py-1 bg-[var(--color-accent-amber)] hover:bg-yellow-400 text-black flex items-center uppercase"
                        title="Switch to Thermal Matrix"
                    >
                        <Grid className="w-3.5 h-3.5 mr-1" />
                        Thermal Map →
                    </button>
                )}
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-4">
                <BlockyProgress 
                    value={vehicle.packVoltage.toFixed(1)} 
                    max={maxVoltage} 
                    label={isSingleCell ? "Cell Volts" : "Pack Volts"} 
                    unit="V"
                    color="var(--color-accent-emerald)" 
                    icon={Zap}
                />
                
                <BlockyProgress 
                    value={absCurrent.toFixed(1)} 
                    max={maxCurrent} 
                    label="Bus Current" 
                    unit="A"
                    color={isCurrentHigh ? 'var(--color-accent-amber)' : 'var(--color-accent-cyan)'} 
                    icon={Activity}
                />
                
                <BlockyProgress 
                    value={vehicle.maxTemp.toFixed(1)} 
                    max={maxTemp} 
                    label="Core Temp" 
                    unit="°C"
                    color={vehicle.maxTemp > 50 ? 'var(--color-accent-pink)' : 'var(--color-accent-amber)'} 
                    icon={Thermometer}
                />

                <BlockyProgress 
                    value={vehicle.deltaV.toFixed(1)} 
                    max={isSingleCell ? 0.05 : 150} 
                    label="Cell Imbalance" 
                    unit={isSingleCell ? "V" : "mV"}
                    color={vehicle.deltaV > (isSingleCell ? 0.03 : 80) ? 'var(--color-accent-pink)' : 'var(--color-accent-emerald)'} 
                    icon={Battery}
                />
            </div>
        </div>
    );
}
