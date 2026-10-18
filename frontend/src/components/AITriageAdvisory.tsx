import React from "react";
import { VehicleRecord } from "@/app/page";
import { ShieldAlert, ShieldCheck, Zap, AlertTriangle } from "lucide-react";

export default function AITriageAdvisory({ vehicle }: { vehicle: VehicleRecord }) {
    if (!vehicle) return null;

    const isCritical = vehicle.status === "FAULT";
    const isWarn = vehicle.status === "WARN";
    const isNominal = vehicle.status === "NOMINAL" || !vehicle.shap || vehicle.shap.length === 0;

    let advisoryTitle = "SYSTEM_NOMINAL";
    let advisoryText = "All telemetrics within nominal bounds. Zero anomalous electrochemical degradation detected.";
    let actionItem = "Maintain standard telemetry polling profile (0.05 Hz heartbeat).";
    
    if (!isNominal && vehicle.shap && vehicle.shap.length > 0) {
        const topDriver = vehicle.shap.reduce((prev, current) => (prev.impact > current.impact) ? prev : current);
        if (topDriver.feature === "deltaV") {
            advisoryTitle = "CELL_IMBALANCE_BURST";
            advisoryText = `Excessive variance (${topDriver.observed}) detected across module parallel strings.`;
            actionItem = "Trigger 5 Hz telemetry burst & schedule passive cell balancing calibration.";
        } else if (topDriver.feature === "maxTemp") {
            advisoryTitle = "THERMAL_RUNAWAY_RISK";
            advisoryText = `Core pack temperature (${topDriver.observed}°C) exceeding safety threshold envelope.`;
            actionItem = "Throttle discharge C-rate and engage auxiliary coolant pump circuit.";
        } else if (topDriver.feature === "packCurrent") {
            advisoryTitle = "CURRENT_OVERLOAD_SPIKE";
            advisoryText = `Anomalous current ingress (${topDriver.observed}A) observed during drive cycle.`;
            actionItem = "Isolate DC bus contactors and inspect for short-circuit telemetry.";
        } else {
            advisoryTitle = "VOLTAGE_SAG_ANOMALY";
            advisoryText = `Pack potential (${topDriver.observed}V) dropped below baseline discharge threshold.`;
            actionItem = "Verify module terminal impedance and contact resistance.";
        }
    }

    const badgeColor = isCritical ? "#DC2626" : isWarn ? "#D97706" : "#059669";

    return (
        <div className="h-full flex flex-col bg-[#FFFFFF] text-[#0F131A]">
            {/* Titlebar Rack Strip */}
            <div className="bg-[#DFE3DC] px-3 py-1.5 border-b-2 border-[#1E2229] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-[#1E2229] bg-white px-1.5 py-0.5 border border-[#1E2229]">
                        [MOD-02]
                    </span>
                    <h2 className="text-xs font-mono font-black tracking-widest text-[#1E2229] uppercase">
                        AI TRIAGE ADVISORY
                    </h2>
                </div>
                <span 
                    style={{ borderColor: "#1E2229", color: badgeColor }}
                    className="text-[9px] font-mono font-bold px-2 py-0.5 bg-white border uppercase tracking-wider"
                >
                    {isCritical ? "CRITICAL_FAULT" : isWarn ? "WARNING_FLAG" : "SYSTEM_OK"}
                </span>
            </div>
            
            {/* Recessed Diagnostics Well */}
            <div className="p-3.5 flex-1 flex flex-col justify-between bg-[#FFFFFF]">
                <div className="bg-[#ECEEEA] border-2 border-[#1E2229] p-3 shadow-[2px_2px_0px_#1E2229]">
                    <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#1E2229]/20">
                        <span 
                            style={{ color: badgeColor }}
                            className="font-mono text-xs font-black uppercase tracking-wider flex items-center"
                        >
                            {isCritical ? (
                                <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-[#DC2626]" />
                            ) : isWarn ? (
                                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-[#D97706]" />
                            ) : (
                                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#059669]" />
                            )}
                            {advisoryTitle}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-[#4B5565]">CONFIDENCE: 94.8%</span>
                    </div>
                    <p className="text-[11px] font-mono text-[#4B5565] leading-relaxed mt-2 mb-2 font-medium">
                        {advisoryText}
                    </p>

                    <div className="bg-white border-2 border-[#1E2229] p-2.5 mt-2 shadow-[1px_1px_0px_#1E2229]">
                        <span className="text-[9px] font-mono font-black text-[#2563EB] uppercase block mb-0.5 tracking-wider">
                            ACTIONABLE REMEDIATION:
                        </span>
                        <p className="text-[10px] font-mono font-bold text-[#0F131A]">
                            {actionItem}
                        </p>
                    </div>
                </div>

                {/* Footer Tag */}
                <div className="mt-3 pt-2 flex items-center justify-between border-t border-[#1E2229]/20 text-[9px] font-mono text-[#4B5565]">
                    <span className="flex items-center uppercase text-[#4B5565] font-bold">
                        <Zap className="w-3 h-3 mr-1 text-[#2563EB]" /> TreeSHAP Inference Engine
                    </span>
                    <span className="text-[#0F131A] font-black">
                        LATENCY: 2.4ms // ARM64
                    </span>
                </div>
            </div>
        </div>
    );
}
