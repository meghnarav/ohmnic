import json
import logging
import os
from typing import Any
import boto3
from pydantic import ValidationError
from .schema import TelemetryPayload

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("STATE_TABLE", "ohmnic-vehicle-baselines")
table = dynamodb.Table(table_name)


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
        except (ValidationError, json.JSONDecodeError) as e:
            logger.error("Failed to parse record: %s", e)
            failed_records.append({"record": record, "error": str(e)})

    return {
        "statusCode": 200,
        "processed": len(valid_records),
        "failed": len(failed_records),
    }