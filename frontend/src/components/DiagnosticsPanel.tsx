import React from 'react';
import { VehicleRecord } from '@/app/page';
import { Battery, Zap, Thermometer, Activity } from 'lucide-react';

const CircularProgress = ({ value, max, label, color, unit, icon: Icon }: any) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    // Cap progress at 100% so gauge doesn't overflow visually
    const progress = Math.min((value / max) * 100, 100);
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-2">
            <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="transform -rotate-90 w-20 h-20">
                    <circle cx="40" cy="40" r="30" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="transparent" />
                    <circle 
                        cx="40" 
                        cy="40" 
                        r="30" 
                        stroke={color} 
                        strokeWidth="4" 
                        fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        className="transition-all duration-500 ease-out"
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <Icon className="w-4 h-4 mb-0.5" style={{ color }} />
                    <span className="text-xs font-bold text-gray-200">{value}</span>
                </div>
            </div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-2 text-center flex flex-col">
                <span>{label}</span>
                <span className="text-[#6B7280]">({unit})</span>
            </span>
        </div>
    );
};

export default function DiagnosticsPanel({ vehicle }: { vehicle: VehicleRecord }) {
    const isFault = vehicle.status === 'FAULT';

    // Detect if this is a single cell (NASA) or full EV Pack telemetry frame
    const isSingleCell = vehicle.packVoltage < 10;
    
    const maxVoltage = isSingleCell ? 4.5 : 450;
    const maxCurrent = isSingleCell ? 5.0 : 200;
    const maxTemp = isSingleCell ? 60 : 80;

    const absCurrent = Math.abs(vehicle.packCurrent);
    const isCurrentHigh = isSingleCell ? absCurrent > 3.0 : absCurrent > 150;

    return (
        <div className={`glass-card h-full rounded-xl p-4 flex flex-col relative overflow-hidden transition-all duration-300 ${isFault ? 'border-[var(--color-accent-pink)]/50' : 'border-white/5'}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex justify-between">
                <span>Core Telemetry Gauges</span>
                <span className="text-gray-600 text-[10px]">Real-time ({isSingleCell ? 'Cell-Level' : 'Pack-Level'})</span>
            </h2>
            
            <div className="flex-1 flex items-center justify-around">
                <CircularProgress 
                    value={vehicle.packVoltage.toFixed(1)} 
                    max={maxVoltage} 
                    label={isSingleCell ? "Cell Voltage" : "Pack Voltage"} 
                    unit="Volts"
                    color="var(--color-accent-emerald)" 
                    icon={Zap}
                />
                
                <CircularProgress 
                    value={absCurrent.toFixed(1)} 
                    max={maxCurrent} 
                    label="Current Draw" 
                    unit="Amps"
                    color={isCurrentHigh ? 'var(--color-accent-amber)' : 'var(--color-accent-cyan)'} 
                    icon={Activity}
                />
                
                <CircularProgress 
                    value={vehicle.maxTemp.toFixed(1)} 
                    max={maxTemp} 
                    label="Max Core Temp" 
                    unit="°C"
                    color={vehicle.maxTemp > 50 ? 'var(--color-accent-pink)' : 'var(--color-accent-emerald)'} 
                    icon={Thermometer}
                />

                <CircularProgress 
                    value={vehicle.deltaV.toFixed(1)} 
                    max={isSingleCell ? 0.05 : 150} 
                    label="Cell Imbalance" 
                    unit={isSingleCell ? "Volts" : "mV Delta"}
                    color={vehicle.deltaV > (isSingleCell ? 0.03 : 80) ? 'var(--color-accent-pink)' : 'var(--color-accent-amber)'} 
                    icon={Battery}
                />
            </div>
        </div>
    );
}
