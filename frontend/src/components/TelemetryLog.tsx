import React, { useEffect, useRef, useState } from 'react';
import { VehicleRecord } from '@/app/page';
import { Terminal, Pause, Play, Trash2, Download, Filter, HelpCircle } from 'lucide-react';

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
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
        const headers = 'Timestamp,VIN,Voltage,Current,MaxTemp,DeltaV,AnomalyScore,Status\n';
        const rows = displayLogs.map(v => 
            `"${formatTimestamp(v.timestamp)}","${v.vin}",${v.packVoltage},${v.packCurrent},${v.maxTemp},${v.deltaV},${v.score},"${v.status}"`
        ).join('\n');
        
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ohmnic-sqs-telemetry-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col bg-[#0A0C10] text-[#F3F4F6]">
            {/* Terminal Header */}
            <div className="border-b border-[#2A2E3D] bg-[#12141A] px-3.5 py-2 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5 text-[#06B6D4]" strokeWidth={2.5} />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#F3F4F6] font-bold">
                        FIREHOSE_RX // SQS QUEUE
                    </span>
                    <span className="text-[8px] font-mono bg-[#0D0F14] text-[#10B981] px-1.5 py-0.5 border border-[#10B981]/40">
                        {isPaused ? '⏸ PAUSED' : '● LIVE'}
                    </span>
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        title="About FIREHOSE_RX Telemetry Receiver"
                        className="text-[#64748B] hover:text-[#F3F4F6]"
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
                            title={filterByVin ? 'Showing only probed VIN. Click for ALL.' : 'Click to filter by probed VIN.'}
                            className={`px-2 py-0.5 text-[9px] font-mono font-bold border ${
                                filterByVin 
                                    ? 'bg-[#1C202B] text-[#06B6D4] border-[#06B6D4]' 
                                    : 'bg-[#161922] text-[#9CA3AF] border-[#2A2E3D] hover:text-[#F3F4F6]'
                            }`}
                        >
                            <Filter className="w-2.5 h-2.5 inline mr-1" />
                            {filterByVin ? selectedVin.split('-')[2] || 'VIN' : 'ALL_UNITS'}
                        </button>
                    )}

                    {/* Pause / Resume */}
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        title={isPaused ? 'Resume live stream' : 'Pause stream auto-scroll'}
                        className={`p-1 border ${
                            isPaused 
                                ? 'bg-[#F59E0B] text-black border-[#F59E0B]' 
                                : 'bg-[#161922] text-[#9CA3AF] border-[#2A2E3D] hover:text-[#F3F4F6]'
                        }`}
                    >
                        {isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                    </button>

                    {/* Clear */}
                    <button
                        onClick={handleClear}
                        title="Clear terminal buffer"
                        className="p-1 bg-[#161922] text-[#9CA3AF] border border-[#2A2E3D] hover:text-[#F3F4F6] hover:bg-[#1C202B]"
                    >
                        <Trash2 className="w-2.5 h-2.5" />
                    </button>

                    {/* Export CSV */}
                    <button
                        onClick={handleExportCSV}
                        title="Export logs to CSV"
                        className="p-1 bg-[#161922] text-[#9CA3AF] border border-[#2A2E3D] hover:text-[#F3F4F6] hover:bg-[#1C202B]"
                    >
                        <Download className="w-2.5 h-2.5" />
                    </button>
                </div>
            </div>

            {/* Explanation Banner */}
            {showHelp && (
                <div className="bg-[#12141A] border-b border-[#2A2E3D] p-2.5 text-[9px] font-mono text-[#9CA3AF] leading-relaxed">
                    <span className="text-[#06B6D4] font-bold">FIREHOSE_RX:</span> Live receiver (<span className="text-[#F3F4F6]">RX</span>) consuming raw CAN frames dispatched through AWS SQS and processed by Lambda microservices.
                </div>
            )}

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1 bg-[#0A0C10]">
                {filteredLogs.length === 0 ? (
                    <div className="text-[#64748B] font-mono text-[10px] uppercase mt-2 flex items-center space-x-2">
                        <span className="inline-block w-1.5 h-1.5 bg-[#06B6D4] animate-ping" />
                        <span>{filterByVin ? `Awaiting CAN frames for ${selectedVin}...` : 'Connecting to AWS SQS telemetry queue...'}</span>
                    </div>
                ) : (
                    filteredLogs.map((v, i) => (
                        <div key={`${v.vin}-${v.timestamp}-${i}`} className="break-all border-b border-[#161922] pb-1 hover:bg-[#12141A] transition-colors">
                            <span className="text-[#64748B]">
                                [{formatTimestamp(v.timestamp).split('T')[1]?.replace('Z', '') || formatTimestamp(v.timestamp)}]
                            </span>{' '}
                            <span className={`font-bold ${v.vin === selectedVin ? 'text-[#06B6D4] font-bold' : 'text-[#9CA3AF]'}`}>
                                [{v.vin}]
                            </span>{' '}
                            <span className={`px-1 text-[9px] font-bold ${
                                v.status === 'FAULT' 
                                    ? 'text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30' 
                                    : v.status === 'WARN' 
                                    ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30' 
                                    : 'text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30'
                            }`}>
                                {v.status === 'FAULT' ? 'ERR' : v.status === 'WARN' ? 'WRN' : 'OK'}
                            </span>{' '}
                            <span className="text-[#9CA3AF]">
                                {`{V:`}<span className="text-[#F3F4F6]">{v.packVoltage.toFixed(2)}V</span>{`, I:`}<span className="text-[#06B6D4]">{v.packCurrent.toFixed(1)}A</span>{`, T:`}<span className={v.maxTemp > 45 ? 'text-[#F59E0B]' : 'text-[#F3F4F6]'}>{v.maxTemp.toFixed(1)}°C</span>{`, dV:`}<span className="text-[#F3F4F6]">{(v.deltaV * 1000).toFixed(0)}mV</span>{`, H:`}<span className="text-[#10B981]">{(100 - (v.score * 100)).toFixed(1)}%</span>{`}`}
                            </span>
                        </div>
                    ))
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
}
