import React from 'react';
import { VehicleRecord } from '@/app/page';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function FleetMatrix({ vehicles, selectedVin, onSelectVin }: { 
    vehicles: VehicleRecord[], 
    selectedVin: string | null,
    onSelectVin: (vin: string) => void 
}) {
    if (vehicles.length === 0) {
        return <div className="text-sm font-bold border-4 border-dashed border-gray-300 p-4 text-center">AWAITING TELEMETRY</div>;
    }

    return (
        <div className="flex flex-col space-y-3 pb-2">
            {vehicles.map((v) => {
                const isSelected = v.vin === selectedVin;
                const isFault = v.status === 'FAULT';
                const isWarn = v.status === 'WARN';

                let bgColor = 'bg-white';
                if (isFault) bgColor = 'bg-[var(--color-accent-pink)]';
                else if (isWarn) bgColor = 'bg-[var(--color-accent-amber)]';
                else if (isSelected) bgColor = 'bg-[#f0f0f0]';

                return (
                    <div 
                        key={v.vin} 
                        onClick={() => onSelectVin(v.vin)}
                        className={`neo-card clickable cursor-pointer p-3 flex flex-col transition-transform ${bgColor} ${isSelected ? 'translate-y-[2px] translate-x-[2px] shadow-[2px_2px_0px_0px_#111]' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-2">
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 border-2 border-black bg-white flex items-center justify-center">
                                    {isFault ? <AlertTriangle className="w-4 h-4 text-black" strokeWidth={3} /> : <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={3} />}
                                </div>
                                <span className="font-heading text-black text-lg tracking-tight">{v.vin}</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-1 border-2 border-black bg-white font-bold tracking-widest text-black shadow-[2px_2px_0_0_#111]">
                                {v.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="flex flex-col border-2 border-black bg-white p-1">
                                <span className="text-[9px] font-mono font-bold text-gray-500 uppercase px-1 border-b border-gray-300 mb-1">Health Score</span>
                                <span className="text-sm font-mono font-black text-black px-1 text-right">{(100 - (v.score * 100)).toFixed(1)}%</span>
                            </div>
                            <div className="flex flex-col border-2 border-black bg-white p-1">
                                <span className="text-[9px] font-mono font-bold text-gray-500 uppercase px-1 border-b border-gray-300 mb-1">Max Temp</span>
                                <span className="text-sm font-mono font-black text-black px-1 text-right">{v.maxTemp.toFixed(1)}°C</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
