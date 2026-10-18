import React, { useState } from "react";
import { VehicleRecord } from "@/app/page";
import { Grid, Maximize2, Zap, X } from "lucide-react";

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

    const hotCellIndex = vehicle.status !== "NOMINAL" ? 14 : -1;

    const getCellData = (idx: number) => {
        const isHot = idx === hotCellIndex;
        const isWarm = !isHot && vehicle.status !== "NOMINAL" && Math.abs(idx - hotCellIndex) <= 2;
        
        let temp = vehicle.maxTemp - 1.2 + (Math.sin(idx * 1.5) * 0.7);
        if (isHot) temp = vehicle.maxTemp;
        else if (isWarm) temp = vehicle.maxTemp - 0.5;

        let statusText = "NOMINAL";
        let cellColor = "#059669"; // Signal Green
        let isPulsing = false;
        
        if (isHot && vehicle.status === "FAULT") {
            statusText = "CRITICAL HOTSPOT";
            cellColor = "#DC2626"; // Critical Red
            isPulsing = true;
        } else if (isHot && vehicle.status === "WARN") {
            statusText = "ELEVATED TEMP";
            cellColor = "#D97706"; // Warning Amber
        } else if (isWarm && vehicle.status === "FAULT") {
            statusText = "THERMAL GRADIENT";
            cellColor = "#DC2626";
        } else if (isWarm && vehicle.status === "WARN") {
            statusText = "THERMAL GRADIENT";
            cellColor = "#D97706";
        }

        return { 
            temp: temp.toFixed(1), 
            statusText, 
            cellColor, 
            isPulsing,
            cellId: `C-${(idx + 1).toString().padStart(2, "0")}` 
        };
    };

    const activeCellInfo = selectedCell !== null ? getCellData(selectedCell) : null;

    return (
        <div className="h-full flex flex-col bg-[#FFFFFF] text-[#0F131A]">
            {/* Titlebar Rack Strip */}
            <div className="bg-[#DFE3DC] px-3 py-1.5 border-b-2 border-[#1E2229] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-[#1E2229] bg-white px-1.5 py-0.5 border border-[#1E2229]">
                        [MOD-01B]
                    </span>
                    <h2 className="text-xs font-mono font-black tracking-widest text-[#1E2229] uppercase">
                        PACK THERMAL MATRIX (96-CELL)
                    </h2>
                </div>

                <div className="flex items-center space-x-2">
                    {onSwitchToGauges && (
                        <button
                            onClick={onSwitchToGauges}
                            className="neo-btn text-[9px] font-mono font-bold px-2 py-0.5 text-[#1E2229] hover:bg-[#DFE3DC] flex items-center uppercase tracking-wider"
                            title="Switch to Gauges"
                        >
                            <Zap className="w-3 h-3 mr-1 text-[#2563EB]" />
                            Gauges ←
                        </button>
                    )}
                    <button 
                        onClick={() => setIsExpanded(true)}
                        className="neo-btn p-1 text-[#1E2229] hover:bg-[#DFE3DC]"
                        title="Expand Fullscreen Matrix"
                    >
                        <Maximize2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
            
            {/* Mechanical Matrix Cavity */}
            <div className="flex-1 flex flex-col items-center justify-center p-3.5 bg-[#FFFFFF]">
                <div className="w-full max-w-[340px] p-3 border-2 border-[#1E2229] bg-[#ECEEEA] shadow-[2px_2px_0px_#1E2229]">
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
                                    className={`w-full pt-[100%] relative transition-all cursor-pointer border border-[#1E2229] rounded-none ${
                                        isPulsing ? "animate-pulse" : ""
                                    } ${
                                        isSelected 
                                            ? "scale-110 ring-2 ring-[#1E2229] z-10 shadow-[2px_2px_0px_#1E2229]" 
                                            : "hover:scale-105"
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Selected Cell Floating Quick Inspector */}
                {activeCellInfo && (
                    <div className="mt-3 w-full max-w-[340px] bg-[#FFFFFF] border-2 border-[#1E2229] px-3 py-1.5 flex justify-between items-center text-[10px] font-mono shadow-[2px_2px_0px_#1E2229]">
                        <span className="bg-[#DFE3DC] text-[#1E2229] border border-[#1E2229] px-2 py-0.5 font-bold">
                            {activeCellInfo.cellId}
                        </span>
                        <span className="font-mono font-black text-[#0F131A] text-xs">{activeCellInfo.temp}°C</span>
                        <span 
                            style={{ color: activeCellInfo.cellColor, borderColor: activeCellInfo.cellColor }}
                            className="uppercase text-[9px] font-bold px-1.5 py-0.5 bg-[#ECEEEA] border"
                        >
                            {activeCellInfo.statusText}
                        </span>
                        <button 
                            onClick={() => setSelectedCell(null)} 
                            className="text-[#4B5565] hover:text-[#0F131A] font-mono text-xs ml-1 font-bold"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
            
            {/* Orientations & Legend */}
            <div className="px-3.5 pb-2.5 flex justify-between items-center text-[9px] font-mono text-[#4B5565] uppercase">
                <span className="bg-[#ECEEEA] border border-[#1E2229] px-1.5 py-0.5 text-[#1E2229] font-bold">▲ FRONT_BAY</span>
                <div className="flex items-center space-x-3 text-[9px] font-bold">
                    <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#059669] mr-1 border border-[#1E2229]"></div> Nominal</span>
                    <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#D97706] mr-1 border border-[#1E2229]"></div> Warning</span>
                    <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#DC2626] mr-1 border border-[#1E2229]"></div> Hotspot</span>
                </div>
                <span className="bg-[#ECEEEA] border border-[#1E2229] px-1.5 py-0.5 text-[#1E2229] font-bold">▼ REAR_BAY</span>
            </div>

            {/* Modal Dialog for Expanded Thermal Matrix */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="neo-card-heavy bg-[#FFFFFF] p-5 max-w-xl w-full border-2 border-[#1E2229] shadow-[8px_8px_0_0_#1E2229]">
                        <div className="flex justify-between items-center border-b-2 border-[#1E2229] pb-2.5 mb-4 bg-[#DFE3DC] -m-5 mb-4 p-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono font-bold text-[#1E2229] bg-white px-1.5 py-0.5 border border-[#1E2229]">
                                    [MOD-01B]
                                </span>
                                <h3 className="text-xs font-mono font-black text-[#1E2229] uppercase tracking-widest">
                                    HIGH-RESOLUTION PACK THERMAL MATRIX
                                </h3>
                            </div>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="neo-btn p-1 text-[#1E2229] hover:bg-[#ECEEEA]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3 border-2 border-[#1E2229] bg-[#ECEEEA] shadow-[2px_2px_0px_#1E2229] mb-4">
                            <div className="grid grid-cols-8 gap-2">
                                {Array.from({ length: totalCells }).map((_, idx) => {
                                    const { cellColor, temp, cellId } = getCellData(idx);
                                    return (
                                        <div 
                                            key={idx}
                                            style={{ borderColor: cellColor }}
                                            className="border-2 p-1.5 flex flex-col items-center justify-center bg-white transition-all hover:scale-105"
                                        >
                                            <span className="text-[8px] font-mono font-bold text-[#4B5565]">{cellId}</span>
                                            <span className="text-[10px] font-mono font-black text-[#0F131A]">{temp}°C</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xs font-mono">
                            <div className="flex items-center space-x-4 text-[9px] text-[#4B5565] font-bold">
                                <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#059669] mr-1.5 border border-[#1E2229]"></div> &lt; 35°C (Nominal)</span>
                                <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#D97706] mr-1.5 border border-[#1E2229]"></div> 35-50°C (Warning)</span>
                                <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#DC2626] mr-1.5 border border-[#1E2229]"></div> &gt; 50°C (Hotspot)</span>
                            </div>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="neo-btn px-4 py-1.5 bg-[#FFFFFF] text-[#1E2229] hover:bg-[#DFE3DC] font-mono font-bold uppercase text-xs"
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
