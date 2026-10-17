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

    // Simulated cell temp variance based on vehicle maxTemp and status
    const hotCellIndex = vehicle.status !== 'NOMINAL' ? 14 : -1;

    const getCellData = (idx: number) => {
        const isHot = idx === hotCellIndex;
        const isWarm = !isHot && vehicle.status !== 'NOMINAL' && Math.abs(idx - hotCellIndex) <= 2;
        
        let temp = vehicle.maxTemp - 1.2 + (Math.sin(idx * 1.5) * 0.7);
        if (isHot) temp = vehicle.maxTemp;
        else if (isWarm) temp = vehicle.maxTemp - 0.5;

        let statusText = 'NOMINAL';
        let cellColor = '#10B981'; // Emerald
        let isPulsing = false;
        
        if (isHot && vehicle.status === 'FAULT') {
            statusText = 'CRITICAL HOTSPOT';
            cellColor = '#EF4444'; // Crimson
            isPulsing = true;
        } else if (isHot && vehicle.status === 'WARN') {
            statusText = 'ELEVATED TEMP';
            cellColor = '#F59E0B'; // Amber
        } else if (isWarm && vehicle.status === 'FAULT') {
            statusText = 'THERMAL GRADIENT';
            cellColor = '#F43F5E';
        } else if (isWarm && vehicle.status === 'WARN') {
            statusText = 'THERMAL GRADIENT';
            cellColor = '#F59E0B';
        }

        return { 
            temp: temp.toFixed(1), 
            statusText, 
            cellColor, 
            isPulsing,
            cellId: `C-${(idx + 1).toString().padStart(2, '0')}` 
        };
    };

    const activeCellInfo = selectedCell !== null ? getCellData(selectedCell) : null;

    return (
        <div className="h-full flex flex-col bg-[#161922] p-4 text-[#F3F4F6]">
            {/* Header */}
            <div className="flex justify-between items-center mb-3 border-b border-[#2A2E3D] pb-3">
                <div className="flex items-center space-x-2.5">
                    <Grid className="w-4 h-4 text-[#06B6D4]" />
                    <span className="text-sm font-heading tracking-wider uppercase text-[#F3F4F6]">
                        32-CELL THERMAL MATRIX
                    </span>
                    <span className="text-[9px] font-mono bg-[#0D0F14] text-[#10B981] border border-[#2A2E3D] px-2 py-0.5 font-bold">
                        4S8P_TOPOLOGY
                    </span>
                </div>
                
                <div className="flex items-center space-x-2">
                    {onSwitchToGauges && (
                        <button
                            onClick={onSwitchToGauges}
                            className="neo-btn text-[10px] font-mono px-2.5 py-1 text-[#F3F4F6] hover:text-[#06B6D4] flex items-center uppercase tracking-wider"
                            title="Switch to Gauges View"
                        >
                            <Zap className="w-3 h-3 mr-1 text-[#06B6D4]" /> Gauges
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="neo-btn text-[10px] p-1.5 text-[#F3F4F6] hover:text-[#06B6D4] flex items-center"
                        title="Expand Fullscreen Matrix"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            
            {/* Dark Well: Matrix Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 border border-[#2A2E3D] bg-[#0D0F14] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                <div className="grid grid-cols-8 gap-2 w-full max-w-[340px]">
                    {Array.from({ length: totalCells }).map((_, idx) => {
                        const { cellColor, isPulsing, cellId } = getCellData(idx);
                        const isSelected = selectedCell === idx;

                        return (
                            <button 
                                key={idx} 
                                onClick={() => setSelectedCell(selectedCell === idx ? null : idx)}
                                title={`${cellId}: click to probe`}
                                style={{ backgroundColor: cellColor }}
                                className={`w-full pt-[100%] relative transition-all cursor-pointer border border-[#000000]/60 ${
                                    isPulsing ? 'animate-pulse' : ''
                                } ${
                                    isSelected 
                                        ? 'scale-110 ring-2 ring-[#06B6D4] z-10 shadow-[0_0_12px_rgba(6,182,212,0.8)]' 
                                        : 'hover:scale-105 hover:brightness-125'
                                }`}
                            />
                        );
                    })}
                </div>

                {/* Selected Cell Floating Quick Inspector */}
                {activeCellInfo && (
                    <div className="mt-3.5 w-full bg-[#161922] border border-[#2A2E3D] px-3 py-1.5 flex justify-between items-center text-[10px] font-mono shadow-[2px_2px_0px_#000]">
                        <span className="bg-[#0D0F14] text-[#06B6D4] border border-[#2A2E3D] px-2 py-0.5 font-bold">
                            {activeCellInfo.cellId}
                        </span>
                        <span className="font-bold text-[#F3F4F6]">{activeCellInfo.temp}°C</span>
                        <span 
                            style={{ color: activeCellInfo.cellColor }}
                            className="uppercase text-[9px] font-bold px-1.5 py-0.5 bg-[#0D0F14] border border-[#2A2E3D]"
                        >
                            {activeCellInfo.statusText}
                        </span>
                        <button 
                            onClick={() => setSelectedCell(null)} 
                            className="text-[#9CA3AF] hover:text-[#F3F4F6] font-mono text-xs ml-1"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
            
            {/* Orientations & Legend */}
            <div className="mt-3 flex justify-between items-center text-[10px] font-mono text-[#9CA3AF] uppercase">
                <span className="bg-[#0D0F14] border border-[#2A2E3D] px-2 py-0.5 text-[#64748B]">▲ FRONT_BUS</span>
                <div className="flex items-center space-x-3 text-[9px]">
                    <span className="flex items-center"><div className="w-2 h-2 bg-[#10B981] mr-1"></div> Nominal</span>
                    <span className="flex items-center"><div className="w-2 h-2 bg-[#F59E0B] mr-1"></div> Elevated</span>
                    <span className="flex items-center"><div className="w-2 h-2 bg-[#EF4444] mr-1"></div> Hotspot</span>
                </div>
                <span className="bg-[#0D0F14] border border-[#2A2E3D] px-2 py-0.5 text-[#64748B]">▼ REAR_BUS</span>
            </div>

            {/* Modal Dialog for Expanded Thermal Matrix */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="neo-card-heavy bg-[#161922] p-6 max-w-xl w-full border border-[#2A2E3D] shadow-[6px_6px_0_0_#000]">
                        <div className="flex justify-between items-center border-b border-[#2A2E3D] pb-3 mb-4">
                            <div className="flex items-center space-x-2.5">
                                <Grid className="w-5 h-5 text-[#06B6D4]" />
                                <h3 className="text-xl font-heading text-[#F3F4F6] uppercase tracking-wider">
                                    HIGH-RESOLUTION PACK THERMAL MATRIX
                                </h3>
                            </div>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="neo-btn p-1.5 text-[#F3F4F6] hover:text-[#EF4444]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 border border-[#2A2E3D] bg-[#0D0F14] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] mb-4">
                            <div className="grid grid-cols-8 gap-2">
                                {Array.from({ length: totalCells }).map((_, idx) => {
                                    const { cellColor, temp, cellId } = getCellData(idx);
                                    return (
                                        <div 
                                            key={idx}
                                            style={{ backgroundColor: `${cellColor}22`, borderColor: cellColor }}
                                            className="border p-2 flex flex-col items-center justify-center transition-all hover:scale-105"
                                        >
                                            <span className="text-[9px] font-mono text-[#9CA3AF]">{cellId}</span>
                                            <span className="text-[11px] font-mono font-bold text-[#F3F4F6]">{temp}°C</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xs font-mono">
                            <div className="flex items-center space-x-4 text-[10px] text-[#9CA3AF]">
                                <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#10B981] mr-1.5"></div> &lt; 35°C (Nominal)</span>
                                <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#F59E0B] mr-1.5"></div> 35-50°C (Warning)</span>
                                <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#EF4444] mr-1.5"></div> &gt; 50°C (Hotspot)</span>
                            </div>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="neo-btn px-4 py-1.5 bg-[#1C202B] text-[#F3F4F6] hover:border-[#06B6D4] font-mono uppercase text-xs"
                            >
                                Close Matrix
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
