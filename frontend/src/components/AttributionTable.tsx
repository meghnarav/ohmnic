import React from "react";
import { ShapDriver } from "@/app/page";
import { Cpu, CheckCircle, Info } from "lucide-react";

export default function AttributionTable({ shap, anomalyScore }: { shap: ShapDriver[], anomalyScore: number }) {
    const isNominal = !shap || shap.length === 0;
    
    return (
        <div className="h-full flex flex-col bg-[#FFFFFF] text-[#0F131A]">
            {/* Titlebar Rack Strip */}
            <div className="bg-[#DFE3DC] px-3 py-1.5 border-b-2 border-[#1E2229] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-[#1E2229] bg-white px-1.5 py-0.5 border border-[#1E2229]">
                        [MOD-03]
                    </span>
                    <h2 className="text-xs font-mono font-black tracking-widest text-[#1E2229] uppercase">
                        TREESHAP ANOMALY DRIVERS
                    </h2>
                </div>

                <div className="group relative">
                    <button 
                        title="TreeSHAP Attribution Details"
                        className="neo-btn p-1 text-[#1E2229] hover:bg-[#ECEEEA]"
                    >
                        <Info className="w-3 h-3" />
                    </button>
                    <div className="absolute right-0 top-7 w-64 p-3 bg-[#FFFFFF] border-2 border-[#1E2229] shadow-[4px_4px_0px_#1E2229] text-[10px] font-mono text-[#4B5565] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <strong className="block mb-1 text-[#0F131A] uppercase font-black">Polynomial Complexity O(T·L·D²):</strong>
                        TreeSHAP isolates the exact marginal contribution (+ or -) of each feature toward the isolation forest path length penalty.
                    </div>
                </div>
            </div>

            {/* Drivers List */}
            <div className="p-3.5 flex-1 flex flex-col justify-between bg-[#FFFFFF]">
                <div className="overflow-y-auto pr-1 space-y-2">
                    {isNominal ? (
                        <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-[#1E2229] bg-[#ECEEEA]">
                            <CheckCircle className="w-7 h-7 text-[#059669] mb-1.5" strokeWidth={2.5} />
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F131A]">
                                NOMINAL_INLIER_STATE
                            </span>
                            <span className="text-[9px] font-mono text-[#4B5565] mt-1 font-semibold">
                                Anomaly score: &lt; 0.650 // XAI Compute Bypassed
                            </span>
                        </div>
                    ) : (
                        shap.map((driver, idx) => {
                            const maxImpact = Math.max(...shap.map(s => Math.abs(s.impact)), 0.001);
                            const widthPercent = Math.min(100, Math.max(8, (Math.abs(driver.impact) / maxImpact) * 100));
                            const isPositive = driver.impact > 0;
                            const barColor = isPositive ? "#DC2626" : "#2563EB";
                            
                            return (
                                <div key={idx} className="flex flex-col space-y-1 bg-[#ECEEEA] p-2 border-2 border-[#1E2229] shadow-[1px_1px_0px_#1E2229]">
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                        <span className="font-bold text-[#0F131A] uppercase tracking-wider">{driver.feature}</span>
                                        <span className="text-[#0F131A] bg-white px-1.5 py-0.5 border border-[#1E2229] font-bold">
                                            OBS: {driver.observed}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {/* Recessed Mechanical Track */}
                                        <div className="flex-1 bg-white border-2 border-[#1E2229] h-4 p-[2px] flex items-center overflow-hidden">
                                            <div 
                                                className="h-full transition-all duration-200"
                                                style={{ 
                                                    width: `${widthPercent}%`, 
                                                    backgroundColor: barColor
                                                }}
                                            />
                                        </div>
                                        <span 
                                            style={{ color: barColor }}
                                            className="font-mono font-black text-xs min-w-[55px] text-right"
                                        >
                                            {isPositive ? "+" : ""}{driver.impact.toFixed(3)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Bottom Status */}
                <div className="mt-3 pt-2 border-t border-[#1E2229]/20 flex justify-between items-center text-[9px] font-mono text-[#4B5565]">
                    <span>ANOMALY PROBABILITY: <strong className="font-mono font-black text-[#0F131A]">{(anomalyScore * 100).toFixed(1)}%</strong></span>
                    <div className="flex items-center space-x-3 font-bold">
                        <span className="flex items-center text-[#DC2626]"><div className="w-2.5 h-2.5 bg-[#DC2626] mr-1 border border-[#1E2229]"></div> Risk Driver</span>
                        <span className="flex items-center text-[#2563EB]"><div className="w-2.5 h-2.5 bg-[#2563EB] mr-1 border border-[#1E2229]"></div> Stabilizing</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
