import React, { useState } from 'react';

export default function AlertsPanel({ fleet }: any) {
    const [triageState, setTriageState] = useState<Record<string, 'ASSIGNED' | 'SNOOZED' | 'RESOLVED'>>({});

    const criticalAlerts = fleet.filter((v: any) => v.status === 'CRITICAL_FAULT');

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#ff4876] mb-4 border-b border-[#242933] pb-2">
                Active Critical Alerts ({criticalAlerts.length})
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3">
                {criticalAlerts.length === 0 ? (
                    <div className="text-xs text-gray-500">No active alerts. System Nominal.</div>
                ) : (
                    criticalAlerts.map((v: any) => (
                        <div key={v.vin} className={`p-3 border ${triageState[v.vin] ? 'opacity-50 border-[#242933] bg-[#0B0C0E]' : 'border-[#ff4876] bg-[#16181D]'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-gray-200">{v.vin}</span>
                                <span className="text-[10px] text-[#ff4876]">{triageState[v.vin] || 'UNASSIGNED'}</span>
                            </div>
                            <div className="text-xs text-gray-400 mb-3">
                                Max Temp: {v.telemetry?.max_cell_temp_c}°C
                            </div>
                            
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => setTriageState({ ...triageState, [v.vin]: 'ASSIGNED' })}
                                    className="text-[10px] px-2 py-1 border border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4] hover:text-black"
                                >
                                    ASSIGN
                                </button>
                                <button 
                                    onClick={() => setTriageState({ ...triageState, [v.vin]: 'SNOOZED' })}
                                    className="text-[10px] px-2 py-1 border border-[#F5A623] text-[#F5A623] hover:bg-[#F5A623] hover:text-black"
                                >
                                    SNOOZE
                                </button>
                                <button 
                                    onClick={() => setTriageState({ ...triageState, [v.vin]: 'RESOLVED' })}
                                    className="text-[10px] px-2 py-1 border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black"
                                >
                                    RESOLVE
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
