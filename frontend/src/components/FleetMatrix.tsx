import React from 'react';
import { VehicleRecord } from '@/app/page';
import { Activity, Battery, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function FleetMatrix({ vehicles, selectedVin, onSelectVin }: { 
    vehicles: VehicleRecord[], 
    selectedVin: string | null,
    onSelectVin: (vin: string) => void 
}) {
    if (vehicles.length === 0) {
        return <div className="text-sm text-gray-500 italic">Awaiting telemetry...</div>;
    }

    return (
        <div className="grid grid-cols-1 gap-3">
            {vehicles.map((v) => {
                const isSelected = v.vin === selectedVin;
                const isFault = v.status === 'FAULT';
                const isWarn = v.status === 'WARN';

                return (
                    <div 
                        key={v.vin} 
                        onClick={() => onSelectVin(v.vin)}
                        className={`glass-card cursor-pointer rounded-lg p-4 flex flex-col relative overflow-hidden transition-all duration-300 ${isSelected ? 'border-[var(--color-accent-cyan)] ring-1 ring-[var(--color-accent-cyan)]' : 'border-white/5'} ${isFault ? 'animate-pulse' : ''}`}
                    >
                        {/* Status glow strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isFault ? 'bg-[var(--color-accent-pink)] shadow-[0_0_10px_var(--color-accent-pink)]' : isWarn ? 'bg-[var(--color-accent-amber)]' : 'bg-[var(--color-accent-emerald)]'}`} />
                        
                        <div className="flex justify-between items-start mb-2 pl-2">
                            <div className="flex items-center space-x-2">
                                {isFault ? <AlertTriangle className="w-4 h-4 text-[var(--color-accent-pink)]" /> : <CheckCircle2 className="w-4 h-4 text-[var(--color-accent-emerald)]" />}
                                <span className="font-bold text-gray-200 tracking-wider text-sm">{v.vin}</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold tracking-widest ${isFault ? 'bg-[var(--color-accent-pink)]/20 text-[var(--color-accent-pink)]' : isWarn ? 'bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)]' : 'bg-[var(--color-accent-emerald)]/20 text-[var(--color-accent-emerald)]'}`}>
                                {v.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pl-2 mt-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase">Health Score</span>
                                <span className={`text-lg font-mono font-bold ${isFault ? 'text-[var(--color-accent-pink)]' : 'text-gray-200'}`}>{(100 - (v.score * 100)).toFixed(1)}%</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase">Pack Temp</span>
                                <span className="text-lg font-mono font-bold text-gray-300">{v.maxTemp.toFixed(1)}°C</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
