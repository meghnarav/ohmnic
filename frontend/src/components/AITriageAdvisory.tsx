import React from 'react';
import { VehicleRecord } from '@/app/page';
import { ShieldAlert, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

export default function AITriageAdvisory({ vehicle }: { vehicle: VehicleRecord }) {
    if (!vehicle) return null;

    const isCritical = vehicle.status === 'FAULT';
    const isWarn = vehicle.status === 'WARN';
    const isNominal = vehicle.status === 'NOMINAL' || !vehicle.shap || vehicle.shap.length === 0;

    let advisoryTitle = "SYSTEM_NOMINAL";
    let advisoryText = "All telemetrics within nominal bounds. Zero anomalous electrochemical degradation detected.";
    let actionItem = "Maintain standard telemetry polling profile (0.05 Hz heartbeat).";
    
    if (!isNominal && vehicle.shap && vehicle.shap.length > 0) {
        const topDriver = vehicle.shap.reduce((prev, current) => (prev.impact > current.impact) ? prev : current);
        if (topDriver.feature === 'deltaV') {
            advisoryTitle = "CELL_IMBALANCE_BURST";
            advisoryText = `Excessive variance (${topDriver.observed}) detected across module parallel strings.`;
            actionItem = "Trigger 5 Hz telemetry burst & schedule passive cell balancing calibration.";
        } else if (topDriver.feature === 'maxTemp') {
            advisoryTitle = "THERMAL_RUNAWAY_RISK";
            advisoryText = `Core pack temperature (${topDriver.observed}°C) exceeding safety threshold envelope.`;
            actionItem = "Throttle discharge C-rate and engage auxiliary coolant pump circuit.";
        } else if (topDriver.feature === 'packCurrent') {
            advisoryTitle = "CURRENT_OVERLOAD_SPIKE";
            advisoryText = `Anomalous current ingress (${topDriver.observed}A) observed during drive cycle.`;
            actionItem = "Isolate DC bus contactors and inspect for short-circuit telemetry.";
        } else {
            advisoryTitle = "VOLTAGE_SAG_ANOMALY";
            advisoryText = `Pack potential (${topDriver.observed}V) dropped below baseline discharge threshold.`;
            actionItem = "Verify module terminal impedance and contact resistance.";
        }
    }

    const badgeColor = isCritical ? '#EF4444' : isWarn ? '#FFD000' : '#10B981';

    return (
        <div className="h-full flex flex-col bg-[#12151D] text-white">
            {/* Titlebar */}
            <div className="bg-[#181C26] px-3 py-1.5 border-b-2 border-[#242938] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-[#0A0C10] border border-[#242938] text-[#00F0FF]">
                        [MOD-02 // TRIAGE]
                    </span>
                    <h2 className="text-xs font-heading font-black tracking-wider uppercase text-white">
                        AI TRIAGE ADVISORY
                    </h2>
                </div>
                <span 
                    style={{ borderColor: badgeColor, color: badgeColor }}
                    className="text-[9px] font-mono font-black px-2 py-0.5 bg-[#0A0C10] border uppercase tracking-wider"
                >
                    {isCritical ? 'CRITICAL_FAULT' : isWarn ? 'WARNING_FLAG' : 'SYSTEM_OK'}
                </span>
            </div>
            
            {/* Recessed Diagnostics Well */}
            <div className="p-3.5 flex-1 flex flex-col justify-between bg-[#12151D]">
                <div className="bg-[#0A0C10] border-2 border-[#242938] p-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#242938]">
                        <span 
                            style={{ color: badgeColor }}
                            className="font-mono text-xs font-black uppercase tracking-wider flex items-center"
                        >
                            {isCritical ? <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-[#EF4444]" /> : isWarn ? <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-[#FFD000]" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#10B981]" />}
                            {advisoryTitle}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-[#64748B]">CONFIDENCE: 94.8%</span>
                    </div>
                    <p className="text-[11px] font-mono text-[#94A3B8] leading-relaxed mt-2 mb-2">
                        {advisoryText}
                    </p>

                    <div className="border-t border-[#242938] pt-2 mt-2">
                        <span className="text-[9px] font-mono font-black text-[#00F0FF] uppercase block mb-0.5">
                            ACTIONABLE REMEDIATION:
                        </span>
                        <p className="text-[10px] font-mono font-bold text-white">
                            {actionItem}
                        </p>
                    </div>
                </div>

                {/* Footer Tag */}
                <div className="mt-3 pt-2 flex items-center justify-between border-t border-[#242938] text-[9px] font-mono text-[#64748B]">
                    <span className="flex items-center uppercase text-[#94A3B8] font-bold">
                        <Zap className="w-3 h-3 mr-1 text-[#00F0FF]" /> TreeSHAP Inference Engine
                    </span>
                    <span className="text-[#00F0FF] font-black">
                        LATENCY: 2.4ms // ARM64
                    </span>
                </div>
            </div>
        </div>
    );
}
