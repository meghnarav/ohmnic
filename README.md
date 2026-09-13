# Ωhmnic

> Cloud-native, explainable battery health and anomaly detection for EV fleets on AWS.

Most EV monitoring tools use static, fleet-wide thresholds to flag battery issues. Because lithium-ion degradation depends heavily on individual operating history, universal baselines create false alarms and miss early cell failures. **Ωhmnic** maintains per-vehicle adaptive baselines and translates mathematical outliers into root-cause engineering diagnostics using SHAP feature attribution.

---

## Architecture

* **Ingestion:** AWS Kinesis Data Streams handles high-velocity vehicle telemetry batches.
* **Compute:** AWS Lambda (Python 3.11) validates payloads and extracts battery metrics.
* **Baseline & State Store:** Amazon DynamoDB tracks rolling, vehicle-specific degradation signatures.
* **Anomaly Engine:** Isolation Forests detect multi-dimensional metric drift (cell voltage delta, thermal gradients, fast-charge behavior).
* **Explainability:** Kernel SHAP decomposes flagged anomalies into exact sensor contributions.


```

EV Telemetry ──► AWS Kinesis ──► AWS Lambda ──► DynamoDB (Per-Vehicle Baseline)
│
└──► Isolation Forest + SHAP
│
└──► Root-Cause Anomaly Alert

```

---

## Telemetry Payload

Sample payload accepted by the ingestion pipeline:

```json
{
  "vehicle_id": "vin-ev-77209",
  "timestamp": 1773402149,
  "session_type": "DC_FAST_CHARGE",
  "metrics": {
    "state_of_charge": 74.2,
    "pack_voltage": 398.6,
    "pack_current": 142.5,
    "pack_temp_c": 36.8,
    "cell_voltage_delta": 0.142,
    "max_cell_temp_c": 39.4,
    "charge_rate_kw": 56.8
  }
}

```

---

## Quickstart

### 1. Clone & Install

```bash
git clone [https://github.com/username/ohmnic.git](https://github.com/username/ohmnic.git)
cd ohmnic
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

```

### 2. Run Local Emulation

Start LocalStack to mock AWS Kinesis and DynamoDB:

```bash
docker compose up -d

```

### 3. Run Tests & Validation

```bash
ruff check .
pytest tests/ --cov=src

```

---

## Anomaly Output Example

```json
{
  "vehicle_id": "vin-ev-77209",
  "anomaly_flag": true,
  "root_cause": "High cell voltage variance during DC fast charging",
  "shap_attributions": {
    "cell_voltage_delta": 0.521,
    "max_cell_temp_c": 0.284,
    "charge_rate_kw": 0.112
  }
}

```

---

## License
```

None.

```

---

## Copyright

```
Copyright © 2026 Meghna Ravikumar. All rights reserved. No part of this software may be reproduced or distributed without permission.
```
