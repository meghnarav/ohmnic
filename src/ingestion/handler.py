import json
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any


def float_to_decimal(data: Any) -> Any:
    if isinstance(data, float):
        # Prevent precision issues by converting float to str first
        return Decimal(str(data))
    if isinstance(data, dict):
        return {k: float_to_decimal(v) for k, v in data.items()}
    if isinstance(data, list):
        return [float_to_decimal(v) for v in data]
    return data

from pydantic import ValidationError

from src.engine.baseline import BaselineManager
from src.engine.detector import AnomalyDetector
from src.engine.explainer import AnomalyExplainer

from .schema import TelemetryPayload

logger = logging.getLogger()
logger.setLevel(logging.INFO)

FEATURE_NAMES = ["pack_voltage", "pack_current", "pack_temp_c", "cell_voltage_delta", "charge_rate_kw"]

def parse_record(raw_body: str | dict[str, Any]) -> TelemetryPayload:
    if isinstance(raw_body, str):
        payload_dict = json.loads(raw_body)
    else:
        payload_dict = raw_body
    return TelemetryPayload(**payload_dict)


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    records = event.get("Records", [])
    logger.info("Received %d records", len(records))

    valid_records: list[TelemetryPayload] = []
    failed_records: list[dict[str, Any]] = []

    for record in records:
        try:
            # Supports both SQS ("body") and direct/Kinesis ("kinesis") formats
            if "body" in record:
                raw_data = record["body"]
            elif "kinesis" in record:
                import base64
                raw_data = base64.b64decode(record["kinesis"]["data"]).decode("utf-8")
            else:
                raw_data = record

            telemetry = parse_record(raw_data)
            valid_records.append(telemetry)
            
            # ML Logic
            vid = telemetry.vehicle_id
            features = [
                telemetry.pack_voltage,
                telemetry.pack_current,
                telemetry.pack_temp_c,
                telemetry.cell_voltage_delta,
                telemetry.charge_rate_kw or 0.0
            ]
            
            baseline = BaselineManager.get_baseline(vid) or {}
            history = baseline.get("history_vectors", [])
            recent_history = baseline.get("recent_history", [])
            
            anomaly_score = 0.0
            status = "NOMINAL"
            shap_drivers = []
            
            if len(history) >= 10:
                detector = AnomalyDetector()
                detector.fit(history)
                pred = detector.predict(features)
                is_anomaly = pred.get("is_anomaly", False)
                anomaly_score = pred.get("anomaly_score", 0.0)
                
                if is_anomaly or anomaly_score > 0.65:
                    status = "CRITICAL ANOMALY"
                    explainer = AnomalyExplainer(detector.model, history, FEATURE_NAMES)
                    shap_attributions = explainer.explain(features)
                    
                    # Compute mean baseline for each feature for auditing
                    import numpy as np
                    hist_arr = np.array(history)
                    means = np.mean(hist_arr, axis=0)
                    
                    for idx, name in enumerate(FEATURE_NAMES):
                        if name in shap_attributions:
                            shap_drivers.append({
                                "feature": str(name),
                                "attribution": float(shap_attributions[name]),
                                "baseline_val": str(round(means[idx], 3)),
                                "current_val": str(round(features[idx], 3))
                            })
            
            if status == "NOMINAL":
                history.append(features)
                history = history[-30:] # Rolling list of the last 30 nominal vectors
                
            recent_history.append({
                "timestamp": telemetry.timestamp.isoformat(),
                "voltage": telemetry.pack_voltage,
                "temp": telemetry.pack_temp_c,
                "deltaV": telemetry.cell_voltage_delta
            })
            recent_history = recent_history[-10:]
            
            payload_to_save = float_to_decimal({
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "status": status,
                "soc": telemetry.state_of_charge,
                "pack_voltage": telemetry.pack_voltage,
                "pack_current": telemetry.pack_current,
                "pack_temp": telemetry.pack_temp_c,
                "cell_voltage_delta": telemetry.cell_voltage_delta,
                "anomaly_score": anomaly_score,
                "shap_drivers": shap_drivers,
                "recent_history": recent_history,
                "history_vectors": history
            })
            BaselineManager.update_baseline(vid, payload_to_save)
            
        except (ValidationError, json.JSONDecodeError) as e:
            logger.error("Failed to parse record: %s", e)
            failed_records.append({"record": record, "error": str(e)})
        except Exception as e: # noqa: BLE001
            logger.error("Error processing record for ML: %s", e)
            failed_records.append({"record": record, "error": str(e)})

    return {
        "statusCode": 200,
        "processed": len(valid_records),
        "failed": len(failed_records),
    }