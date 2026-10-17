import React from 'react';
import { ShapDriver } from '@/app/page';
import { Cpu, CheckCircle, Info } from 'lucide-react';

export default function AttributionTable({ shap, anomalyScore }: { shap: ShapDriver[], anomalyScore: number }) {
    const isNominal = !shap || shap.length === 0;
    
    return (
        <div className="h-full p-4 flex flex-col bg-[#161922] text-[#F3F4F6]">
            {/* Header */}
            <div className="flex justify-between items-start mb-3 border-b border-[#2A2E3D] pb-3">
                <div className="flex items-center space-x-2.5">
                    <Cpu className="w-4 h-4 text-[#06B6D4]" />
                    <div>
                        <h2 className="text-sm font-heading uppercase text-[#F3F4F6] tracking-wider">
                            TREESHAP ANOMALY DRIVERS
                        </h2>
                        <p className="text-[9px] font-mono text-[#64748B] uppercase">Feature Risk Attribution Vectors</p>
                    </div>
                </div>

                <div className="group relative">
                    <button 
                        title="TreeSHAP Explanation"
                        className="p-1 hover:bg-[#1C202B] border border-[#2A2E3D] text-[#9CA3AF] hover:text-[#06B6D4]"
                    >
                        <Info className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute right-0 top-7 w-64 p-3 bg-[#0D0F14] border border-[#2A2E3D] shadow-[4px_4px_0px_#000000] text-[10px] font-mono text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <strong className="block mb-1 text-[#06B6D4] font-mono uppercase">Mathematical Attribution:</strong>
                        TreeSHAP isolates the marginal contribution (+ or -) of each battery parameter toward the anomaly fault classification score.
                    </div>
                </div>
            </div>

            {/* Drivers List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
                {isNominal ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-[#2A2E3D] bg-[#0D0F14]">
                        <CheckCircle className="w-8 h-8 text-[#10B981] mb-2" strokeWidth={2} />
                        <span className="text-xs font-heading uppercase tracking-wider text-[#F3F4F6]">
                            ASSET OPERATING NOMINALLY
                        </span>
                        <span className="text-[10px] font-mono text-[#64748B] mt-1">
                            Residual anomaly threshold: &lt; 0.150 // XAI bypass
                        </span>
                    </div>
                ) : (
                    shap.map((driver, idx) => {
                        const maxImpact = Math.max(...shap.map(s => Math.abs(s.impact)), 0.001);
                        const widthPercent = Math.min(100, Math.max(8, (Math.abs(driver.impact) / maxImpact) * 100));
                        const isPositive = driver.impact > 0;
                        const barColor = isPositive ? '#EF4444' : '#06B6D4';
                        
                        return (
                            <div key={idx} className="flex flex-col space-y-1 bg-[#0D0F14] p-2 border border-[#2A2E3D]">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                    <span className="font-bold text-[#F3F4F6] uppercase">{driver.feature}</span>
                                    <span className="text-[#06B6D4] bg-[#161922] px-1.5 py-0.5 border border-[#2A2E3D]">
                                        OBS: {driver.observed}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 h-2.5 bg-[#161922] border border-[#2A2E3D] overflow-hidden relative">
                                        <div 
                                            className="h-full transition-all duration-300"
                                            style={{ 
                                                width: `${widthPercent}%`, 
                                                backgroundColor: barColor,
                                                boxShadow: `0 0 8px ${barColor}66`
                                            }}
                                        />
                                    </div>
                                    <span 
                                        style={{ color: barColor }}
                                        className="text-[10px] font-mono font-bold min-w-[55px] text-right"
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
            <div className="mt-3 pt-2 border-t border-[#2A2E3D] flex justify-between items-center text-[9px] font-mono text-[#64748B]">
                <span>ANOMALY SCORE: <strong className="text-[#F3F4F6]">{(anomalyScore * 100).toFixed(1)}%</strong></span>
                <span className="flex items-center space-x-2">
                    <span className="flex items-center"><div className="w-2 h-2 bg-[#EF4444] mr-1"></div> Fault Contributor</span>
                    <span className="flex items-center"><div className="w-2 h-2 bg-[#06B6D4] mr-1"></div> Stabilizing</span>
                </span>
            </div>
        </div>
    );
}
