import React, { useState } from "react";
import { Radio, RefreshCw, Zap, Activity, Info } from "lucide-react";

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
        <div className="h-full flex flex-col bg-[#FFFFFF] text-[#0F131A]">
            {/* Titlebar Rack Strip */}
            <div className="bg-[#DFE3DC] px-3 py-1.5 border-b-2 border-[#1E2229] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-[#1E2229] bg-white px-1.5 py-0.5 border border-[#1E2229]">
                        [MOD-04]
                    </span>
                    <span className="text-xs font-mono font-black uppercase tracking-widest text-[#1E2229]">
                        EDGE INGESTION GATEWAY
                    </span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        title="Gateway & Pipeline Architecture"
                        className="neo-btn p-1 text-[#1E2229] hover:bg-[#ECEEEA]"
                    >
                        <Info className="w-3 h-3" />
                    </button>
                    <span className="bg-white text-[#059669] px-2 py-0.5 text-[9px] font-mono font-bold border border-[#1E2229]">
                        ● ONLINE
                    </span>
                </div>
            </div>

            {/* Info Drawer when toggled */}
            {showInfo && (
                <div className="bg-[#ECEEEA] border-b-2 border-[#1E2229] p-2.5 text-[9px] font-mono text-[#4B5565] leading-relaxed font-semibold">
                    <strong className="text-[#0F131A]">SYSTEMS NOVELTY:</strong> Asynchronous backpressure buffer via AWS SQS FIFO decoupling vehicle TCUs from containerized ARM64 Lambda XAI micro-VMs.
                </div>
            )}

            {/* Content Body */}
            <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2 bg-[#FFFFFF] overflow-hidden">
                {/* Pipeline Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="border-2 border-[#1E2229] p-2 bg-[#ECEEEA] flex flex-col justify-between shadow-[2px_2px_0px_#1E2229]">
                        <span className="text-[#4B5565] uppercase text-[8px] font-bold">INGESTION PIPELINE</span>
                        <span className="font-mono font-black text-[#0F131A] uppercase truncate text-xs tracking-wider">
                            AWS SQS / LAMBDA
                        </span>
                        <span className="text-[8px] text-[#4B5565] font-semibold">FIFO_GRP // DynamoDB</span>
                    </div>
                    <div className="border-2 border-[#1E2229] p-2 bg-[#ECEEEA] flex flex-col justify-between shadow-[2px_2px_0px_#1E2229]">
                        <span className="text-[#4B5565] uppercase text-[8px] font-bold">RTT LATENCY (p95)</span>
                        <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-[#059669] text-xs">14.2 MS</span>
                            <span className="text-[8px] text-[#4B5565] font-semibold">p99: 27ms</span>
                        </div>
                        <span className="text-[8px] text-[#059669] font-black">0.00% PACKET DROP</span>
                    </div>
                </div>

                {/* CAN Busload Meter */}
                <div className="border-2 border-[#1E2229] p-2.5 bg-[#ECEEEA] shadow-[2px_2px_0px_#1E2229]">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold mb-1.5">
                        <span className="flex items-center text-[#4B5565] uppercase tracking-wider">
                            <Activity className="w-3.5 h-3.5 mr-1.5 text-[#2563EB]" />
                            CAN-BUS NETWORK LOAD
                        </span>
                        <span className="font-mono font-black text-[#0F131A] text-xs">{busload}%</span>
                    </div>
                    {/* Stepped progress bar */}
                    <div className="w-full bg-[#FFFFFF] h-4 border-2 border-[#1E2229] flex p-0.5 gap-1">
                        {[20, 40, 60, 80, 100].map((step, idx) => (
                            <div 
                                key={step} 
                                className={`flex-1 transition-all ${
                                    busload >= step 
                                        ? idx >= 3 ? "bg-[#DC2626]" : idx >= 2 ? "bg-[#D97706]" : "bg-[#059669]"
                                        : "bg-[#DFE3DC] border border-[#1E2229]/30"
                                }`} 
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-[#4B5565] mt-1.5 font-bold">
                        <span>PROTOCOLS: J1939 / ISO-TP</span>
                        <span>FIFO_BUFFER: 100 SLOTS</span>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="neo-btn px-2 py-1.5 text-[9px] font-mono font-bold flex items-center justify-center uppercase hover:bg-[#DFE3DC] disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 mr-1.5 ${isRefreshing ? "animate-spin text-[#2563EB]" : "text-[#2563EB]"}`} />
                        {isRefreshing ? "SYNCING..." : "RE-SYNC DDB"}
                    </button>
                    <button
                        onClick={onSimulateBurst}
                        className="neo-btn px-2 py-1.5 text-[9px] font-mono font-bold flex items-center justify-center uppercase hover:bg-[#DFE3DC]"
                        title="Simulate 5Hz adaptive CAN burst"
                    >
                        <Zap className="w-3 h-3 mr-1.5 text-[#D97706]" />
                        5HZ BURST
                    </button>
                </div>
            </div>
        </div>
    );
}
