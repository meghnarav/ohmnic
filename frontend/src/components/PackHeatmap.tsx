import React from 'react';
import { VehicleRecord } from '@/app/page';
import { Grid } from 'lucide-react';

export default function PackHeatmap({ vehicle }: { vehicle: VehicleRecord }) {
    const rows = 4;
    const cols = 8;
    const cells = Array.from({ length: rows * cols });
    const hotCellIndex = vehicle.status !== 'NOMINAL' ? Math.floor(Math.random() * cells.length) : -1;

    return (
        <div className="h-full flex flex-col bg-[var(--color-accent-amber)] p-4 border-l-4 border-black">
            <h2 className="text-xl font-heading text-black mb-4 border-b-4 border-black pb-2 flex justify-between items-center">
                <span className="flex items-center"><Grid className="w-5 h-5 mr-2" strokeWidth={3} /> THERMAL</span>
            </h2>
            
            <div className="flex-1 flex items-center justify-center p-2 border-4 border-black bg-white shadow-[6px_6px_0_0_#111]">
                <div className="grid grid-cols-8 gap-1 w-full max-w-[240px]">
                    {cells.map((_, idx) => {
                        let isHot = idx === hotCellIndex;
                        let isWarm = !isHot && vehicle.status !== 'NOMINAL' && Math.abs(idx - hotCellIndex) <= 2;
                        
                        let bgColor = 'bg-gray-100';
                        if (isHot && vehicle.status === 'FAULT') bgColor = 'bg-[var(--color-accent-pink)]';
                        else if (isHot && vehicle.status === 'WARN') bgColor = 'bg-[var(--color-accent-amber)]';
                        else if (isWarm && vehicle.status === 'FAULT') bgColor = 'bg-[var(--color-accent-pink)]/50';
                        else if (isWarm && vehicle.status === 'WARN') bgColor = 'bg-[var(--color-accent-amber)]/50';
                        else if (vehicle.status === 'NOMINAL') bgColor = 'bg-[var(--color-accent-emerald)]';

                        return (
                            <div 
                                key={idx} 
                                className={`w-full pt-[100%] border-2 border-black ${bgColor}`}
                            />
                        );
                    })}
                </div>
            </div>
            
            <div className="mt-3 flex justify-between text-[10px] font-mono font-bold text-black uppercase">
                <span className="bg-white border-2 border-black px-1 shadow-[2px_2px_0_0_#111]">FRONT</span>
                <span className="bg-white border-2 border-black px-1 shadow-[2px_2px_0_0_#111]">REAR</span>
            </div>
        </div>
    );
}
