import os
import json
import time
import uuid
import base64
import random
from datetime import datetime
import boto3

# Configuration
KINESIS_STREAM_NAME = os.getenv("STREAM_NAME", "ohmnic-battery-telemetry")
REGION_NAME = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
ENDPOINT_URL = os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566")

# Initialize LocalStack Kinesis Client
kinesis = boto3.client(
    'kinesis',
    region_name=REGION_NAME,
    endpoint_url=ENDPOINT_URL,
    aws_access_key_id="test",
    aws_secret_access_key="test"
)

def generate_nominal_telemetry(vehicle_id: str) -> dict:
    """Generate healthy battery metrics."""
    return {
        "vehicle_id": vehicle_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "session_type": "driving",
        "state_of_charge": round(random.uniform(20.0, 80.0), 1),
        "pack_voltage": round(random.uniform(350.0, 400.0), 1),
        "pack_current": round(random.uniform(-50.0, 150.0), 1),
        "pack_temp_c": round(random.uniform(20.0, 35.0), 1),
        "cell_voltage_delta": round(random.uniform(0.01, 0.05), 3),
        "max_cell_temp_c": round(random.uniform(22.0, 36.0), 1),
        "min_cell_temp_c": round(random.uniform(20.0, 34.0), 1),
        "charge_rate_kw": 0.0
    }

def generate_anomalous_telemetry(vehicle_id: str) -> dict:
    """Generate anomalous battery metrics (e.g. high cell voltage delta and temp)."""
    base = generate_nominal_telemetry(vehicle_id)
    # Inject anomaly
    base["session_type"] = "charging"
    base["cell_voltage_delta"] = round(random.uniform(0.12, 0.25), 3) # High Delta V
    base["max_cell_temp_c"] = round(random.uniform(45.0, 55.0), 1)    # High Temp
    base["charge_rate_kw"] = round(random.uniform(100.0, 150.0), 1)   # DC Fast Charging
    return base

def main():
    print(f"Starting simulated fleet telemetry to {KINESIS_STREAM_NAME} at {ENDPOINT_URL}...")
    vehicles = [f"EV-X7-00{i}" for i in range(1, 6)]
    
    try:
        while True:
            records = []
            for vid in vehicles:
                # 5% chance of an anomaly
                if random.random() < 0.05:
                    payload = generate_anomalous_telemetry(vid)
                    print(f"[!] Generating ANOMALY for {vid}")
                else:
                    payload = generate_nominal_telemetry(vid)
                
                # Kinesis requires payload as bytes, JSON encoded
                data = json.dumps(payload).encode('utf-8')
                records.append({
                    'Data': data,
                    'PartitionKey': vid
                })
            
            # Send batch to Kinesis
            response = kinesis.put_records(
                Records=records,
                StreamName=KINESIS_STREAM_NAME
            )
            
            failed_count = response.get('FailedRecordCount', 0)
            print(f"Sent {len(records)} records. Failed: {failed_count}")
            
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\nSimulation stopped.")

if __name__ == "__main__":
    main()
