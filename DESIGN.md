---
version: 1.0.0
name: "Ωhmnic Design System"
description: "Dark-mode Pendo-adapted design tokens for EV battery diagnostics."

colors:
  canvas: "#0B0C0E"
  surface-card: "#16181D"
  surface-card-hover: "#1F232B"
  surface-deep: "#111317"
  border-subtle: "#242933"
  text-primary: "#F3F4F6"
  text-secondary: "#9CA3AF"
  text-muted: "#6B7280"
  accent-pank: "#ff4876"        # Critical alerts, high ΔV, SHAP anomaly weight
  accent-amber: "#F5A623"       # Degradation warnings, C-rate alerts
  accent-emerald: "#10B981"     # Nominal baseline health
  accent-cyan: "#06B6D4"        # Real-time streaming metrics

typography:
  display-xl: "Sora, sans-serif"
  heading-lg: "Sora, sans-serif"
  body-md: "Inter, sans-serif"
  code-stream: "JetBrains Mono, monospace"

rounded:
  card: "20px"
  pill: "50px"
---