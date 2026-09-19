import React from 'react';
import { VehicleRecord } from '@/app/page';

export default function FleetMatrix({ vehicles, selectedVin, onSelectVin }: { vehicles: VehicleRecord[], selectedVin: string | null, onSelectVin: (vin: string) => void }) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#242933]">
                <span className="text-xs text-gray-400">Total Active Vehicles: {vehicles.length}</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {vehicles.map((v) => {
                    const prob = v.score * 100;
                    return (
                        <div 
                            key={v.vin} 
                            onClick={() => onSelectVin(v.vin)}
                            className={`p-3 border cursor-pointer transition-colors ${selectedVin === v.vin ? 'bg-[#16181D] border-[#06B6D4]' : 'bg-[#0B0C0E] border-[#242933] hover:border-gray-500'}`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-200">{v.vin}</span>
                                <span className={`text-[10px] px-2 py-0.5 font-bold ${v.status === 'FAULT' ? 'bg-[#ff4876] text-black' : v.status === 'WARN' ? 'bg-[#F5A623] text-black' : 'bg-[#242933] text-emerald-500'}`}>
                                    {v.status}
                                </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 flex justify-between">
                                <span>Volt: {v.packVoltage.toFixed(1)}V</span>
                                <span>Anomaly: {prob.toFixed(1)}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
