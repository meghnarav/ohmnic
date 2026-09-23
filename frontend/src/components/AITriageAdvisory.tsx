import React from 'react';
import { VehicleRecord } from '@/app/page';
import { ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

export default function AITriageAdvisory({ vehicle }: { vehicle: VehicleRecord }) {
    if (!vehicle) return null;

    const isCritical = vehicle.status === 'FAULT';
    const isNominal = vehicle.status === 'NOMINAL' || !vehicle.shap || vehicle.shap.length === 0;

    let advisoryTitle = "NOMINAL OPERATION";
    let advisoryText = "System is operating within normal safety thresholds. No anomaly detected.";
    
    if (!isNominal) {
        const topDriver = vehicle.shap.reduce((prev, current) => (prev.impact > current.impact) ? prev : current);
        if (topDriver.feature === 'deltaV') {
            advisoryTitle = "CELL IMBALANCE DETECTED";
            advisoryText = `High variance (${topDriver.observed} mV) detected across cell blocks. Recommend scheduling balancing routine.`;
        } else if (topDriver.feature === 'maxTemp') {
            advisoryTitle = "THERMAL RUNAWAY RISK";
            advisoryText = `Core temperature (${topDriver.observed}°C) exceeds nominal limits. Throttle discharge rate immediately.`;
        } else if (topDriver.feature === 'packCurrent') {
            advisoryTitle = "ANOMALOUS LOAD DRAW";
            advisoryText = `Unexpected current draw (${topDriver.observed} A). Check for short circuits or heavy unauthorized loads.`;
        } else {
            advisoryTitle = "VOLTAGE SAG DETECTED";
            advisoryText = `Pack voltage (${topDriver.observed} V) has dropped unexpectedly. Inspect for damaged modules.`;
        }
    }

    return (
        <div className={`glass-card h-full rounded-xl flex flex-col relative overflow-hidden p-5 ${isCritical ? 'border-[var(--color-accent-pink)]/40 bg-[var(--color-accent-pink)]/5' : 'border-white/5'}`}>
            <div className="flex items-center mb-3">
                {isCritical ? (
                    <ShieldAlert className="w-5 h-5 mr-2 text-[var(--color-accent-pink)]" />
                ) : (
                    <ShieldCheck className="w-5 h-5 mr-2 text-[var(--color-accent-emerald)]" />
                )}
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-200">AI Triage Advisory</h2>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
                <div className={`text-sm font-bold mb-2 ${isCritical ? 'text-[var(--color-accent-pink)]' : isNominal ? 'text-[var(--color-accent-emerald)]' : 'text-[var(--color-accent-amber)]'}`}>
                    {advisoryTitle}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {advisoryText}
                </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 flex items-center">
                    <Zap className="w-3 h-3 mr-1" /> Automated XAI Diagnosis
                </span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded bg-black/40 ${isCritical ? 'text-[var(--color-accent-pink)] border border-[var(--color-accent-pink)]/20' : 'text-gray-400'}`}>
                    {isCritical ? 'URGENT ACTION REQUIRED' : isNominal ? 'ALL CLEAR' : 'LOGGED'}
                </span>
            </div>
        </div>
    );
}
