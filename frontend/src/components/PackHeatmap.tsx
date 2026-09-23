import React from 'react';
import { VehicleRecord } from '@/app/page';

export default function PackHeatmap({ vehicle }: { vehicle: VehicleRecord }) {
    // Generate an 8x4 simulated cell grid based on the maxTemp and deltaV
    const rows = 4;
    const cols = 8;
    const cells = Array.from({ length: rows * cols });

    // Find the theoretical "hot" cell block based on variance
    const hotCellIndex = vehicle.status !== 'NOMINAL' ? Math.floor(Math.random() * cells.length) : -1;

    return (
        <div className={`glass-card h-full rounded-xl p-4 flex flex-col relative overflow-hidden transition-all duration-300 ${vehicle.status === 'FAULT' ? 'border-[var(--color-accent-pink)]/40 bg-[var(--color-accent-pink)]/5' : 'border-white/5'}`}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-white/10 pb-2 flex justify-between">
                <span>Thermal Map</span>
                <span className="text-gray-600">Top Down</span>
            </h2>
            
            <div className="flex-1 flex items-center justify-center p-2">
                <div className="grid grid-cols-8 gap-1 w-full max-w-[200px] aspect-[2/1]">
                    {cells.map((_, idx) => {
                        let isHot = idx === hotCellIndex;
                        let isWarm = !isHot && vehicle.status !== 'NOMINAL' && Math.abs(idx - hotCellIndex) <= 2;
                        
                        let bgColor = 'bg-white/10';
                        if (isHot && vehicle.status === 'FAULT') bgColor = 'bg-[var(--color-accent-pink)] shadow-[0_0_8px_var(--color-accent-pink)] animate-pulse';
                        else if (isHot && vehicle.status === 'WARN') bgColor = 'bg-[var(--color-accent-amber)] animate-pulse';
                        else if (isWarm && vehicle.status === 'FAULT') bgColor = 'bg-[var(--color-accent-pink)]/40';
                        else if (isWarm && vehicle.status === 'WARN') bgColor = 'bg-[var(--color-accent-amber)]/40';
                        else if (vehicle.status === 'NOMINAL') bgColor = 'bg-[var(--color-accent-emerald)]/30';

                        return (
                            <div 
                                key={idx} 
                                className={`w-full pt-[100%] rounded-sm relative overflow-hidden transition-colors duration-1000 ${bgColor}`}
                            >
                                <div className="absolute inset-0 border border-black/20 rounded-sm"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="mt-2 flex justify-between text-[9px] text-gray-500 uppercase tracking-widest px-1 font-mono">
                <span>FRONT</span>
                <span>REAR</span>
            </div>
        </div>
    );
}
