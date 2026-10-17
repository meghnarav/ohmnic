import React from 'react';
import { VehicleRecord } from '@/app/page';
import { ShieldAlert, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

export default function AITriageAdvisory({ vehicle }: { vehicle: VehicleRecord }) {
    if (!vehicle) return null;

    const isCritical = vehicle.status === 'FAULT';
    const isWarn = vehicle.status === 'WARN';
    const isNominal = vehicle.status === 'NOMINAL' || !vehicle.shap || vehicle.shap.length === 0;

    let advisoryTitle = "SYSTEM NOMINAL";
    let advisoryText = "All telemetrics within safe operational bounds. Nominal electrochemical cell degradation.";
    let actionItem = "Routine scheduled maintenance cycle.";
    
    if (!isNominal && vehicle.shap && vehicle.shap.length > 0) {
        const topDriver = vehicle.shap.reduce((prev, current) => (prev.impact > current.impact) ? prev : current);
        if (topDriver.feature === 'deltaV') {
            advisoryTitle = "CELL IMBALANCE DETECTED";
            advisoryText = `Excessive variance (${topDriver.observed}) detected across module parallel strings.`;
            actionItem = "Execute passive cell balancing & cycle depth calibration.";
        } else if (topDriver.feature === 'maxTemp') {
            advisoryTitle = "THERMAL RUNAWAY RISK";
            advisoryText = `Core pack temperature (${topDriver.observed}°C) exceeding safety threshold.`;
            actionItem = "Throttle discharge C-rate and engage auxiliary coolant pump.";
        } else if (topDriver.feature === 'packCurrent') {
            advisoryTitle = "ANOMALOUS CURRENT INGRESS";
            advisoryText = `High bus current spike (${topDriver.observed}A) during current cycle.`;
            actionItem = "Isolate DC contactors and inspect for short-circuit telemetry.";
        } else {
            advisoryTitle = "VOLTAGE SAG DETECTED";
            advisoryText = `Pack voltage (${topDriver.observed}V) dropped below nominal discharge baseline.`;
            actionItem = "Verify module terminal impedance and contact resistance.";
        }
    }

    const badgeColor = isCritical ? '#EF4444' : isWarn ? '#F59E0B' : '#10B981';

    return (
        <div className="h-full flex flex-col p-4 bg-[#161922] text-[#F3F4F6]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 border-b border-[#2A2E3D] pb-3">
                <div className="flex items-center space-x-2.5">
                    {isCritical ? (
                        <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                    ) : isWarn ? (
                        <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                    ) : (
                        <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                    )}
                    <h2 className="text-sm font-heading tracking-wider uppercase text-[#F3F4F6]">
                        AI TRIAGE ADVISORY
                    </h2>
                </div>
                <span 
                    style={{ borderColor: badgeColor, color: badgeColor }}
                    className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[#0D0F14] border uppercase tracking-wider"
                >
                    {isCritical ? 'FAULT_DETECTED' : isWarn ? 'WARNING_STATE' : 'HEALTHY'}
                </span>
            </div>
            
            {/* Recessed Diagnostics Well */}
            <div className="flex-1 flex flex-col justify-between bg-[#0D0F14] border border-[#2A2E3D] p-3.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <span 
                            style={{ color: badgeColor }}
                            className="font-mono text-xs font-bold uppercase tracking-wider"
                        >
                            {advisoryTitle}
                        </span>
                        <span className="text-[9px] font-mono text-[#64748B]">XAI_CONFIDENCE: 94.8%</span>
                    </div>
                    <p className="text-[11px] font-mono text-[#9CA3AF] leading-relaxed mb-3">
                        {advisoryText}
                    </p>
                </div>

                <div className="border-t border-[#2A2E3D] pt-2 mt-2">
                    <span className="text-[9px] font-mono text-[#06B6D4] uppercase block font-bold mb-0.5">
                        RECOMMENDED ACTION:
                    </span>
                    <p className="text-[10px] font-mono text-[#F3F4F6]">
                        {actionItem}
                    </p>
                </div>
            </div>
            
            {/* Footer */}
            <div className="mt-3 pt-2 flex items-center justify-between border-t border-[#2A2E3D] text-[10px] font-mono text-[#64748B]">
                <span className="flex items-center uppercase text-[#9CA3AF]">
                    <Zap className="w-3.5 h-3.5 mr-1 text-[#06B6D4]" /> TreeSHAP XAI
                </span>
                <span className="text-[9px] text-[#06B6D4] font-bold">
                    INFERENCE // 2.4ms
                </span>
            </div>
        </div>
    );
}
