import React from 'react';
import { VehicleRecord } from '@/app/page';

export default function DiagnosticsPanel({ vehicle }: { vehicle: VehicleRecord }) {
    if (!vehicle) return null;

    const anomalyProb = vehicle.score * 100;
    const tempValue = vehicle.maxTemp;

    const riskLevel = tempValue > 48 ? 'CRITICAL' : tempValue > 45 ? 'WARNING' : 'NOMINAL';

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Thermal Risk */}
                <div className="bg-[#16181D] border border-[#242933] p-4 rounded">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Pack Temperature</div>
                    <div className="flex justify-between items-end">
                        <span className={`text-2xl font-bold ${riskLevel === 'CRITICAL' ? 'text-[#ff4876]' : riskLevel === 'WARNING' ? 'text-[#F5A623]' : 'text-emerald-500'}`}>
                            {tempValue.toFixed(1)}°C
                        </span>
                        <span className="text-xs text-gray-400">Risk: {riskLevel}</span>
                    </div>
                </div>

                {/* Anomaly Score */}
                <div className="bg-[#16181D] border border-[#242933] p-4 rounded">
                    <div className="text-[10px] text-[#ff4876] uppercase tracking-widest mb-1">Isolation Forest Anomaly Prob</div>
                    <div className="text-2xl font-bold text-gray-200">{anomalyProb.toFixed(1)}%</div>
                    <div className="text-xs text-gray-400 mt-1">Live empirical inference</div>
                </div>

                {/* Voltage */}
                <div className="bg-[#16181D] border border-[#242933] p-4 rounded">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Pack Voltage</div>
                    <div className="text-2xl font-bold text-gray-200">{vehicle.packVoltage.toFixed(1)} V</div>
                    <div className="text-xs text-gray-400 mt-1">ΔV: {vehicle.deltaV.toFixed(3)}V</div>
                </div>

                {/* Current */}
                <div className="bg-[#16181D] border border-[#242933] p-4 rounded">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Current Draw</div>
                    <div className="text-2xl font-bold text-gray-200">{vehicle.packCurrent.toFixed(1)} A</div>
                    <div className="text-xs text-gray-400 mt-1">Real-time load</div>
                </div>
            </div>
        </div>
    );
}
