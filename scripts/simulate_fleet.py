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

def generate_telemetry(vehicle_id: str, state: dict, args_interval: float) -> dict:
    # 5% chance to toggle charging state
    if random.random() < 0.05:
        state["is_charging"] = not state["is_charging"]
        
    # 2% chance to start an anomaly (thermal runaway)
    if not state["anomaly_active"] and random.random() < 0.02:
        state["anomaly_active"] = True
        state["anomaly_progress"] = 0
        
    # 5% chance for a dropout (approx 20 ticks)
    if state.get("dropout_ticks", 0) == 0 and random.random() < 0.05:
        state["dropout_ticks"] = 20
        
    # 1% chance for a sensor spike (1 tick)
    if state.get("spike_ticks", 0) == 0 and random.random() < 0.01:
        state["spike_ticks"] = 1

    # GPS drift
    state["gps_lat"] = state.get("gps_lat", 37.7749) + random.uniform(-0.0005, 0.0005)
    state["gps_lng"] = state.get("gps_lng", -122.4194) + random.uniform(-0.0005, 0.0005)

    if state["is_charging"]:
        # Charging
        state["soc"] = min(100.0, state["soc"] + random.uniform(0.5, 2.0))
        state["temp_base"] = min(45.0, state["temp_base"] + random.uniform(0.1, 0.5))
        state["voltage_base"] = 405.0 + random.uniform(-2, 2)
        state["speed"] = 0.0
        session_type = "DC_FAST_CHARGE"
        current = random.uniform(100, 150)
        charge_rate_kw = current * state["voltage_base"] / 1000.0
    else:
        # Driving
        state["soc"] = max(5.0, state["soc"] - random.uniform(0.1, 0.5))
        state["temp_base"] = max(25.0, state["temp_base"] - random.uniform(0.1, 0.3))
        state["voltage_base"] = 385.0 + (state["soc"] * 0.2) + random.uniform(-2, 2)
        state["speed"] = random.uniform(25, 65)
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
            
    # Energy
    if state["is_charging"]:
        state["consumed_kwh"] += (current * state["voltage_base"] / 1000.0) * (args_interval / 3600.0)
    else:
        state["consumed_kwh"] += (current * state["voltage_base"] / 1000.0) * (args_interval / 3600.0)
        if random.random() < 0.3:
            state["regen_kwh"] += random.uniform(0.01, 0.05)
            
    # Spikes
    speed_mph = state["speed"]
    pack_temp_c = state["temp_base"]
    max_cell_temp_c = max_temp
    
    if state.get("spike_ticks", 0) > 0:
        state["spike_ticks"] -= 1
        speed_mph = 400.0
        pack_temp_c = 999.0
        max_cell_temp_c = 999.0

    # Dropouts
    soc = round(state["soc"], 1)
    gps_lat = round(state["gps_lat"], 5)
    gps_lng = round(state["gps_lng"], 5)
    
    if state.get("dropout_ticks", 0) > 0:
        state["dropout_ticks"] -= 1
        soc = None
        gps_lat = None
        gps_lng = None
        speed_mph = None

    return {
        "vehicle_id": vehicle_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_type": session_type,
        "state_of_charge": soc,
        "pack_voltage": round(state["voltage_base"], 1),
        "pack_current": round(current, 1),
        "pack_temp_c": round(pack_temp_c, 1) if pack_temp_c is not None else None,
        "cell_voltage_delta": round(cell_delta, 3),
        "max_cell_temp_c": round(max_cell_temp_c, 1) if max_cell_temp_c is not None else None,
        "min_cell_temp_c": round(min_temp, 1),
        "charge_rate_kw": round(charge_rate_kw, 1) if charge_rate_kw else None,
        "speed_mph": round(speed_mph, 1) if speed_mph is not None else None,
        "gps_lat": gps_lat,
        "gps_lng": gps_lng,
        "ambient_temp_c": round(state["ambient_temp"], 1),
        "regen_kwh": round(state["regen_kwh"], 2),
        "consumed_kwh": round(state["consumed_kwh"], 2),
        "soh": round(state["soh"], 1),
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
            "ambient_temp": random.uniform(15, 35),
            "voltage_base": random.uniform(385, 405),
            "anomaly_active": False,
            "anomaly_progress": 0,
            "gps_lat": 37.7749 + random.uniform(-0.1, 0.1),
            "gps_lng": -122.4194 + random.uniform(-0.1, 0.1),
            "speed": 0,
            "dropout_ticks": 0,
            "spike_ticks": 0,
            "regen_kwh": random.uniform(10, 50),
            "consumed_kwh": random.uniform(100, 500),
            "soh": random.uniform(88, 100)
        }
        for vid in vids
    }

    print(f"Streaming telemetry to {QUEUE_URL}...")
    
    def send_batch():
        for vid in vids:
            payload = generate_telemetry(vid, vehicle_state[vid], args.interval)
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