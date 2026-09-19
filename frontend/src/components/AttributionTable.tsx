import React from 'react';
import { ShapDriver } from '@/app/page';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AttributionTable({ shap, anomalyScore }: { shap: ShapDriver[], anomalyScore: number }) {
    if (!shap || shap.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-gray-500 space-y-2 py-8 bg-[#16181D] rounded border border-[#242933]">
                <span className="text-xs uppercase tracking-widest">NOMINAL OPERATIONS</span>
                <span className="text-[10px]">No anomalous features detected by Isolation Forest.</span>
            </div>
        );
    }

    // Format data for Recharts
    const chartData = shap.map(attr => ({
        name: attr.feature,
        impact: Number(attr.impact.toFixed(3)),
        observed: attr.observed,
    })).reverse(); // Reverse so highest impact is at top in horizontal chart

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0B0C0E] border border-[#242933] p-2 text-[10px] font-mono text-gray-300">
                    <p className="text-[#06B6D4] font-bold">{label}</p>
                    <p>SHAP Impact: <span className="text-[#ff4876]">+{payload[0].value}</span></p>
                    <p>Observed: {payload[0].payload.observed}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-full bg-[#16181D] border border-[#242933] p-4 rounded flex flex-col">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-4 flex justify-between items-center">
                <span>TreeSHAP Feature Attribution</span>
                <span className="text-[#ff4876] border border-[#ff4876]/30 bg-[#ff4876]/10 px-2 py-0.5 rounded">
                    Score: {anomalyScore.toFixed(2)}
                </span>
            </div>
            
            <div className="flex-1 w-full h-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
                    >
                        <XAxis type="number" hide domain={[0, 'dataMax + 0.1']} />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'monospace' }}
                            width={120}
                        />
                        <Tooltip cursor={{ fill: '#242933' }} content={<CustomTooltip />} />
                        <Bar dataKey="impact" radius={[0, 4, 4, 0]} barSize={20}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#ff4876' : '#F5A623'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
