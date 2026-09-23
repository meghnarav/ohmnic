import React, { useEffect, useRef } from 'react';
import { VehicleRecord } from '@/app/page';
import { Terminal } from 'lucide-react';

function formatTimestamp(ts: string | number | undefined): string {
  if (!ts) return new Date().toISOString();
  const date = new Date(ts);
  if (!isNaN(date.getTime())) return date.toISOString();
  const dateFromSec = new Date(Number(ts) * 1000);
  if (!isNaN(dateFromSec.getTime())) return dateFromSec.toISOString();
  return String(ts);
}

export default function TelemetryLog({ fleet }: { fleet: VehicleRecord[] }) {
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [fleet]);

    return (
        <div className="glass-card h-full flex flex-col rounded-xl overflow-hidden border-white/5">
            <div className="bg-black/40 border-b border-white/5 px-4 py-2 flex justify-between items-center">
                <div className="flex items-center text-gray-400">
                    <Terminal className="w-3 h-3 mr-2" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Raw Ingestion Firehose</span>
                </div>
                <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent-pink)] shadow-[0_0_5px_var(--color-accent-pink)] animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent-amber)] shadow-[0_0_5px_var(--color-accent-amber)] animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent-emerald)] shadow-[0_0_5px_var(--color-accent-emerald)] animate-pulse" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] text-gray-400 space-y-1 bg-black/60">
                {fleet.length === 0 ? (
                    <div className="text-gray-600 italic mt-2 ml-2">Listening for streaming telemetry on port 8080...</div>
                ) : (
                    fleet.map((v, i) => (
                        <div key={`${v.vin}-${v.timestamp}-${i}`} className="break-all border-b border-white/5 pb-1 animate-slide-in">
                            <span className="text-[var(--color-accent-cyan)]">[{formatTimestamp(v.timestamp).split('T')[1]?.replace('Z', '') || formatTimestamp(v.timestamp)}]</span>{' '}
                            <span className="text-gray-500">[{v.vin}]</span>{' '}
                            <span className={v.status === 'FAULT' ? 'text-[var(--color-accent-pink)] font-bold' : v.status === 'WARN' ? 'text-[var(--color-accent-amber)]' : 'text-[var(--color-accent-emerald)]'}>
                                {v.status === 'FAULT' ? 'ERR' : 'OK'}
                            </span>{' '}
                            <span className="text-gray-300">
                                {`{V:${v.packVoltage.toFixed(1)}, I:${v.packCurrent.toFixed(1)}, T:${v.maxTemp.toFixed(1)}, dV:${v.deltaV.toFixed(1)}, S:${(100 - (v.score*100)).toFixed(1)}%}`}
                            </span>
                        </div>
                    ))
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
}
