import React from 'react';
import { VehicleRecord } from '@/app/page';

export default function PackHeatmap({ vehicle }: { vehicle: VehicleRecord }) {
    if (!vehicle) return null;

    const blocks = Array.from({ length: 24 });
    const temp = vehicle.maxTemp;
    
    // Determine color intensity based on temperature
    const getBlockColor = (index: number) => {
        // Base color Logic:
        // Nominal (20-35C) -> Emerald / Cyan
        // Warning (35-45C) -> Amber
        // Critical (>45C) -> Red (#ff4876)
        
        // Add some visual noise based on index to make it look like distinct physical modules
        const noise = (index % 3) * 1.5 - 1.5; 
        const moduleTemp = temp + noise;

        if (moduleTemp > 45) return 'bg-[#ff4876] shadow-[0_0_8px_#ff4876]';
        if (moduleTemp > 35) return 'bg-[#F5A623]';
        if (moduleTemp > 20) return 'bg-emerald-500';
        return 'bg-[#06B6D4]'; // Too cold
    };

    return (
        <div className="bg-[#16181D] border border-[#242933] p-4 rounded h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Physical Pack Heatmap (24 Modules)</div>
                <div className="text-[10px] text-gray-400 border border-[#242933] px-2 py-0.5 rounded">ΔV: {vehicle.deltaV.toFixed(3)}V</div>
            </div>
            
            <div className="flex-1 grid grid-cols-6 grid-rows-4 gap-2 content-center">
                {blocks.map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-full h-8 rounded-sm opacity-80 transition-colors duration-500 ${getBlockColor(i)} border border-black/50`}
                    ></div>
                ))}
            </div>
            
            <div className="mt-4 flex justify-between text-[10px] text-gray-500">
                <span>COOL (&lt;20°C)</span>
                <span>NOMINAL (20-35°C)</span>
                <span>WARN (35-45°C)</span>
                <span className="text-[#ff4876]">CRITICAL (&gt;45°C)</span>
            </div>
        </div>
    );
}
