import React, { useState } from 'react';
import { Radio, RefreshCw, Zap, Activity, Info, Server } from 'lucide-react';

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

    // Simulated CAN-bus busload (nominal ~38-45%)
    const busload = Math.min(95, Math.max(25, 38 + (faultCount * 8) + (fleetCount > 0 ? 4 : 0)));

    return (
        <div className="h-full flex flex-col bg-[#161922] text-[#F3F4F6]">
            {/* Header */}
            <div className="border-b border-[#2A2E3D] px-4 py-2.5 flex justify-between items-center bg-[#12141A] shrink-0">
                <div className="flex items-center space-x-2">
                    <Radio className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
                    <span className="text-xs font-heading uppercase tracking-wider text-[#F3F4F6]">
                        EDGE INGESTION GATEWAY
                    </span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        title="Gateway & Pipeline Architecture"
                        className="p-1 hover:bg-[#1C202B] border border-[#2A2E3D] text-[#9CA3AF] hover:text-[#06B6D4]"
                    >
                        <Info className="w-3.5 h-3.5" />
                    </button>
                    <span className="bg-[#0D0F14] text-[#10B981] px-2 py-0.5 text-[9px] font-mono font-bold border border-[#10B981]/40">
                        ● ONLINE
                    </span>
                </div>
            </div>

            {/* Info Drawer when toggled */}
            {showInfo && (
                <div className="bg-[#0D0F14] border-b border-[#2A2E3D] p-2.5 text-[10px] font-mono text-[#9CA3AF] leading-relaxed">
                    <strong className="text-[#06B6D4]">ARCHITECTURE:</strong> Ingestion pipeline streaming high-velocity CAN frames via AWS SQS queue consumer and AWS Lambda microservices into DynamoDB.
                </div>
            )}

            {/* Content Body */}
            <div className="flex-1 p-3.5 flex flex-col justify-between space-y-3">
                {/* Pipeline Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="border border-[#2A2E3D] p-2 bg-[#0D0F14] flex flex-col justify-between shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                        <span className="text-[#64748B] uppercase text-[8px] font-bold">INGESTION PIPELINE</span>
                        <span className="font-bold text-[#F3F4F6] uppercase truncate text-[11px] tracking-wide">
                            AWS SQS / LAMBDA
                        </span>
                        <span className="text-[8px] text-[#64748B]">us-east-1 // DynamoDB</span>
                    </div>
                    <div className="border border-[#2A2E3D] p-2 bg-[#0D0F14] flex flex-col justify-between shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                        <span className="text-[#64748B] uppercase text-[8px] font-bold">RTT LATENCY</span>
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-[#10B981] bg-[#161922] px-1 text-[11px]">14 MS</span>
                            <span className="text-[8px] text-[#64748B]">p99: 28ms</span>
                        </div>
                        <span className="text-[8px] text-[#10B981]">0.00% PACKET DROP</span>
                    </div>
                </div>

                {/* CAN Busload Meter */}
                <div className="border border-[#2A2E3D] p-2.5 bg-[#0D0F14]">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold mb-1.5">
                        <span className="flex items-center text-[#9CA3AF]">
                            <Activity className="w-3 h-3 mr-1 text-[#06B6D4]" />
                            CAN-BUS NETWORK LOAD
                        </span>
                        <span className="text-[#F3F4F6]">{busload}%</span>
                    </div>
                    {/* Stepped progress bar */}
                    <div className="w-full bg-[#161922] h-2.5 border border-[#2A2E3D] flex p-0.5 gap-0.5">
                        {[20, 40, 60, 80, 100].map((step, idx) => (
                            <div 
                                key={step} 
                                className={`flex-1 transition-all ${
                                    busload >= step 
                                        ? idx >= 3 ? 'bg-[#EF4444]' : idx >= 2 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                                        : 'bg-transparent'
                                }`} 
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-[#64748B] mt-1.5">
                        <span>PROTOCOLS: J1939 / ISO-TP</span>
                        <span>BUFFER: 100 FIFO</span>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="neo-btn px-2 py-1.5 text-[10px] font-mono flex items-center justify-center uppercase hover:border-[#06B6D4] disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 mr-1.5 ${isRefreshing ? 'animate-spin text-[#06B6D4]' : 'text-[#06B6D4]'}`} />
                        {isRefreshing ? 'SYNCING...' : 'RE-SYNC DDB'}
                    </button>
                    <button
                        onClick={onSimulateBurst}
                        className="neo-btn px-2 py-1.5 text-[10px] font-mono flex items-center justify-center uppercase hover:border-[#F59E0B]"
                        title="Simulate high-frequency CAN packet burst"
                    >
                        <Zap className="w-3 h-3 mr-1.5 text-[#F59E0B]" />
                        CAN BURST
                    </button>
                </div>
            </div>
        </div>
    );
}
