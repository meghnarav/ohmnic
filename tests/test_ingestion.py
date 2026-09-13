import base64
import json

from src.ingestion.handler import lambda_handler, parse_kinesis_record
from src.ingestion.schema import TelemetryPayload


def test_schema_valid_payload():
    raw_payload = {
        "vehicle_id": "vin-ev-77209",
        "timestamp": "2026-03-15T12:00:00Z",
        "session_type": "DC_FAST_CHARGE",
        "state_of_charge": 74.2,
        "pack_voltage": 398.6,
        "pack_current": 142.5,
        "pack_temp_c": 36.8,
        "cell_voltage_delta": 0.142,
        "max_cell_temp_c": 39.4,
        "min_cell_temp_c": 34.1,
        "charge_rate_kw": 56.8,
    }
    payload = TelemetryPayload(**raw_payload)
    assert payload.vehicle_id == "vin-ev-77209"
    assert payload.cell_voltage_delta == 0.142


def test_kinesis_record_parsing():
    sample_data = {
        "vehicle_id": "vin-ev-001",
        "timestamp": "2026-03-15T12:00:00Z",
        "session_type": "driving",
        "state_of_charge": 55.0,
        "pack_voltage": 400.0,
        "pack_current": 50.0,
        "pack_temp_c": 30.0,
        "cell_voltage_delta": 0.02,
        "max_cell_temp_c": 32.0,
        "min_cell_temp_c": 29.0,
    }
    encoded = base64.b64encode(json.dumps(sample_data).encode("utf-8")).decode(
        "utf-8"
    )
    record = {"kinesis": {"data": encoded}}

    parsed = parse_kinesis_record(record)
    assert parsed.vehicle_id == "vin-ev-001"


def test_lambda_handler_batch():
    sample_data = {
        "vehicle_id": "vin-ev-002",
        "timestamp": "2026-03-15T12:00:00Z",
        "session_type": "driving",
        "state_of_charge": 60.0,
        "pack_voltage": 400.0,
        "pack_current": 40.0,
        "pack_temp_c": 28.0,
        "cell_voltage_delta": 0.015,
        "max_cell_temp_c": 30.0,
        "min_cell_temp_c": 27.0,
    }
    encoded = base64.b64encode(json.dumps(sample_data).encode("utf-8")).decode(
        "utf-8"
    )
    event = {"Records": [{"kinesis": {"data": encoded}}]}

    result = lambda_handler(event, None)
    assert result is not None