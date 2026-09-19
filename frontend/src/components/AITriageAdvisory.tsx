import React from 'react';
import { VehicleRecord } from '@/app/page';

export default function AITriageAdvisory({ vehicle }: { vehicle: VehicleRecord }) {
    if (!vehicle || vehicle.status === 'NOMINAL') {
        return (
            <div className="bg-[#16181D] border border-emerald-500/30 p-4 rounded h-full">
                <div className="text-[10px] text-emerald-500 uppercase tracking-widest mb-2 flex items-center">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                    AI Triage Advisory
                </div>
                <div className="text-sm text-gray-400 font-mono">
                    System nominal. No critical actions recommended at this time. Routine balancing active.
                </div>
            </div>
        );
    }

    const topDriver = vehicle.shap.length > 0 ? vehicle.shap[0].feature : 'Unknown';
    let advisory = '';

    if (topDriver === 'pack_temp_c') {
        advisory = "CRITICAL THERMAL EVENT DETECTED: Immediately throttle discharge rates and command cooling loop to max capacity. High risk of thermal runaway.";
    } else if (topDriver === 'cell_voltage_delta') {
        advisory = "SEVERE CELL IMBALANCE DETECTED: Schedule vehicle for depot service. Potential micro-short or uneven degradation across parallel strings.";
    } else if (topDriver === 'pack_voltage') {
        advisory = "UNDERVOLTAGE FAULT DETECTED: Isolate pack from load. Cell voltages approaching irreversible degradation thresholds.";
    } else if (topDriver === 'pack_current') {
        advisory = "OVERCURRENT LOAD FAULT: The inverter is pulling higher C-Rates than recommended for the current SoC/Temp envelope. Software limit required.";
    } else {
        advisory = "COMPOSITE ANOMALY: The Isolation Forest has flagged anomalous systemic behavior. Ground vehicle for manual telemetry review.";
    }

    return (
        <div className={`bg-[#0B0C0E] border p-4 rounded h-full ${vehicle.status === 'FAULT' ? 'border-[#ff4876] shadow-[0_0_15px_rgba(255,72,118,0.15)]' : 'border-[#F5A623]'}`}>
            <div className={`text-[10px] uppercase tracking-widest mb-2 flex items-center ${vehicle.status === 'FAULT' ? 'text-[#ff4876]' : 'text-[#F5A623]'}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse mr-2 ${vehicle.status === 'FAULT' ? 'bg-[#ff4876]' : 'bg-[#F5A623]'}`}></div>
                AI Triage Advisory [ACTION REQUIRED]
            </div>
            <div className="text-sm text-gray-200 font-mono leading-relaxed">
                {advisory}
            </div>
            <div className="mt-4 pt-3 border-t border-[#242933] flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Root Cause Driver: <span className="text-gray-300 font-bold">{topDriver}</span></span>
                <button className="bg-[#242933] hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors">
                    GENERATE TICKET
                </button>
            </div>
        </div>
    );
}
