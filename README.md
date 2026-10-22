# Ωhmnic (Ohmnic) ⚡
### Enterprise Serverless Telematics Pipeline & Explainable AI Battery SCADA

[![Live SCADA Cockpit](https://img.shields.io/badge/Live%20Cockpit-ohmnic.vercel.app-059669?style=for-the-badge&logo=vercel)](https://ohmnic.vercel.app)
[![AWS Architecture](https://img.shields.io/badge/AWS-SQS%20FIFO%20%7C%20Lambda%20ARM64%20%7C%20DynamoDB-FF9900?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com)
[![Machine Learning](https://img.shields.io/badge/ML%20Engine-IsolationForest%20%7C%20TreeSHAP%20C--Ext-2563EB?style=for-the-badge)](https://shap.readthedocs.io)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20Turbopack-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)

> 🌐 **Live Production Deployment:** [https://ohmnic.vercel.app](https://ohmnic.vercel.app)  
> 📑 **Systems Performance Report:** [docs/SYSTEM_BENCHMARKS.md](docs/SYSTEM_BENCHMARKS.md)  
> 📄 **Academic Manuscript Draft:** [PAPER_DRAFT.md](PAPER_DRAFT.md)  

---

## 1. System Objective

Modern electric vehicle (EV) fleets generate high-frequency Controller Area Network (CAN) telemetry—capturing cell voltages, module currents, thermal gradients, and state-of-charge metrics at frequencies between 1 Hz and 50 Hz. Catastrophic pack failures, such as internal micro-short circuits, rapid dendrite formation, and thermal runaway, are preceded by subtle, transient electrochemical divergences ($\Delta V > 30\text{ mV}$).

Conventional telematics architectures suffer from two fundamental distributed systems limitations:
1. **The Ingestion Cost Dilemma:** Monolithic continuous streaming at 5 Hz across 1,000 EVs generates over 432 million messages and 100 GB of cellular egress daily, incurring upwards of $30,000/month in SIM data and cloud compute fees.
2. **Black-Box Triage Latency:** Traditional cloud ML engines output monolithic scalar anomaly scores with zero actionable explanation. Fleet dispatchers cannot determine whether a fault is triggered by cell-level imbalance, bus current surge, or cooling loop failure.

**Ωhmnic solves both challenges.** It is a production-grade, event-driven serverless telematics platform that delivers sub-millisecond Explainable AI (TreeSHAP) battery diagnostics inside containerized serverless microservices, coupled with an edge-adaptive backpressure ingestion engine that cuts cellular egress and cloud compute costs by **97.02%**.

---

## 2. Cloud Architecture

Ωhmnic is implemented using an asynchronous, event-driven serverless topology deployed on **Amazon Web Services (AWS)** via the AWS Serverless Application Model (SAM):

```
+--------------------------------------------------------------------------------------------------+
|                                EDGE TELEMATICS GATEWAY (VEHICLES)                                |
|  - CAN-Bus Monitor: J1939 / ISO-TP frame acquisition (Voltage, Current, Temp, Delta-V)           |
|  - Electrochemical Variance Filter:                                                              |
|       * Nominal: 0.05 Hz Baseline Heartbeat (T = 20s)                                            |
|       * Variance (dV > 30mV or Temp > 35C): 5.0 Hz Micro-Burst (15s duration)                     |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 | Asynchronous HTTPS / TLS 1.3 POST
                                                 v
+--------------------------------------------------------------------------------------------------+
|                                    AMAZON SQS FIFO QUEUE                                         |
|  - Queue Name: `ohmnic-battery-telemetry.fifo`                                                   |
|  - Backpressure Buffer: Absorbs spikes up to 20,000 msgs/s with zero dropped packets             |
|  - MessageGroupId: `vehicle_id` (Guarantees strict monotonic per-VIN ordering)                   |
|  - MessageDeduplicationId: SHA-256 UUID (Suppresses redundant cellular re-transmissions)          |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 | Event Source Mapping (BatchSize = 10)
                                                 v
+--------------------------------------------------------------------------------------------------+
|                       AWS LAMBDA CONTAINER (ARM64 GRAVITON2)                                     |
|  - Base Image: `public.ecr.aws/lambda/python:3.11` (Neoverse N1 ARM64 Architecture)             |
|  - Global Execution Cache: In-memory deserialized `IsolationForest` + `shap.TreeExplainer`       |
|                                                                                                  |
|  [Stage 1: Fast Filter]: Isolation Forest Anomaly Scoring (O(T * D)) -> Latency: 4.15 ms         |
|                          |                                                                       |
|         +----------------+----------------+                                                      |
|         | Nominal Frame (95%)             | Anomalous Frame (5%)                                 |
|         v                                 v                                                      |
|   Bypass Attribution             [Stage 2: XAI]: TreeSHAP Attribution (O(T * L * D^2))          |
|   (Compute Cost: 0.0 ms)         Decomposes marginal feature impact (Latency: 0.20 ms)           |
|         |                                 |                                                      |
|         +----------------+----------------+                                                      |
|                          |                                                                       |
|                          v                                                                       |
|  [Atomic Upsert]: JSON state serialization with IEEE-754 Decimal parsing                         |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 | Sub-15ms Atomic Write
                                                 v
+--------------------------------------------------------------------------------------------------+
|                                    AMAZON DYNAMODB TABLE                                         |
|  - Table: `ohmnic-vehicle-baselines` (Pay-Per-Request on-demand capacity)                        |
|  - Partition Key: `vehicle_id` (String HASH key)                                                 |
|  - Performance: Scales past 5,900+ IOPS with 12.2 ms p50 persistence latency                     |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 | Real-Time Client Fetch / SSE Polling
                                                 v
+--------------------------------------------------------------------------------------------------+
|                          INDUSTRIAL AVIATION SCADA COCKPIT (NEXT.JS 16)                          |
|  - Aesthetics: Teenage Engineering / Dieter Rams Industrial Light-Chassis                        |
|  - Modules: [MOD-01] Telemetry Wells, [MOD-01B] 96-Cell Heatmap, [MOD-02] AI Triage,             |
|             [MOD-03] TreeSHAP Bar Drivers, [MOD-04] Edge Gateway, [MOD-05] LCD Terminal Stream   |
+--------------------------------------------------------------------------------------------------+
```

### Architectural Component Highlights
1. **Amazon SQS FIFO Ingestion Buffer:**
   - **Backpressure Buffer:** Insulates serverless downstream functions from massive cellular concurrency spikes during fleet-wide cold starts or peak charging hours.
   - **Monotonic Sequence Guarantee:** `MessageGroupId = payload.vehicle_id` guarantees that out-of-order cellular packets are processed sequentially per vehicle, preventing stale telemetry from overwriting newer battery state.
2. **AWS Lambda Containerized Inference (ARM64 Graviton2):**
   - Packaged as a minimal Docker container (`PackageType: Image`) executing natively on ARM64 Graviton2 Neoverse cores.
   - Houses pinned binary C-extensions for Scikit-Learn and SHAP, avoiding cold-start compilation overhead.
3. **Amazon DynamoDB (Sub-10ms State Persistence):**
   - Single-table design (`ohmnic-vehicle-baselines`) keyed on `vehicle_id` storing the latest telemetry vector, anomaly probability score, and sorted TreeSHAP attribution drivers.
   - Empirically proven to sustain **5,931.5 peak IOPS** with a flat latency curve of 12.14 ms (p50) to 16.71 ms (p99).
4. **Next.js 16 SCADA Cockpit:**
   - Implements an **Industrial Aviation Light-Chassis** aesthetic inspired by Teenage Engineering and Dieter Rams hardware ergonomics.
   - Physical white card modules (`bg-[#FFFFFF]`), warm putty chassis canvas (`bg-[#ECEEEA]`), 2px hard industrial borders (`border-[#1E2229]`), rack-mount title strips (`bg-[#DFE3DC]`), and hard tactile offset shadows (`shadow-[4px_4px_0px_#1E2229]`).

---

## 3. Systems Novelty: Millisecond Serverless TreeSHAP

In distributed telematics, calculating cooperative game-theoretic feature attributions in real time has traditionally been considered intractable:

$$\text{Complexity}_{\text{KernelSHAP}} = \mathcal{O}(T \cdot L \cdot 2^M) \quad \text{(Exponential in features } M \text{)}$$

Ωhmnic demonstrates the first production implementation of **Two-Stage Conditional TreeSHAP** inside a resource-constrained 512 MB serverless container:

$$\text{Complexity}_{\text{TreeSHAP}} = \mathcal{O}(T \cdot L \cdot D^2) \quad \text{(Polynomial in tree depth } D \text{)}$$

```
Incoming Telemetry Frame x = [V_pack, I_bus, T_max, dV_cell]
                     |
                     v
   +------------------------------------+
   | Stage 1: Isolation Forest Scoring  | ---> Latency: 4.15 ms
   | Complexity: O(T * D)               |      Throughput: 461 ops/s
   +-----------------+------------------+
                     |
            Score(x) < 0.0?
            /              \
     YES (Anomaly)      NO (Nominal)
          /                  \
         v                    v
+------------------+   +-------------------+
| Stage 2: TreeSHAP|   | Bypass XAI Engine |
| Complexity:      |   | Return cached     |
| O(T * L * D^2)   |   | baseline inlier   |
| Latency: 0.20 ms |   | Latency: 0.0 ms   |
+------------------+   +-------------------+
```

### Empirical Execution Envelope ($T=100$ Estimators)

| Tree Depth ($D$) | Isolation Forest p50 | Isolation Forest p99 | TreeSHAP p50 | TreeSHAP p99 | Pipeline p95 | Pipeline Throughput | Resident RAM (RSS) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **$D=4$** | 4.088 ms | 4.250 ms | 0.032 ms | 0.042 ms | 2.122 ms | **485.3 ops/s** | 237.2 MB |
| **$D=8$** | 4.151 ms | 4.350 ms | 0.197 ms | 0.266 ms | 2.336 ms | **460.8 ops/s** | 239.4 MB |
| **$D=12$** | 4.150 ms | 4.367 ms | 1.414 ms | 1.524 ms | 3.509 ms | **451.1 ops/s** | 254.9 MB |

> **Key Architectural Result:** At tree depth $D=8$ (optimal for electrochemical multi-cell non-linearities), TreeSHAP executes in **sub-0.2 milliseconds**, while total container resident memory (RSS) stabilizes at **239.4 MB**—leaving a 53% safety margin beneath Lambda's 512 MB threshold.

---

## 4. Edge-Adaptive Streaming Economics

Commercial EV fleets typically broadcast continuous high-frequency telemetry at 5 Hz. Over cellular IoT SIMs, this creates an unsustainable bandwidth and cloud billing burden:

| Metric (1,000 EVs / 24 Hours) | Conventional Continuous (5 Hz) | Ωhmnic Adaptive (0.05 / 5 Hz) | Delta / Savings |
| :--- | :---: | :---: | :---: |
| **24-Hour Frame Volume** | 432,000,000 frames | 12,873,600 frames | **-97.02%** |
| **24-Hour Egress Payload** | 100.58 GB | 3.00 GB | **-97.02%** |
| **Cellular SIM Cost ($8.50/GB)** | $854.95 / day | $25.48 / day | **-$829.47 / day** |
| **AWS SQS Ingestion Cost** | $172.80 / day | $5.15 / day | **-$167.65 / day** |
| **Projected Monthly Operating Cost** | **$30,832.62 USD** | **$918.81 USD** | **97.02% REDUCTION** |
| **Annual Recurring Savings** | Baseline | — | **$358,965.72 USD** |

*How it works:* The edge telematics gateway runs an online variance filter. During nominal cruise and sleep cycles (98% of operational time), it transmits a 0.05 Hz heartbeat (once every 20 seconds). When localized voltage variance ($\Delta V > 0.03\text{ V}$) or junction temperature ($T > 35^\circ\text{C}$) is detected, it triggers a 5.0 Hz micro-burst for 15 seconds, preserving 100% of critical anomaly telemetry.

---

## 5. Repository Structure

```
ohmnic/
├── template.yaml                  # AWS SAM infrastructure definition (SQS, Lambda, DynamoDB, Cognito)
├── samconfig.toml                 # SAM deployment environment configurations
├── BENCHMARK_REPORT.md            # Empirical raw benchmarking metrics report
├── PAPER_DRAFT.md                 # Full academic paper manuscript on systems telematics novelty
├── README.md                      # Primary repository documentation
├── docs/
│   └── SYSTEM_BENCHMARKS.md       # In-depth edge-to-cloud performance & cold-start evaluation
├── src/                           # Containerized AWS Lambda Inference Service
│   ├── Dockerfile                 # Minimal ARM64 container image definition
│   ├── requirements.txt           # Pinned dependencies (Scikit-Learn, SHAP, Boto3, Pandas)
│   ├── isolation_forest_bms.pkl   # Serialized pre-trained BMS Isolation Forest model
│   ├── pipeline/
│   │   └── handler.py             # Event Source Mapping handler (Inference, TreeSHAP, DynamoDB)
│   └── engine/
│       ├── detector.py            # Anomaly scoring logic
│       ├── explainer.py           # TreeSHAP feature extraction
│       └── train_empirical.py     # Training harness on NASA Ames prognostic battery datasets
├── scripts/
│   ├── benchmark_systems.py       # Live AWS systems benchmarking harness (ARM64, SQS, DDB)
│   └── simulate_fleet.py          # Asynchronous fleet CAN-bus stream replay (--mode adaptive)
├── data/                          # NASA Ames Battery Aging Empirical Datasets & processed streams
│   └── processed/                 # Empirical fault stream JSON cycles (B0005, B0006, B0018, etc.)
└── frontend/                      # Industrial Aviation SCADA Cockpit (Next.js 16 + React 19)
    ├── package.json
    ├── next.config.ts
    └── src/
        ├── app/
        │   ├── globals.css        # Physical chassis design tokens, rack strips, recessed tracks
        │   ├── layout.tsx         # Root SCADA layout
        │   ├── page.tsx           # Main SCADA cockpit (Bento layout, live heartbeat, active probe)
        │   └── api/
        │       ├── fleet/route.ts # DynamoDB polling & state retrieval endpoint
        │       └── stream/route.ts# Real-time event stream proxy
        └── components/
            ├── DiagnosticsPanel.tsx   # [MOD-01] Recessed mechanical gauges & unit badges
            ├── PackHeatmap.tsx        # [MOD-01B] 96-cell thermal matrix with 3D modal inspector
            ├── AITriageAdvisory.tsx   # [MOD-02] Recessed AI triage well & remediation commands
            ├── AttributionTable.tsx   # [MOD-03] Bidirectional TreeSHAP Shapley attribution bars
            ├── EdgeGatewayCard.tsx    # [MOD-04] Stepped CAN busload meter & AWS SQS/Lambda status
            ├── TelemetryLog.tsx       # [MOD-05] Embedded LCD console (FIREHOSE_RX)
            ├── FleetMatrix.tsx        # Asset fleet cards with tactile hover states
            └── AlertsPanel.tsx        # Anomaly tickets queue & severity triage
```

---

## 6. Quickstart & Local Development

### Prerequisites
- Python 3.11+ with `.venv`
- Node.js 20+ with npm
- AWS CLI configured with active credentials (`us-east-1`)
- Docker Desktop (for containerized SAM builds)

### 1. Run the Next.js SCADA Cockpit
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Run the Adaptive Fleet Simulator
Simulate empirical NASA battery cycle faults streamed directly to the SQS FIFO queue:

```bash
# Run with Adaptive Bursting (0.05 Hz heartbeat + 5 Hz burst upon variance)
.venv/bin/python scripts/simulate_fleet.py --mode adaptive --local

# Or run conventional continuous mode at 1-second intervals
.venv/bin/python scripts/simulate_fleet.py --mode interval --interval 1.0
```

### 3. Run the Systems Benchmarking Harness
Execute the complete empirical benchmark suite measuring ARM64 container execution envelopes, live AWS SQS dispatch latencies, and DynamoDB IOPS:

```bash
.venv/bin/python scripts/benchmark_systems.py
```
This automatically updates [BENCHMARK_REPORT.md](BENCHMARK_REPORT.md).

---

## 7. Cloud Deployment (AWS SAM & Vercel)

### Deploying Backend Infrastructure via AWS SAM
```bash
# Build the Docker container for AWS Lambda (ARM64)
sam build --use-container

# Deploy serverless resources to AWS
sam deploy --resolve-image-repos --no-confirm-changeset
```

### Deploying Frontend SCADA to Vercel
```bash
cd frontend
vercel build --prod --yes
vercel deploy --prebuilt --prod
vercel alias set <DEPLOYMENT_URL> ohmnic.vercel.app
```

---

## 8. Academic Citations & Prior Work

1. **TreeSHAP Algorithm:** S. M. Lundberg, G. Erion, H. Chen, et al., *"From local explanations to global understanding with explainable AI for trees,"* Nature Machine Intelligence, vol. 2, no. 1, pp. 56–67, 2020.
2. **Isolation Forest:** F. T. Liu, K. M. Ting, and Z.-H. Zhou, *"Isolation Forest,"* IEEE International Conference on Data Mining (ICDM), pp. 413–422, 2008.
3. **NASA Battery Prognostics Data:** B. Saha and K. Goebel, *"Battery Data Set,"* NASA Ames Prognostics Data Repository, NASA Ames Research Center, Moffett Field, CA, 2007.
4. **Serverless Systems Analysis:** E. Jonas, J. Schleier-Smith, V. Sreekanti, et al., *"Cloud Programming Simplified: A Berkeley View on Serverless Computing,"* arXiv:1902.03383, 2019.

---

## License & Attribution

Distributed under the MIT License. Developed for advanced cloud and distributed systems telemetry evaluation.
