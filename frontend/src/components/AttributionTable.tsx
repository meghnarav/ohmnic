import React from 'react';
import { ShapDriver } from '@/app/page';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function AttributionTable({ shap, anomalyScore }: { shap: ShapDriver[], anomalyScore: number }) {
    const isNominal = !shap || shap.length === 0;
    
    return (
        <div className="glass-card h-full rounded-xl p-5 flex flex-col border-white/5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-200 flex items-center">
                        {isNominal ? (
                            <CheckCircle className="w-4 h-4 mr-2 text-[var(--color-accent-emerald)]" />
                        ) : (
                            <AlertCircle className="w-4 h-4 mr-2 text-[var(--color-accent-amber)]" />
                        )}
                        AI Risk Analysis (TreeSHAP)
                    </h2>
                    <p className="text-[10px] text-gray-500 mt-1">Explaining which telemetry features drove the Anomaly Score.</p>
                </div>
                <div className="group relative">
                    <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help transition-colors" />
                    <div className="absolute right-0 top-6 w-64 p-3 bg-black/90 border border-white/10 rounded text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                        <strong className="text-white block mb-1">What is this?</strong>
                        TreeSHAP isolates the exact mathematical impact (+ or -) each sensor value had on the final AI fault prediction. To save cloud compute, SHAP is only run when an anomaly is detected.
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {isNominal ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                        <CheckCircle className="w-8 h-8 text-[var(--color-accent-emerald)]" />
                        <span className="text-xs uppercase tracking-widest text-gray-400">
                            Asset Operating Nominally
                        </span>
                        <span className="text-[10px] text-gray-500 font-sans max-w-[200px]">
                            SHAP explainer engine is bypassed for healthy payloads to conserve Lambda compute resources.
                        </span>
                    </div>
                ) : (
                    shap.map((driver, idx) => {
                        const maxImpact = Math.max(...shap.map(s => Math.abs(s.impact)));
                        const widthPercent = (Math.abs(driver.impact) / maxImpact) * 100;
                        const isPositive = driver.impact > 0;
                        
                        return (
                            <div key={idx} className="flex flex-col space-y-1 animate-slide-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex justify-between text-[11px] font-mono">
                                    <span className="text-gray-300 font-bold">{driver.feature}</span>
                                    <span className="text-gray-500">Value: <span className="text-gray-200">{driver.observed}</span></span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden relative">
                                        <div 
                                            className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-1000 ease-out ${isPositive ? 'bg-gradient-to-r from-[var(--color-accent-amber)] to-[var(--color-accent-pink)]' : 'bg-[var(--color-accent-cyan)]'}`}
                                            style={{ width: `${widthPercent}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-bold min-w-[50px] text-right ${isPositive ? 'text-[var(--color-accent-pink)]' : 'text-[var(--color-accent-cyan)]'}`}>
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
