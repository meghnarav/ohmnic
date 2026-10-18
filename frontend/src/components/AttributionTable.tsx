import React from 'react';
import { ShapDriver } from '@/app/page';
import { Cpu, CheckCircle, Info } from 'lucide-react';

export default function AttributionTable({ shap, anomalyScore }: { shap: ShapDriver[], anomalyScore: number }) {
    const isNominal = !shap || shap.length === 0;
    
    return (
        <div className="h-full flex flex-col bg-[#12151D] text-white">
            {/* Titlebar */}
            <div className="bg-[#181C26] px-3 py-1.5 border-b-2 border-[#242938] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-[#0A0C10] border border-[#242938] text-[#00F0FF]">
                        [MOD-03 // SHAP_XAI]
                    </span>
                    <h2 className="text-xs font-heading font-black uppercase text-white tracking-wider">
                        TREESHAP ANOMALY DRIVERS
                    </h2>
                </div>

                <div className="group relative">
                    <button 
                        title="TreeSHAP Attribution Details"
                        className="neo-btn p-1 text-[#94A3B8] hover:text-[#00F0FF]"
                    >
                        <Info className="w-3 h-3" />
                    </button>
                    <div className="absolute right-0 top-7 w-64 p-3 bg-[#0A0C10] border-2 border-[#242938] shadow-[4px_4px_0px_#000000] text-[10px] font-mono text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <strong className="block mb-1 text-[#00F0FF] uppercase font-black">Polynomial Complexity O(T·L·D²):</strong>
                        TreeSHAP isolates the exact marginal contribution (+ or -) of each feature toward the isolation forest path length penalty.
                    </div>
                </div>
            </div>

            {/* Drivers List */}
            <div className="p-3.5 flex-1 flex flex-col justify-between bg-[#12151D]">
                <div className="overflow-y-auto pr-1 space-y-2">
                    {isNominal ? (
                        <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-[#242938] bg-[#0A0C10]">
                            <CheckCircle className="w-7 h-7 text-[#10B981] mb-1.5" strokeWidth={2} />
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                                NOMINAL_INLIER_STATE
                            </span>
                            <span className="text-[9px] font-mono text-[#64748B] mt-1">
                                Anomaly score: &lt; 0.650 // XAI Compute Bypassed
                            </span>
                        </div>
                    ) : (
                        shap.map((driver, idx) => {
                            const maxImpact = Math.max(...shap.map(s => Math.abs(s.impact)), 0.001);
                            const widthPercent = Math.min(100, Math.max(8, (Math.abs(driver.impact) / maxImpact) * 100));
                            const isPositive = driver.impact > 0;
                            const barColor = isPositive ? '#EF4444' : '#00F0FF';
                            
                            return (
                                <div key={idx} className="flex flex-col space-y-1 bg-[#0A0C10] p-2 border border-[#242938]">
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                        <span className="font-bold text-white uppercase">{driver.feature}</span>
                                        <span className="text-[#00F0FF] bg-[#12151D] px-1.5 py-0.5 border border-[#242938] font-bold">
                                            OBS: {driver.observed}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {/* Inset track */}
                                        <div className="flex-1 h-3.5 bg-[#0A0C10] border border-[#242938] relative overflow-hidden">
                                            <div 
                                                className="h-full transition-all duration-300"
                                                style={{ 
                                                    width: `${widthPercent}%`, 
                                                    backgroundColor: barColor,
                                                    boxShadow: `0 0 10px ${barColor}88`
                                                }}
                                            />
                                        </div>
                                        <span 
                                            style={{ color: barColor }}
                                            className="font-mono font-black text-xs min-w-[55px] text-right"
                                        >
                                            {isPositive ? '+' : ''}{driver.impact.toFixed(3)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Bottom Status */}
                <div className="mt-3 pt-2 border-t border-[#242938] flex justify-between items-center text-[9px] font-mono text-[#64748B]">
                    <span>ANOMALY PROBABILITY: <strong className="font-mono font-black text-white">{(anomalyScore * 100).toFixed(1)}%</strong></span>
                    <span className="flex items-center space-x-3">
                        <span className="flex items-center text-[#EF4444] font-bold"><div className="w-2 h-2 bg-[#EF4444] mr-1"></div> Risk Contributor</span>
                        <span className="flex items-center text-[#00F0FF] font-bold"><div className="w-2 h-2 bg-[#00F0FF] mr-1"></div> Stabilizing</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
