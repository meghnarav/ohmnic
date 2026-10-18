import React, { useState } from 'react';
import { Radio, RefreshCw, Zap, Activity, Info } from 'lucide-react';

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
        <div className="h-full flex flex-col bg-[#12151D] text-white">
            {/* Titlebar */}
            <div className="bg-[#181C26] px-3 py-1.5 border-b-2 border-[#242938] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-[#0A0C10] border border-[#242938] text-[#00F0FF]">
                        [MOD-04 // GATEWAY]
                    </span>
                    <span className="text-xs font-heading font-black uppercase tracking-wider text-white">
                        EDGE INGESTION GATEWAY
                    </span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        title="Gateway & Pipeline Architecture"
                        className="neo-btn p-1 text-[#94A3B8] hover:text-[#00F0FF]"
                    >
                        <Info className="w-3 h-3" />
                    </button>
                    <span className="bg-[#0A0C10] text-[#10B981] px-2 py-0.5 text-[9px] font-mono font-bold border border-[#10B981]/50">
                        ● ONLINE
                    </span>
                </div>
            </div>

            {/* Info Drawer when toggled */}
            {showInfo && (
                <div className="bg-[#0A0C10] border-b-2 border-[#242938] p-2.5 text-[9px] font-mono text-[#94A3B8] leading-relaxed">
                    <strong className="text-[#00F0FF]">SYSTEMS NOVELTY:</strong> Asynchronous backpressure buffer via AWS SQS FIFO decoupling vehicle TCUs from containerized ARM64 Lambda XAI micro-VMs.
                </div>
            )}

            {/* Content Body */}
            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-[#12151D]">
                {/* Pipeline Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="border border-[#242938] p-2 bg-[#0A0C10] flex flex-col justify-between shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                        <span className="text-[#64748B] uppercase text-[8px] font-bold">INGESTION PIPELINE</span>
                        <span className="font-mono font-black text-white uppercase truncate text-xs tracking-wider">
                            AWS SQS / LAMBDA
                        </span>
                        <span className="text-[8px] text-[#64748B]">FIFO_GRP // DynamoDB</span>
                    </div>
                    <div className="border border-[#242938] p-2 bg-[#0A0C10] flex flex-col justify-between shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                        <span className="text-[#64748B] uppercase text-[8px] font-bold">RTT LATENCY (p95)</span>
                        <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-[#10B981] text-xs">14.2 MS</span>
                            <span className="text-[8px] text-[#64748B]">p99: 27ms</span>
                        </div>
                        <span className="text-[8px] text-[#10B981] font-bold">0.00% PACKET DROP</span>
                    </div>
                </div>

                {/* CAN Busload Meter */}
                <div className="border border-[#242938] p-2.5 bg-[#0A0C10]">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold mb-1.5">
                        <span className="flex items-center text-[#94A3B8]">
                            <Activity className="w-3 h-3 mr-1 text-[#00F0FF]" />
                            CAN-BUS NETWORK LOAD
                        </span>
                        <span className="font-mono font-black text-white">{busload}%</span>
                    </div>
                    {/* Stepped progress bar */}
                    <div className="w-full bg-[#12151D] h-3 border border-[#242938] flex p-0.5 gap-0.5">
                        {[20, 40, 60, 80, 100].map((step, idx) => (
                            <div 
                                key={step} 
                                className={`flex-1 transition-all ${
                                    busload >= step 
                                        ? idx >= 3 ? 'bg-[#EF4444]' : idx >= 2 ? 'bg-[#FFD000]' : 'bg-[#10B981]'
                                        : 'bg-transparent'
                                }`} 
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-[#64748B] mt-1.5 font-bold">
                        <span>PROTOCOLS: J1939 / ISO-TP</span>
                        <span>FIFO_BUFFER: 100 SLOTS</span>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="neo-btn px-2 py-1.5 text-[9px] font-mono font-bold flex items-center justify-center uppercase hover:border-[#00F0FF] disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 mr-1.5 ${isRefreshing ? 'animate-spin text-[#00F0FF]' : 'text-[#00F0FF]'}`} />
                        {isRefreshing ? 'SYNCING...' : 'RE-SYNC DDB'}
                    </button>
                    <button
                        onClick={onSimulateBurst}
                        className="neo-btn px-2 py-1.5 text-[9px] font-mono font-bold flex items-center justify-center uppercase hover:border-[#FFD000]"
                        title="Simulate 5Hz adaptive CAN burst"
                    >
                        <Zap className="w-3 h-3 mr-1.5 text-[#FFD000]" />
                        5HZ BURST
                    </button>
                </div>
            </div>
        </div>
    );
}
