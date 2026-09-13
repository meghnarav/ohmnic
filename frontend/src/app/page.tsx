import React from 'react';

export default function Dashboard() {
  return (
    <main className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display-xl tracking-tight">Ωhmnic Fleet Ops</h1>
          <p className="text-text-secondary mt-1 font-body-md">Per-vehicle adaptive battery health monitoring</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-surface-card border border-border-subtle px-4 py-2 rounded-pill shadow-sm">
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse"></span>
            <span className="text-sm font-medium text-text-primary">System Nominal</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Telemetry Stream */}
        <section className="lg:col-span-2 bg-surface-card rounded-card border border-border-subtle p-6 hover:bg-surface-card-hover transition-colors">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-heading-lg">Active Telemetry</h2>
            <span className="bg-accent-pank/10 text-accent-pank border border-accent-pank/20 px-3 py-1 rounded-pill text-xs font-semibold">
              CRITICAL ANOMALY
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-surface-deep rounded-card border border-border-subtle">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Vehicle ID</p>
                <p className="font-code-stream text-sm">EV-X7-902</p>
              </div>
              <div className="p-4 bg-surface-deep rounded-card border border-border-subtle">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">State of Charge</p>
                <p className="font-code-stream text-accent-emerald text-sm">78.4%</p>
              </div>
              <div className="p-4 bg-surface-deep rounded-card border border-border-subtle">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Pack Temp</p>
                <p className="font-code-stream text-accent-amber text-sm">42.1°C</p>
              </div>
              <div className="p-4 bg-surface-deep rounded-card border border-border-subtle border-accent-pank/30">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Max ΔV</p>
                <p className="font-code-stream text-accent-pank text-sm font-bold">142mV</p>
              </div>
            </div>
            
            <div className="h-48 bg-surface-deep rounded-card border border-border-subtle flex items-center justify-center">
              {/* Placeholder for chart */}
              <p className="text-text-muted font-code-stream text-sm">[Telemetry Streaming Chart Rendered Here]</p>
            </div>
          </div>
        </section>

        {/* Explainability (SHAP) Panel */}
        <section className="bg-surface-card rounded-card border border-border-subtle p-6 hover:bg-surface-card-hover transition-colors">
          <h2 className="text-xl font-heading-lg mb-6">Anomaly Attribution</h2>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-code-stream text-text-primary">cell_voltage_delta</span>
                <span className="text-accent-pank font-bold">78%</span>
              </div>
              <div className="w-full bg-surface-deep rounded-full h-2">
                <div className="bg-accent-pank h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-code-stream text-text-primary">max_cell_temp_c</span>
                <span className="text-accent-amber font-bold">14%</span>
              </div>
              <div className="w-full bg-surface-deep rounded-full h-2">
                <div className="bg-accent-amber h-2 rounded-full" style={{ width: '14%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-code-stream text-text-primary">pack_current</span>
                <span className="text-accent-cyan font-bold">8%</span>
              </div>
              <div className="w-full bg-surface-deep rounded-full h-2">
                <div className="bg-accent-cyan h-2 rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-accent-pank/5 border border-accent-pank/20 rounded-card">
            <h3 className="text-accent-pank text-sm font-semibold mb-2">Diagnostic Insight</h3>
            <p className="text-text-secondary text-sm">
              Kernel SHAP indicates the Isolation Forest flagged this vehicle primarily due to extreme cell voltage divergence (142mV) under high thermal load.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
