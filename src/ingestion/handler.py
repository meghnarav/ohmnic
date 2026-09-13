import base64
import json
import logging
from typing import Any

from pydantic import ValidationError

from .schema import TelemetryPayload

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def parse_kinesis_record(record: dict[str, Any]) -> TelemetryPayload:
    """Parses and validates a single Kinesis record."""
    payload_str = base64.b64decode(record["kinesis"]["data"]).decode("utf-8")
    payload_dict = json.loads(payload_str)
    return TelemetryPayload(**payload_dict)

def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """
    AWS Lambda handler for Kinesis batch processing.
    """
    logger.info(f"Received {len(event['Records'])} records")
    
    valid_records: list[TelemetryPayload] = []
    failed_records: list[dict[str, Any]] = []

    for record in event["Records"]:
        try:
            telemetry = parse_kinesis_record(record)
            valid_records.append(telemetry)
        except (ValidationError, json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse record: {e}")
            failed_records.append({
                "record": record,
                "error": str(e)
            })

    # Here we would send valid_records to the Anomaly Engine
    # and failed_records to a DLQ

    logger.info(f"Processed {len(valid_records)} valid records. Failed {len(failed_records)} records.")
    
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Batch processing complete",
            "valid_count": len(valid_records),
            "error_count": len(failed_records)
        })
    }
