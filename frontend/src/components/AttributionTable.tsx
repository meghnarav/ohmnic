import React from 'react';
import { ShapDriver } from '@/app/page';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function AttributionTable({ shap, anomalyScore }: { shap: ShapDriver[], anomalyScore: number }) {
    const isNominal = !shap || shap.length === 0;
    
    return (
        <div className="h-full p-4 flex flex-col bg-white">
            <div className="flex justify-between items-start mb-4 border-b-4 border-black pb-2">
                <div>
                    <h2 className="text-xl font-heading text-black flex items-center">
                        {isNominal ? (
                            <div className="w-8 h-8 border-2 border-black bg-[var(--color-accent-emerald)] flex items-center justify-center shadow-[2px_2px_0_0_#111] mr-3">
                                <CheckCircle className="w-5 h-5 text-black" strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="w-8 h-8 border-2 border-black bg-[var(--color-accent-amber)] flex items-center justify-center shadow-[2px_2px_0_0_#111] mr-3">
                                <AlertCircle className="w-5 h-5 text-black" strokeWidth={3} />
                            </div>
                        )}
                        TREESHAP XAI
                    </h2>
                    <p className="text-[10px] font-mono font-bold text-gray-500 mt-1 uppercase">Feature Risk Vectors</p>
                </div>
                <div className="group relative">
                    <div className="w-6 h-6 border-2 border-black bg-white flex items-center justify-center cursor-help shadow-[2px_2px_0_0_#111]">
                        <Info className="w-4 h-4 text-black" strokeWidth={3} />
                    </div>
                    <div className="absolute right-0 top-8 w-64 p-3 bg-[var(--color-accent-amber)] border-4 border-black shadow-[4px_4px_0_0_#111] text-[10px] font-mono font-bold text-black opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <strong className="block mb-1 font-heading text-sm uppercase">What is this?</strong>
                        TreeSHAP isolates the exact mathematical impact (+ or -) each sensor value had on the final AI fault prediction. Positive impacts push the system toward FAULT status.
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {isNominal ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 border-4 border-dashed border-gray-300 p-4">
                        <div className="w-12 h-12 border-4 border-black bg-[var(--color-accent-emerald)] flex items-center justify-center shadow-[4px_4px_0_0_#111]">
                            <CheckCircle className="w-6 h-6 text-black" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-heading uppercase text-black">
                            Asset Operating Nominally
                        </span>
                        <span className="text-[10px] font-mono text-gray-600 font-bold border-t-2 border-gray-300 pt-2">
                            XAI Engine Bypassed (Compute Saved)
                        </span>
                    </div>
                ) : (
                    shap.map((driver, idx) => {
                        const maxImpact = Math.max(...shap.map(s => Math.abs(s.impact)));
                        const widthPercent = (Math.abs(driver.impact) / maxImpact) * 100;
                        const isPositive = driver.impact > 0;
                        
                        return (
                            <div key={idx} className="flex flex-col space-y-1">
                                <div className="flex justify-between text-[10px] font-mono font-bold uppercase text-black">
                                    <span>{driver.feature}</span>
                                    <span className="bg-gray-200 px-1 border border-black">VAL: {driver.observed}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 h-4 border-2 border-black bg-white overflow-hidden relative">
                                        <div 
                                            className={`absolute top-0 bottom-0 left-0 border-r-2 border-black transition-all duration-300 ${isPositive ? 'bg-[var(--color-accent-pink)]' : 'bg-[var(--color-accent-cyan)]'}`}
                                            style={{ width: `${widthPercent}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono font-black text-black min-w-[50px] text-right bg-white border-2 border-black px-1 shadow-[2px_2px_0_0_#111]">
                                        {isPositive ? '+' : ''}{driver.impact.toFixed(3)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
