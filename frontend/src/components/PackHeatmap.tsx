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

    const hotCellIndex = vehicle.status !== 'NOMINAL' ? 14 : -1;

    const getCellData = (idx: number) => {
        const isHot = idx === hotCellIndex;
        const isWarm = !isHot && vehicle.status !== 'NOMINAL' && Math.abs(idx - hotCellIndex) <= 2;
        
        let temp = vehicle.maxTemp - 1.2 + (Math.sin(idx * 1.5) * 0.7);
        if (isHot) temp = vehicle.maxTemp;
        else if (isWarm) temp = vehicle.maxTemp - 0.5;

        let statusText = 'NOMINAL';
        let cellColor = '#10B981'; // Signal Green
        let isPulsing = false;
        
        if (isHot && vehicle.status === 'FAULT') {
            statusText = 'CRITICAL HOTSPOT';
            cellColor = '#EF4444'; // Emergency Crimson
            isPulsing = true;
        } else if (isHot && vehicle.status === 'WARN') {
            statusText = 'ELEVATED TEMP';
            cellColor = '#FFD000'; // Hazard Amber
        } else if (isWarm && vehicle.status === 'FAULT') {
            statusText = 'THERMAL GRADIENT';
            cellColor = '#EF4444';
        } else if (isWarm && vehicle.status === 'WARN') {
            statusText = 'THERMAL GRADIENT';
            cellColor = '#FFD000';
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
        <div className="h-full flex flex-col bg-[#12151D] text-white">
            {/* Titlebar */}
            <div className="bg-[#181C26] px-3 py-1.5 border-b-2 border-[#242938] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-[#0A0C10] border border-[#242938] text-[#FFD000]">
                        [MOD-01B // THERMAL_MATRIX]
                    </span>
                    <span className="text-xs font-heading font-black tracking-wider uppercase text-white">
                        32-CELL THERMAL MATRIX
                    </span>
                </div>
                
                <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-mono bg-[#0A0C10] text-[#10B981] border border-[#242938] px-2 py-0.5 font-bold">
                        4S8P_SKATEBOARD
                    </span>
                    {onSwitchToGauges && (
                        <button
                            onClick={onSwitchToGauges}
                            className="neo-btn text-[9px] font-mono font-bold px-2 py-0.5 text-white hover:text-[#00F0FF] flex items-center uppercase tracking-wider"
                            title="Switch to Gauges View"
                        >
                            <Zap className="w-3 h-3 mr-1 text-[#00F0FF]" /> Gauges
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="neo-btn text-[9px] p-1 text-white hover:text-[#00F0FF] flex items-center"
                        title="Expand Fullscreen Matrix"
                    >
                        <Maximize2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
            
            {/* Dark Well: Matrix Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-3.5 bg-[#12151D]">
                <div className="w-full max-w-[340px] p-3 border-2 border-[#242938] bg-[#0A0C10] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]">
                    <div className="grid grid-cols-8 gap-2 w-full">
                        {Array.from({ length: totalCells }).map((_, idx) => {
                            const { cellColor, isPulsing, cellId } = getCellData(idx);
                            const isSelected = selectedCell === idx;

                            return (
                                <button 
                                    key={idx} 
                                    onClick={() => setSelectedCell(selectedCell === idx ? null : idx)}
                                    title={`${cellId}: click to probe`}
                                    style={{ backgroundColor: cellColor }}
                                    className={`w-full pt-[100%] relative transition-all cursor-pointer border border-[#000000] rounded-none ${
                                        isPulsing ? 'animate-pulse' : ''
                                    } ${
                                        isSelected 
                                            ? 'scale-110 ring-2 ring-[#00F0FF] z-10 shadow-[0_0_12px_#00F0FF]' 
                                            : 'hover:scale-105 hover:brightness-125'
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Selected Cell Floating Quick Inspector */}
                {activeCellInfo && (
                    <div className="mt-3 w-full max-w-[340px] bg-[#0A0C10] border-2 border-[#242938] px-3 py-1.5 flex justify-between items-center text-[10px] font-mono shadow-[2px_2px_0px_#000]">
                        <span className="bg-[#181C26] text-[#00F0FF] border border-[#242938] px-2 py-0.5 font-bold">
                            {activeCellInfo.cellId}
                        </span>
                        <span className="font-mono font-black text-white text-xs">{activeCellInfo.temp}°C</span>
                        <span 
                            style={{ color: activeCellInfo.cellColor, borderColor: activeCellInfo.cellColor }}
                            className="uppercase text-[9px] font-bold px-1.5 py-0.5 bg-[#12151D] border"
                        >
                            {activeCellInfo.statusText}
                        </span>
                        <button 
                            onClick={() => setSelectedCell(null)} 
                            className="text-[#94A3B8] hover:text-white font-mono text-xs ml-1"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
            
            {/* Orientations & Legend */}
            <div className="px-3.5 pb-2.5 flex justify-between items-center text-[9px] font-mono text-[#94A3B8] uppercase">
                <span className="bg-[#0A0C10] border border-[#242938] px-1.5 py-0.5 text-[#64748B]">▲ FRONT_BAY</span>
                <div className="flex items-center space-x-3 text-[9px]">
                    <span className="flex items-center"><div className="w-2 h-2 bg-[#10B981] mr-1"></div> Nominal</span>
                    <span className="flex items-center"><div className="w-2 h-2 bg-[#FFD000] mr-1"></div> Warning</span>
                    <span className="flex items-center"><div className="w-2 h-2 bg-[#EF4444] mr-1"></div> Hotspot</span>
                </div>
                <span className="bg-[#0A0C10] border border-[#242938] px-1.5 py-0.5 text-[#64748B]">▼ REAR_BAY</span>
            </div>

            {/* Modal Dialog for Expanded Thermal Matrix */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="neo-card-heavy bg-[#12151D] p-5 max-w-xl w-full border-2 border-[#242938] shadow-[8px_8px_0_0_#000000]">
                        <div className="flex justify-between items-center border-b-2 border-[#242938] pb-2.5 mb-4 bg-[#181C26] -m-5 mb-4 p-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-[#0A0C10] border border-[#242938] text-[#00F0FF]">
                                    [MOD-01B // FULL_MATRIX]
                                </span>
                                <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                                    HIGH-RESOLUTION PACK THERMAL MATRIX
                                </h3>
                            </div>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="neo-btn p-1 text-white hover:text-[#EF4444]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 border-2 border-[#242938] bg-[#0A0C10] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] mb-4">
                            <div className="grid grid-cols-8 gap-2">
                                {Array.from({ length: totalCells }).map((_, idx) => {
                                    const { cellColor, temp, cellId } = getCellData(idx);
                                    return (
                                        <div 
                                            key={idx}
                                            style={{ backgroundColor: `${cellColor}22`, borderColor: cellColor }}
                                            className="border-2 p-1.5 flex flex-col items-center justify-center transition-all hover:scale-105"
                                        >
                                            <span className="text-[8px] font-mono font-bold text-[#94A3B8]">{cellId}</span>
                                            <span className="text-[10px] font-mono font-black text-white">{temp}°C</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xs font-mono">
                            <div className="flex items-center space-x-4 text-[9px] text-[#94A3B8]">
                                <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#10B981] mr-1.5"></div> &lt; 35°C (Nominal)</span>
                                <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#FFD000] mr-1.5"></div> 35-50°C (Warning)</span>
                                <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#EF4444] mr-1.5"></div> &gt; 50°C (Hotspot)</span>
                            </div>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="neo-btn px-4 py-1.5 bg-[#181C26] text-white hover:border-[#00F0FF] font-mono font-bold uppercase text-xs"
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
