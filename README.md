# Ωhmnic (Ohmnic) 🔋

Ωhmnic is an enterprise-grade, real-time Electric Vehicle (EV) battery health monitoring and Explainable AI (XAI) diagnostics platform. It replaces generic black-box anomaly scores with precise, frame-by-frame mathematical feature attribution (TreeSHAP).

## Core Features
* **Real-time Ingestion Firehose**: Simulated EV fleet and empirical NASA dataset streaming via AWS SQS FIFO.
* **Serverless Machine Learning**: Dockerized AWS Lambda backend running a pre-trained `scikit-learn` Isolation Forest anomaly detection model.
* **Millisecond XAI (TreeSHAP)**: Calculates Shapley Additive exPlanations on-the-fly to pinpoint exactly *why* a battery is failing (e.g. thermal runaway vs. cell voltage drift).
* **Premium Glassmorphic Dashboard**: A high-performance Next.js React frontend rendering automated AI Triage Advisories and thermal matrices.

---

## System Architecture

```text
+------------------------------------+
|  1. Live EV Fleet Telemetry        |
|  (scripts/simulate_fleet.py)       |
|  NASA Cell & EV Pack Cycles Stream |
+-----------------+------------------+
                  |
                  v (Boto3 HTTPS)
+-----------------+------------------+
|  2. AWS SQS FIFO Queue             |
|  (ohmnic-battery-telemetry.fifo)   |
+-----------------+------------------+
                  |
                  v (Event Trigger)
+-----------------+------------------+
|  3. AWS Lambda Container           |
|  - isolation_forest_bms.pkl        |
|  - shap.TreeExplainer              |
+-----------------+------------------+
                  |
                  v (Upsert Results)
+-----------------+------------------+
|  4. AWS DynamoDB Table             |
|  (ohmnic-vehicle-baselines)        |
+-----------------+------------------+
                  |
                  v (REST Polling)
+-----------------+------------------+
|  5. Next.js React Dashboard        |
|  (SCADA Glassmorphic Interface)    |
+------------------------------------+
```

## Setup & Deployment

### 1. Backend Infrastructure (AWS SAM)
The backend is deployed via the AWS Serverless Application Model (SAM). The Lambda function requires a Docker image (`PackageType: Image`) because modern ML libraries (like SciPy and NumPy) require specific C-compiler environments that standard zip deployments lack.

```bash
# Build the Docker container for Lambda
sam build --use-container

# Deploy to AWS
sam deploy --resolve-image-repos --no-confirm-changeset
```

### 2. Fleet Telemetry Simulation
The system supports both single-cell (NASA Battery Dataset) and full pack-level synthetic telemetry. 

```bash
# Start sending telemetry to the AWS SQS queue
python3 scripts/simulate_fleet.py --interval 1.0
```

### 3. Frontend SCADA Dashboard (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:3000` to view the live SCADA command center.
