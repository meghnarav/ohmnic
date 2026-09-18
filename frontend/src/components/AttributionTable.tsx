import React from 'react';

export default function AttributionTable({ attributions, anomalyScore }: any) {
    if (!attributions) return null;

    const entries = Object.entries(attributions).sort(([,a], [,b]) => (b as number) - (a as number));

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs mb-4">
                <span className="text-gray-400">Total Anomaly Probability:</span>
                <span className={`font-bold ${anomalyScore > 0.65 ? 'text-[#ff4876]' : 'text-emerald-500'}`}>
                    {(anomalyScore * 100).toFixed(1)}%
                </span>
            </div>
            
            {entries.map(([key, val]: any) => (
                <div key={key} className="bg-[#16181D] border border-[#242933] p-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase text-gray-300 font-bold">{key}</span>
                    <div className="flex items-center space-x-2 w-1/2">
                        <div className="w-full bg-[#0B0C0E] h-1.5 flex-1 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 bg-[#ff4876]" style={{ width: `${val * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-[#ff4876] w-8 text-right">{(val * 100).toFixed(0)}%</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
