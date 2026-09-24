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
        <div className="h-full flex flex-col">
            <div className="border-b-4 border-white bg-black px-4 py-2 flex justify-between items-center shrink-0">
                <div className="flex items-center text-white">
                    <Terminal className="w-4 h-4 mr-2" strokeWidth={3} />
                    <span className="text-xs uppercase font-heading tracking-widest">FIREHOSE_RX</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] text-[var(--color-accent-emerald)] space-y-1 bg-black">
                {fleet.length === 0 ? (
                    <div className="text-gray-500 font-bold uppercase mt-2">Awaiting connection...</div>
                ) : (
                    fleet.map((v, i) => (
                        <div key={`${v.vin}-${v.timestamp}-${i}`} className="break-all border-b border-gray-800 pb-1">
                            <span className="text-white">[{formatTimestamp(v.timestamp).split('T')[1]?.replace('Z', '') || formatTimestamp(v.timestamp)}]</span>{' '}
                            <span className="text-[var(--color-accent-amber)] font-bold">[{v.vin}]</span>{' '}
                            <span className={v.status === 'FAULT' ? 'text-[var(--color-accent-pink)] font-bold bg-white px-1' : v.status === 'WARN' ? 'text-[var(--color-accent-amber)] font-bold' : 'text-[var(--color-accent-emerald)]'}>
                                {v.status === 'FAULT' ? 'ERR' : 'OK'}
                            </span>{' '}
                            <span className="text-gray-400">
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
