import React, { useState } from 'react';

export default function FleetMatrix({ vehicles, selectedVin, onSelectVin }: any) {
    const [geofenceActive, setGeofenceActive] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#242933]">
                <span className="text-xs text-gray-400">Geofencing Controls:</span>
                <button 
                    onClick={() => setGeofenceActive(!geofenceActive)}
                    className={`text-[10px] px-3 py-1 font-bold ${geofenceActive ? 'bg-emerald-500 text-black' : 'border border-gray-600 text-gray-400'}`}
                >
                    {geofenceActive ? 'ZONE RESTRICTION ACTIVE' : 'TOGGLE BOUNDARY'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {vehicles.map((v: any) => {
                    const outOfBounds = geofenceActive && (Math.abs(v.telemetry?.gps_lat - 37.77) > 0.05 || Math.abs(v.telemetry?.gps_lng - (-122.41)) > 0.05);

                    return (
                        <div 
                            key={v.vin} 
                            onClick={() => onSelectVin(v.vin)}
                            className={`p-3 border cursor-pointer transition-colors ${selectedVin === v.vin ? 'bg-[#16181D] border-[#06B6D4]' : 'bg-[#0B0C0E] border-[#242933] hover:border-gray-500'}`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-200">{v.vin}</span>
                                {outOfBounds ? (
                                    <span className="text-[10px] px-2 py-0.5 bg-[#F5A623] text-black font-bold animate-pulse">GEOFENCE BREACH</span>
                                ) : (
                                    <span className={`text-[10px] px-2 py-0.5 font-bold ${v.status === 'CRITICAL_FAULT' ? 'bg-[#ff4876] text-black' : 'bg-[#242933] text-emerald-500'}`}>
                                        {v.status}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 text-xs text-gray-500 flex justify-between">
                                <span>SOC: {v.telemetry?.state_of_charge ?? '100'}%</span>
                                <span>SPD: {v.telemetry?.speed_mph?.toFixed(0) ?? '0'} MPH</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
