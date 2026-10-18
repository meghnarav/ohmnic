import React, { useEffect, useRef, useState } from "react";
import { VehicleRecord } from "@/app/page";
import { Terminal, Pause, Play, Trash2, Download, Filter, HelpCircle } from "lucide-react";

function formatTimestamp(ts: string | number | undefined): string {
    if (!ts) return new Date().toISOString();
    const date = new Date(ts);
    if (!isNaN(date.getTime())) return date.toISOString();
    const dateFromSec = new Date(Number(ts) * 1000);
    if (!isNaN(dateFromSec.getTime())) return dateFromSec.toISOString();
    return String(ts);
}

interface TelemetryLogProps {
    fleet: VehicleRecord[];
    selectedVin?: string | null;
}

export default function TelemetryLog({ fleet, selectedVin }: TelemetryLogProps) {
    const logEndRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [filterByVin, setFilterByVin] = useState<boolean>(false);
    const [displayLogs, setDisplayLogs] = useState<VehicleRecord[]>([]);
    const [showHelp, setShowHelp] = useState<boolean>(false);

    useEffect(() => {
        if (!isPaused) {
            setDisplayLogs(fleet);
        }
    }, [fleet, isPaused]);

    useEffect(() => {
        if (!isPaused && logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [displayLogs, isPaused]);

    const filteredLogs = filterByVin && selectedVin
        ? displayLogs.filter(v => v.vin === selectedVin)
        : displayLogs;

    const handleClear = () => {
        setDisplayLogs([]);
    };

    const handleExportCSV = () => {
        if (displayLogs.length === 0) return;
        const headers = "Timestamp,VIN,Voltage,Current,MaxTemp,DeltaV,AnomalyScore,Status\n";
        const rows = displayLogs.map(v => 
            `\"${formatTimestamp(v.timestamp)}\",\"${v.vin}\",${v.packVoltage},${v.packCurrent},${v.maxTemp},${v.deltaV},${v.score},\"${v.status}\"`
        ).join("\n");
        
        const blob = new Blob([headers + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ohmnic-telematics-sqs-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col bg-[#FFFFFF] text-[#0F131A]">
            {/* Titlebar Rack Strip */}
            <div className="bg-[#DFE3DC] px-3 py-1.5 border-b-2 border-[#1E2229] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-[#1E2229] bg-white px-1.5 py-0.5 border border-[#1E2229]">
                        [MOD-05]
                    </span>
                    <span className="text-xs font-mono font-black uppercase tracking-widest text-[#1E2229]">
                        RAW CAN TELEMETRY STREAM
                    </span>
                    <span className="text-[8px] font-mono bg-white text-[#059669] px-2 py-0.5 border border-[#1E2229] font-bold">
                        {isPaused ? "⏸ PAUSED" : "● SQS_STREAM"}
                    </span>
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        title="About SQS Stream Receiver"
                        className="text-[#4B5565] hover:text-[#0F131A]"
                    >
                        <HelpCircle className="w-3 h-3" />
                    </button>
                </div>

                {/* Toolbar Controls */}
                <div className="flex items-center space-x-1.5">
                    {/* VIN Filter Toggle */}
                    {selectedVin && (
                        <button
                            onClick={() => setFilterByVin(!filterByVin)}
                            title={filterByVin ? "Showing only probed VIN. Click for ALL." : "Click to filter by probed VIN."}
                            className={`px-2 py-0.5 text-[9px] font-mono font-bold border border-[#1E2229] ${
                                filterByVin 
                                    ? "bg-[#DFE3DC] text-[#1E2229]" 
                                    : "bg-white text-[#4B5565] hover:bg-[#ECEEEA]"
                            }`}
                        >
                            <Filter className="w-2.5 h-2.5 inline mr-1 text-[#2563EB]" />
                            {filterByVin ? selectedVin.split("-")[2] || "VIN" : "ALL_UNITS"}
                        </button>
                    )}

                    {/* Pause / Resume */}
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        title={isPaused ? "Resume live stream" : "Pause stream auto-scroll"}
                        className={`p-1 border border-[#1E2229] ${
                            isPaused 
                                ? "bg-[#D97706] text-white" 
                                : "bg-white text-[#1E2229] hover:bg-[#ECEEEA]"
                        }`}
                    >
                        {isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                    </button>

                    {/* Clear */}
                    <button
                        onClick={handleClear}
                        title="Clear terminal buffer"
                        className="p-1 bg-white text-[#1E2229] border border-[#1E2229] hover:bg-[#ECEEEA]"
                    >
                        <Trash2 className="w-2.5 h-2.5" />
                    </button>

                    {/* Export CSV */}
                    <button
                        onClick={handleExportCSV}
                        title="Export logs to CSV"
                        className="p-1 bg-white text-[#1E2229] border border-[#1E2229] hover:bg-[#ECEEEA]"
                    >
                        <Download className="w-2.5 h-2.5" />
                    </button>
                </div>
            </div>

            {/* Explanation Banner */}
            {showHelp && (
                <div className="bg-[#ECEEEA] border-b-2 border-[#1E2229] p-2 text-[9px] font-mono text-[#4B5565] leading-tight font-semibold">
                    <span className="text-[#0F131A] font-bold">STREAM_RX:</span> Client receiver consuming raw edge CAN-bus frames dispatched through AWS SQS FIFO queue with deduplication and vehicle ID partitioning.
                </div>
            )}

            {/* Embedded Dark LCD Screen Console */}
            <div className="flex-1 m-2 border-2 border-[#1E2229] bg-[#181C24] p-3 overflow-y-auto font-mono text-xs space-y-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
                {filteredLogs.length === 0 ? (
                    <div className="text-[#10B981] font-mono text-xs uppercase flex items-center space-x-2">
                        <span className="inline-block w-2 h-2 bg-[#10B981] animate-ping" />
                        <span>{filterByVin ? `Awaiting CAN frames for ${selectedVin}...` : "Connecting to AWS SQS telemetry queue..."}</span>
                    </div>
                ) : (
                    filteredLogs.map((v, i) => (
                        <div key={`${v.vin}-${v.timestamp}-${i}`} className="break-all border-b border-[#232936] pb-1 hover:bg-[#202530] transition-colors leading-relaxed">
                            <span className="text-[#64748B]">
                                [{formatTimestamp(v.timestamp).split("T")[1]?.replace("Z", "") || formatTimestamp(v.timestamp)}]
                            </span>{" "}
                            <span className={`font-bold ${v.vin === selectedVin ? "text-[#38BDF8] font-black" : "text-[#94A3B8]"}`}>
                                [{v.vin}]
                            </span>{" "}
                            <span className={`px-1 text-[9px] font-bold ${
                                v.status === "FAULT" 
                                    ? "text-[#EF4444] bg-[#EF4444]/20 border border-[#EF4444]" 
                                    : v.status === "WARN" 
                                    ? "text-[#F59E0B] bg-[#F59E0B]/20 border border-[#F59E0B]" 
                                    : "text-[#10B981] bg-[#10B981]/20 border border-[#10B981]"
                            }`}>
                                {v.status === "FAULT" ? "ERR" : v.status === "WARN" ? "WRN" : "OK"}
                            </span>{" "}
                            <span className="text-[#10B981]">
                                {`{V:`}<span className="text-white font-black">{v.packVoltage.toFixed(2)}V</span>{`, I:`}<span className="text-[#38BDF8] font-bold">{v.packCurrent.toFixed(1)}A</span>{`, T:`}<span className={v.maxTemp > 45 ? "text-[#F59E0B] font-bold" : "text-white font-bold"}>{v.maxTemp.toFixed(1)}°C</span>{`, dV:`}<span className="text-white font-bold">{(v.deltaV * 1000).toFixed(0)}mV</span>{`, H:`}<span className="text-[#10B981] font-bold">{(100 - (v.score * 100)).toFixed(1)}%</span>{`}`}
                            </span>
                        </div>
                    ))
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
}
