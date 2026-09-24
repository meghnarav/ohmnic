import React from 'react';
import { VehicleRecord } from '@/app/page';
import { ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

export default function AITriageAdvisory({ vehicle }: { vehicle: VehicleRecord }) {
    if (!vehicle) return null;

    const isCritical = vehicle.status === 'FAULT';
    const isNominal = vehicle.status === 'NOMINAL' || !vehicle.shap || vehicle.shap.length === 0;

    let advisoryTitle = "SYSTEM NOMINAL";
    let advisoryText = "All telemetrics within safe operational bounds.";
    
    if (!isNominal) {
        const topDriver = vehicle.shap.reduce((prev, current) => (prev.impact > current.impact) ? prev : current);
        if (topDriver.feature === 'deltaV') {
            advisoryTitle = "CELL IMBALANCE";
            advisoryText = `Variance (${topDriver.observed}) detected. Schedule balancing.`;
        } else if (topDriver.feature === 'maxTemp') {
            advisoryTitle = "THERMAL RISK";
            advisoryText = `Core temp (${topDriver.observed}°C) high. Throttle discharge.`;
        } else if (topDriver.feature === 'packCurrent') {
            advisoryTitle = "ANOMALOUS LOAD";
            advisoryText = `High current (${topDriver.observed}A). Inspect for shorts.`;
        } else {
            advisoryTitle = "VOLTAGE SAG";
            advisoryText = `Pack voltage (${topDriver.observed}V) dropped. Inspect modules.`;
        }
    }

    return (
        <div className={`h-full flex flex-col p-4 border-r-4 border-black ${isCritical ? 'bg-[var(--color-accent-pink)]' : isNominal ? 'bg-[var(--color-accent-emerald)]' : 'bg-[var(--color-accent-amber)]'}`}>
            <div className="flex items-center mb-4 border-b-4 border-black pb-2">
                <div className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_0_#111] mr-3">
                    {isCritical ? (
                        <ShieldAlert className="w-5 h-5 text-black" strokeWidth={3} />
                    ) : (
                        <ShieldCheck className="w-5 h-5 text-black" strokeWidth={3} />
                    )}
                </div>
                <h2 className="text-xl font-heading text-black">TRIAGE</h2>
            </div>
            
            <div className="flex-1 flex flex-col justify-center bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#111]">
                <div className="text-lg font-heading text-black mb-2 uppercase">
                    {advisoryTitle}
                </div>
                <p className="text-xs font-mono font-bold text-gray-700 leading-relaxed uppercase">
                    {advisoryText}
                </p>
            </div>
            
            <div className="mt-4 pt-2 flex items-center justify-between border-t-4 border-black">
                <span className="text-[10px] font-mono font-bold text-black flex items-center uppercase">
                    <Zap className="w-4 h-4 mr-1" strokeWidth={3} /> XAI Agent
                </span>
                <span className="text-[10px] font-mono font-black px-2 py-1 bg-white border-2 border-black shadow-[2px_2px_0_0_#111] text-black">
                    {isCritical ? 'URGENT' : isNominal ? 'OK' : 'LOG'}
                </span>
            </div>
        </div>
    );
}
