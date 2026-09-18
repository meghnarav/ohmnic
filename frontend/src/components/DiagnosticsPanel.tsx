import React, { useState } from 'react';

export default function DiagnosticsPanel({ telemetry, status, vin }: any) {
    const [chargingLimited, setChargingLimited] = useState(false);
    const [preconditioning, setPreconditioning] = useState(false);

    if (!telemetry) return null;

    const riskLevel = telemetry.max_cell_temp_c > 45 ? 'CRITICAL' : telemetry.max_cell_temp_c > 35 ? 'WARNING' : 'NOMINAL';
    const regenEfficiency = telemetry.consumed_kwh > 0 ? ((telemetry.regen_kwh / telemetry.consumed_kwh) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Thermal Risk */}
                <div className="bg-[#16181D] border border-[#242933] p-4 rounded">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Thermal Risk Indicator</div>
                    <div className="flex justify-between items-end">
                        <span className={`text-2xl font-bold ${riskLevel === 'CRITICAL' ? 'text-[#ff4876]' : 'text-gray-200'}`}>
                            {telemetry.max_cell_temp_c}°C
                        </span>
                        <span className="text-xs text-gray-400">Amb: {telemetry.ambient_temp_c}°C</span>
                    </div>
                    <div className="w-full bg-[#0B0C0E] h-1 mt-2">
                        <div className={`h-1 ${riskLevel === 'CRITICAL' ? 'bg-[#ff4876]' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, telemetry.max_cell_temp_c / 60 * 100)}%` }} />
                    </div>
                </div>

                {/* State of Health */}
                <div className="bg-[#16181D] border border-[#242933] p-4 rounded">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Battery Health (SoH)</div>
                    <div className="text-2xl font-bold text-gray-200">{telemetry.soh}%</div>
                    <div className="text-xs text-gray-400 mt-1">Degradation Tracking Active</div>
                </div>

                {/* Regen Braking */}
                <div className="bg-[#16181D] border border-[#242933] p-4 rounded">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Regen Efficiency</div>
                    <div className="text-2xl font-bold text-gray-200">{regenEfficiency}%</div>
                    <div className="text-xs text-gray-400 mt-1">Rec: {telemetry.regen_kwh}kWh / Con: {telemetry.consumed_kwh}kWh</div>
                </div>

                {/* Charging Degradation */}
                <div className="bg-[#16181D] border border-[#242933] p-4 rounded">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">DC Fast Charge Status</div>
                    <div className="text-2xl font-bold text-gray-200">{telemetry.charge_rate_kw > 0 ? `${telemetry.charge_rate_kw} kW` : 'IDLE'}</div>
                    <div className="text-xs text-gray-400 mt-1">{telemetry.charge_rate_kw > 100 ? 'Optimal Rate' : 'Throttled / Idle'}</div>
                </div>
            </div>

            {/* Smart Charging Dispatcher */}
            <div className="bg-[#16181D] border border-[#242933] p-4 rounded mt-4">
                <div className="text-[10px] text-[#06B6D4] uppercase tracking-widest mb-3">Smart Charging Dispatcher</div>
                <div className="flex space-x-3">
                    <button 
                        onClick={() => setPreconditioning(!preconditioning)}
                        className={`text-xs px-4 py-2 font-bold ${preconditioning ? 'bg-[#06B6D4] text-black' : 'border border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4] hover:text-black'} transition-colors`}
                    >
                        {preconditioning ? 'PRE-CONDITIONING ACTIVE' : 'INITIATE PRE-CONDITIONING'}
                    </button>
                    <button 
                        onClick={() => setChargingLimited(!chargingLimited)}
                        className={`text-xs px-4 py-2 font-bold ${chargingLimited ? 'bg-[#F5A623] text-black' : 'border border-[#F5A623] text-[#F5A623] hover:bg-[#F5A623] hover:text-black'} transition-colors`}
                    >
                        {chargingLimited ? 'CHARGE LIMITED TO 80%' : 'LIMIT CHARGE TO 80%'}
                    </button>
                </div>
            </div>
        </div>
    );
}
