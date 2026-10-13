import React, { useState } from 'react';
import { VehicleRecord } from '@/app/page';
import { Grid, Maximize2, Zap, X } from 'lucide-react';

interface PackHeatmapProps {
    vehicle: VehicleRecord;
    onSwitchToGauges?: () => void;
}

export default function PackHeatmap({ vehicle, onSwitchToGauges }: PackHeatmapProps) {
    const rows = 4;
    const cols = 8;
    const totalCells = rows * cols;
    const [selectedCell, setSelectedCell] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    // Calculate simulated cell temp variance based on vehicle maxTemp and status
    const hotCellIndex = vehicle.status !== 'NOMINAL' ? 14 : -1;

    const getCellData = (idx: number) => {
        const isHot = idx === hotCellIndex;
        const isWarm = !isHot && vehicle.status !== 'NOMINAL' && Math.abs(idx - hotCellIndex) <= 2;
        
        let temp = vehicle.maxTemp - 1.5 + (Math.sin(idx) * 0.8);
        if (isHot) temp = vehicle.maxTemp;
        else if (isWarm) temp = vehicle.maxTemp - 0.7;

        let statusText = 'NOMINAL';
        let bgColor = 'bg-[var(--color-accent-emerald)]';
        
        if (isHot && vehicle.status === 'FAULT') {
            statusText = 'CRITICAL HOTSPOT';
            bgColor = 'bg-[var(--color-accent-pink)] animate-pulse';
        } else if (isHot && vehicle.status === 'WARN') {
            statusText = 'ELEVATED TEMP';
            bgColor = 'bg-[var(--color-accent-amber)]';
        } else if (isWarm && vehicle.status === 'FAULT') {
            statusText = 'THERMAL GRADIENT';
            bgColor = 'bg-[var(--color-accent-pink)]/70';
        } else if (isWarm && vehicle.status === 'WARN') {
            statusText = 'THERMAL GRADIENT';
            bgColor = 'bg-[var(--color-accent-amber)]/70';
        }

        return { temp: temp.toFixed(1), statusText, bgColor, cellId: `C-${(idx + 1).toString().padStart(2, '0')}` };
    };

    const activeCellInfo = selectedCell !== null ? getCellData(selectedCell) : null;

    return (
        <div className="h-full flex flex-col bg-[var(--color-accent-amber)] p-4">
            <div className="flex justify-between items-center mb-3 border-b-4 border-black pb-2">
                <div className="flex items-center space-x-2">
                    <Grid className="w-5 h-5 text-black" strokeWidth={3} />
                    <span className="text-xl font-heading text-black">THERMAL MAP</span>
                    <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 font-bold">
                        32 CELLS
                    </span>
                </div>
                
                <div className="flex items-center space-x-2">
                    {onSwitchToGauges && (
                        <button
                            onClick={onSwitchToGauges}
                            className="neo-btn text-[10px] font-heading px-2 py-1 bg-white hover:bg-gray-100 text-black flex items-center uppercase"
                            title="Switch to Gauges View"
                        >
                            <Zap className="w-3 h-3 mr-1" /> Gauges
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="neo-btn text-[10px] font-heading p-1.5 bg-white hover:bg-gray-100 text-black flex items-center"
                        title="Expand Fullscreen"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-3 border-4 border-black bg-white shadow-[6px_6px_0_0_#111]">
                <div className="grid grid-cols-8 gap-1.5 w-full max-w-[280px]">
                    {Array.from({ length: totalCells }).map((_, idx) => {
                        const { bgColor, cellId } = getCellData(idx);
                        const isSelected = selectedCell === idx;

                        return (
                            <button 
                                key={idx} 
                                onClick={() => setSelectedCell(selectedCell === idx ? null : idx)}
                                title={`${cellId}: click to inspect`}
                                className={`w-full pt-[100%] border-2 border-black relative transition-transform cursor-pointer ${bgColor} ${isSelected ? 'scale-110 ring-4 ring-black z-10 shadow-[2px_2px_0_0_#000]' : 'hover:scale-105'}`}
                            />
                        );
                    })}
                </div>

                {/* Selected Cell Floating Quick Inspector */}
                {activeCellInfo && (
                    <div className="mt-3 w-full bg-[var(--color-canvas)] border-2 border-black p-2 flex justify-between items-center text-[10px] font-mono font-bold text-black">
                        <span className="bg-black text-white px-1.5 py-0.5">{activeCellInfo.cellId}</span>
                        <span>{activeCellInfo.temp}°C</span>
                        <span className="uppercase text-[9px] px-1 bg-white border border-black">{activeCellInfo.statusText}</span>
                        <button onClick={() => setSelectedCell(null)} className="text-gray-500 hover:text-black font-black">✕</button>
                    </div>
                )}
            </div>
            
            <div className="mt-3 flex justify-between items-center text-[10px] font-mono font-bold text-black uppercase">
                <span className="bg-white border-2 border-black px-1.5 py-0.5 shadow-[2px_2px_0_0_#111]">▲ FRONT</span>
                <span className="text-[9px] text-black/70 font-mono">CLICK CELL TO PROBE</span>
                <span className="bg-white border-2 border-black px-1.5 py-0.5 shadow-[2px_2px_0_0_#111]">▼ REAR</span>
            </div>

            {/* Modal Dialog for Expanded Thermal Matrix */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="neo-card bg-[var(--color-canvas)] p-6 max-w-xl w-full border-4 border-black shadow-[8px_8px_0_0_#000]">
                        <div className="flex justify-between items-center border-b-4 border-black pb-3 mb-4">
                            <div className="flex items-center space-x-3">
                                <Grid className="w-6 h-6 text-black" strokeWidth={3} />
                                <h3 className="text-2xl font-heading text-black">EXPANDED PACK MATRIX</h3>
                            </div>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="neo-btn p-2 bg-[var(--color-accent-pink)] text-white font-black"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 border-4 border-black bg-white shadow-[4px_4px_0_0_#111] mb-4">
                            <div className="grid grid-cols-8 gap-2">
                                {Array.from({ length: totalCells }).map((_, idx) => {
                                    const { bgColor, temp, cellId } = getCellData(idx);
                                    return (
                                        <div 
                                            key={idx}
                                            className={`border-2 border-black p-2 flex flex-col items-center justify-center ${bgColor}`}
                                        >
                                            <span className="text-[9px] font-mono font-black text-black">{cellId}</span>
                                            <span className="text-[10px] font-heading text-black">{temp}°C</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xs font-mono font-bold">
                            <div className="flex items-center space-x-3">
                                <span className="flex items-center"><div className="w-3 h-3 bg-[var(--color-accent-emerald)] border border-black mr-1"></div> Nominal</span>
                                <span className="flex items-center"><div className="w-3 h-3 bg-[var(--color-accent-amber)] border border-black mr-1"></div> Elevated</span>
                                <span className="flex items-center"><div className="w-3 h-3 bg-[var(--color-accent-pink)] border border-black mr-1"></div> Hotspot</span>
                            </div>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="neo-btn px-4 py-2 bg-black text-white font-heading uppercase text-xs"
                            >
                                Close Inspector
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
