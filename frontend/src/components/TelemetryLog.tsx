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

    // Maintain buffer, respecting pause state
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
        a.download = `ohmnic-telemetry-firehose-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col bg-black">
            {/* Terminal Header */}
            <div className="border-b-4 border-white bg-black px-3 py-1.5 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-2 text-white">
                    <Terminal className="w-4 h-4 text-[var(--color-accent-emerald)]" strokeWidth={3} />
                    <span className="text-xs uppercase font-heading tracking-widest text-white">
                        FIREHOSE_RX
                    </span>
                    <span className="hidden sm:inline-block text-[8px] font-mono bg-zinc-800 text-[var(--color-accent-emerald)] px-1.5 py-0.5 border border-zinc-700">
                        {isPaused ? '⏸ PAUSED' : '● STREAMING'}
                    </span>
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        title="What is FIREHOSE_RX?"
                        className="text-gray-400 hover:text-white"
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Toolbar Controls */}
                <div className="flex items-center space-x-1">
                    {/* VIN Filter Toggle */}
                    {selectedVin && (
                        <button
                            onClick={() => setFilterByVin(!filterByVin)}
                            title={filterByVin ? 'Showing only probed VIN. Click for ALL.' : 'Click to filter by probed VIN.'}
                            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold border ${
                                filterByVin 
                                    ? 'bg-[var(--color-accent-amber)] text-black border-white' 
                                    : 'bg-zinc-800 text-gray-300 border-zinc-700 hover:text-white'
                            }`}
                        >
                            <Filter className="w-2.5 h-2.5 inline mr-1" />
                            {filterByVin ? selectedVin.split('-')[2] || 'VIN' : 'ALL'}
                        </button>
                    )}

                    {/* Pause / Resume */}
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        title={isPaused ? 'Resume live stream' : 'Pause stream auto-scroll'}
                        className={`p-1 border ${isPaused ? 'bg-[var(--color-accent-pink)] text-white border-white' : 'bg-zinc-800 text-gray-300 border-zinc-700 hover:text-white'}`}
                    >
                        {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    </button>

                    {/* Clear */}
                    <button
                        onClick={handleClear}
                        title="Clear terminal buffer"
                        className="p-1 bg-zinc-800 text-gray-300 border border-zinc-700 hover:text-white hover:bg-zinc-700"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Export CSV */}
                    <button
                        onClick={handleExportCSV}
                        title="Export logs to CSV"
                        className="p-1 bg-zinc-800 text-gray-300 border border-zinc-700 hover:text-white hover:bg-zinc-700"
                    >
                        <Download className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Explanation Banner */}
            {showHelp && (
                <div className="bg-zinc-900 border-b border-zinc-700 p-2 text-[10px] font-mono text-zinc-300 leading-tight">
                    <span className="text-[var(--color-accent-amber)] font-bold">FIREHOSE_RX</span> = Real-time Receiver (<span className="text-white">RX</span>) ingesting unthrottled (<span className="text-white">Firehose</span>) CAN-bus telemetry broadcast frames directly from vehicle BMS ECUs.
                </div>
            )}

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] text-[var(--color-accent-emerald)] space-y-1 bg-black">
                {filteredLogs.length === 0 ? (
                    <div className="text-gray-500 font-bold uppercase mt-2 flex items-center space-x-2">
                        <span className="inline-block w-2 h-2 bg-[var(--color-accent-amber)] animate-ping" />
                        <span>{filterByVin ? `Awaiting telemetry frames for ${selectedVin}...` : 'Awaiting connection to AWS Firehose...'}</span>
                    </div>
                ) : (
                    filteredLogs.map((v, i) => (
                        <div key={`${v.vin}-${v.timestamp}-${i}`} className="break-all border-b border-zinc-900 pb-1 hover:bg-zinc-900/60 transition-colors">
                            <span className="text-zinc-500">
                                [{formatTimestamp(v.timestamp).split('T')[1]?.replace('Z', '') || formatTimestamp(v.timestamp)}]
                            </span>{' '}
                            <span className={`font-bold ${v.vin === selectedVin ? 'text-[var(--color-accent-cyan)] underline' : 'text-[var(--color-accent-amber)]'}`}>
                                [{v.vin}]
                            </span>{' '}
                            <span className={v.status === 'FAULT' ? 'text-black bg-[var(--color-accent-pink)] font-black px-1' : v.status === 'WARN' ? 'text-black bg-[var(--color-accent-amber)] font-bold px-1' : 'text-[var(--color-accent-emerald)]'}>
                                {v.status === 'FAULT' ? 'ERR' : v.status === 'WARN' ? 'WRN' : 'OK'}
                            </span>{' '}
                            <span className="text-zinc-400">
                                {`{V:${v.packVoltage.toFixed(2)}V, I:${v.packCurrent.toFixed(1)}A, T:${v.maxTemp.toFixed(1)}°C, dV:${(v.deltaV * 1000).toFixed(0)}mV, H:${(100 - (v.score * 100)).toFixed(1)}%}`}
                            </span>
                        </div>
                    ))
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
}
