import React, { useState } from 'react';
import { Radio, RefreshCw, Zap, Server, Activity, Info } from 'lucide-react';

interface EdgeGatewayCardProps {
    fleetCount: number;
    faultCount: number;
    onRefresh?: () => void;
    onSimulateBurst?: () => void;
    isRefreshing?: boolean;
}

export default function EdgeGatewayCard({
    fleetCount,
    faultCount,
    onRefresh,
    onSimulateBurst,
    isRefreshing = false,
}: EdgeGatewayCardProps) {
    const [showInfo, setShowInfo] = useState(false);

    // Dynamic simulated CAN-bus busload (nominal ~38-45%)
    const busload = Math.min(95, Math.max(25, 38 + (faultCount * 8) + (fleetCount > 0 ? 4 : 0)));

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b-4 border-black px-4 py-2 flex justify-between items-center bg-[var(--color-surface-deep)] shrink-0">
                <div className="flex items-center text-black">
                    <Radio className="w-4 h-4 mr-2 animate-pulse text-[var(--color-accent-emerald)]" strokeWidth={3} />
                    <span className="text-xs font-heading uppercase tracking-wider">EDGE INGESTION GATEWAY</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        title="Gateway & Firehose explanation"
                        className="p-1 hover:bg-gray-200 border border-black text-black"
                    >
                        <Info className="w-3.5 h-3.5" />
                    </button>
                    <span className="bg-black text-[var(--color-accent-emerald)] px-2 py-0.5 text-[9px] font-mono font-bold border border-black">
                        ● ONLINE
                    </span>
                </div>
            </div>

            {/* Info Drawer when toggled */}
            {showInfo && (
                <div className="bg-yellow-100 border-b-2 border-black p-2 text-[10px] font-mono text-black leading-tight">
                    <strong>FIREHOSE_RX:</strong> High-throughput telemetry Receiver (RX) consuming edge CAN-bus frames via AWS Kinesis Firehose & DynamoDB.
                </div>
            )}

            {/* Content Body */}
            <div className="flex-1 p-3 flex flex-col justify-between space-y-2.5">
                {/* Pipeline Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="border-2 border-black p-1.5 bg-gray-50 flex flex-col justify-between">
                        <span className="text-gray-500 uppercase text-[9px] font-bold">PIPELINE</span>
                        <span className="font-black text-black uppercase truncate">AWS FIREHOSE</span>
                        <span className="text-[8px] text-gray-500">us-east-1 (DynamoDB)</span>
                    </div>
                    <div className="border-2 border-black p-1.5 bg-gray-50 flex flex-col justify-between">
                        <span className="text-gray-500 uppercase text-[9px] font-bold">RTT LATENCY</span>
                        <div className="flex items-center justify-between">
                            <span className="font-black text-[var(--color-accent-emerald)] bg-black px-1 text-[11px]">14 MS</span>
                            <span className="text-[8px] text-gray-500">p99: 28ms</span>
                        </div>
                        <span className="text-[8px] text-gray-500">Zero packet drop</span>
                    </div>
                </div>

                {/* CAN Busload Meter */}
                <div className="border-2 border-black p-2 bg-white">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold mb-1">
                        <span className="flex items-center">
                            <Activity className="w-3 h-3 mr-1 text-black" />
                            CAN-BUS LOAD
                        </span>
                        <span>{busload}%</span>
                    </div>
                    {/* Stepped progress bar */}
                    <div className="w-full bg-gray-200 h-3 border border-black flex p-0.5 gap-0.5">
                        {[20, 40, 60, 80, 100].map((step, idx) => (
                            <div 
                                key={step} 
                                className={`flex-1 transition-all ${
                                    busload >= step 
                                        ? idx >= 3 ? 'bg-[var(--color-accent-pink)]' : idx >= 2 ? 'bg-[var(--color-accent-amber)]' : 'bg-[var(--color-accent-emerald)]'
                                        : 'bg-transparent'
                                }`} 
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-gray-500 mt-1">
                        <span>PROTOCOLS: J1939 / ISO-TP</span>
                        <span>BUFFER: 100 FIFO</span>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="neo-btn bg-[var(--color-accent-amber)] text-black px-2 py-1 text-[10px] font-heading flex items-center justify-center uppercase hover:bg-yellow-400 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'SYNCING...' : 'RE-POLL'}
                    </button>
                    <button
                        onClick={onSimulateBurst}
                        className="neo-btn bg-white text-black px-2 py-1 text-[10px] font-heading flex items-center justify-center uppercase hover:bg-gray-100"
                        title="Simulate high-frequency CAN packet burst"
                    >
                        <Zap className="w-3 h-3 mr-1 text-[var(--color-accent-pink)]" />
                        CAN BURST
                    </button>
                </div>
            </div>
        </div>
    );
}
