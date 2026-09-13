import argparse
import json
import random
import time
import uuid
from datetime import datetime, timezone

import boto3

QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/970722351156/ohmnic-battery-telemetry.fifo"
REGION = "us-east-1"

sqs = boto3.client("sqs", region_name=REGION)

def generate_telemetry(vehicle_id: str, state: dict) -> dict:
    # 5% chance to toggle charging state
    if random.random() < 0.05:
        state["is_charging"] = not state["is_charging"]
        
    # 2% chance to start an anomaly
    if not state["anomaly_active"] and random.random() < 0.02:
        state["anomaly_active"] = True
        state["anomaly_progress"] = 0
        
    if state["is_charging"]:
        # Charging
        state["soc"] = min(100.0, state["soc"] + random.uniform(0.5, 2.0))
        state["temp_base"] = min(45.0, state["temp_base"] + random.uniform(0.1, 0.5))
        state["voltage_base"] = 405.0 + random.uniform(-2, 2)
        session_type = "DC_FAST_CHARGE"
        current = random.uniform(100, 150)
        charge_rate_kw = current * state["voltage_base"] / 1000.0
    else:
        # Driving
        state["soc"] = max(5.0, state["soc"] - random.uniform(0.1, 0.5))
        state["temp_base"] = max(25.0, state["temp_base"] - random.uniform(0.1, 0.3))
        state["voltage_base"] = 385.0 + (state["soc"] * 0.2) + random.uniform(-2, 2)
        session_type = "driving"
        current = random.uniform(20, 60)
        charge_rate_kw = None

    # Normal variations
    cell_delta = random.uniform(0.010, 0.025)
    max_temp = state["temp_base"] + random.uniform(1, 3)
    min_temp = state["temp_base"] - random.uniform(1, 3)

    if state["anomaly_active"]:
        # Anomaly intensifies
        state["anomaly_progress"] += 1
        intensity = min(1.0, state["anomaly_progress"] / 10.0)
        
        # Thermal runaway and cell divergence
        cell_delta += intensity * random.uniform(0.180, 0.300)
        max_temp += intensity * random.uniform(25, 40)
        current += intensity * random.uniform(180, 220)
        state["voltage_base"] = max(340.0, state["voltage_base"] - intensity * random.uniform(10, 30))
        
        if state["anomaly_progress"] > 5 and random.random() < 0.1:
            state["anomaly_active"] = False
            state["anomaly_progress"] = 0

    return {
        "vehicle_id": vehicle_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_type": session_type,
        "state_of_charge": round(state["soc"], 1),
        "pack_voltage": round(state["voltage_base"], 1),
        "pack_current": round(current, 1),
        "pack_temp_c": round(state["temp_base"], 1),
        "cell_voltage_delta": round(cell_delta, 3),
        "max_cell_temp_c": round(max_temp, 1),
        "min_cell_temp_c": round(min_temp, 1),
        "charge_rate_kw": round(charge_rate_kw, 1) if charge_rate_kw else None,
    }


def main():
    parser = argparse.ArgumentParser(description="Simulate Ωhmnic Fleet Telemetry")
    parser.add_argument("-c", "--continuous", action="store_true", help="Run continuously as a daemon")
    parser.add_argument("-i", "--interval", type=float, default=1.5, help="Delay between batches (seconds)")
    parser.add_argument("-n", "--vehicles", type=int, default=5, help="Number of simulated vehicles")
    args = parser.parse_args()

    vids = [f"vin-ev-{1000 + i}" for i in range(args.vehicles)]
    
    vehicle_state = {
        vid: {
            "is_charging": False,
            "charge_progress": random.uniform(0, 1),
            "soc": random.uniform(20, 80),
            "temp_base": random.uniform(25, 32),
            "voltage_base": random.uniform(385, 405),
            "anomaly_active": False,
            "anomaly_progress": 0,
        }
        for vid in vids
    }

    print(f"Streaming telemetry to {QUEUE_URL}...")
    
    def send_batch():
        for vid in vids:
            payload = generate_telemetry(vid, vehicle_state[vid])
            is_anomaly = vehicle_state[vid]["anomaly_active"]

            sqs.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(payload),
                MessageGroupId=vid,
                MessageDeduplicationId=str(uuid.uuid4())
            )
            tag = "[! ANOMALY ]" if is_anomaly else "[  NOMINAL ]"
            print(f"{tag} {vid:<15} SoC: {payload['state_of_charge']:>5.1f}% | ΔV: {payload['cell_voltage_delta']:>5.3f}V | MaxT: {payload['max_cell_temp_c']:>4.1f}°C")

    if args.continuous:
        print(f"Running in continuous mode (delay: {args.interval}s)...")
        try:
            while True:
                send_batch()
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nSimulation stopped.")
    else:
        for _ in range(3):
            send_batch()
            time.sleep(args.interval)

if __name__ == "__main__":
    main()