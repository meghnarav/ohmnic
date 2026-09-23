import React, { useEffect, useRef } from 'react';
import { VehicleRecord } from '@/app/page';

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

    // Auto-scroll to the bottom when new logs arrive
    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [fleet]);

    return (
        <div className="h-full flex flex-col bg-[#08090A] border border-[#242933] rounded overflow-hidden">
            <div className="bg-[#0E1013] border-b border-[#242933] px-3 py-1 flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">SQS INGESTION FIREHOSE</span>
                <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#ff4876]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#F5A623]"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] text-gray-400 space-y-1">
                {fleet.length === 0 ? (
                    <div className="text-gray-600 italic">Listening for telemetry streams...</div>
                ) : (
                    fleet.map((v, i) => (
                        <div key={`${v.vin}-${v.timestamp}-${i}`} className="break-all border-b border-[#16181D] pb-1">
                            <span className="text-emerald-500">[{formatTimestamp(v.timestamp)}]</span>{' '}
                            <span className="text-[#06B6D4]">INFO</span>{' '}
                            <span className="text-gray-300">VIN:{v.vin}</span>{' '}
                            {' => '} {`{"packVoltage":${v.packVoltage},"packCurrent":${v.packCurrent},"maxTemp":${v.maxTemp},"deltaV":${v.deltaV},"status":"${v.status}","score":${v.score}}`}
                        </div>
                    ))
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
}
