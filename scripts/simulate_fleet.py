import argparse
import asyncio
import concurrent.futures
import glob
import json
import os
import time
import uuid
from datetime import datetime, timezone

try:
    import boto3
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

QUEUE_URL = os.environ.get(
    "SQS_QUEUE_URL", 
    "https://sqs.us-east-1.amazonaws.com/970722351156/ohmnic-battery-telemetry.fifo"
)
BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "ohmnic-empirical-datasets-unique-id")


def get_available_datasets(prefer_local=False):
    """Discover available datasets from local data/processed or AWS S3."""
    local_files = glob.glob("data/processed/fault_stream_*.json")
    if prefer_local and local_files:
        print(f"--> Using {len(local_files)} local empirical fault stream files from data/processed/")
        return [("local", f) for f in sorted(local_files)]

    if HAS_BOTO3 and not prefer_local:
        try:
            s3 = boto3.client("s3", region_name="us-east-1")
            print(f"--> Scanning S3 bucket {BUCKET_NAME} for fault_stream_*.json files...")
            response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix="fault_stream_")
            if "Contents" in response:
                keys = [obj["Key"] for obj in response["Contents"] if obj["Key"].endswith(".json")]
                if keys:
                    print(f"--> Found {len(keys)} datasets in S3 bucket {BUCKET_NAME}")
                    return [("s3", k) for k in sorted(keys)]
        except Exception as e:
            print(f"--> S3 scan failed ({e}). Falling back to local data/processed/ datasets.")

    if local_files:
        print(f"--> Using {len(local_files)} local empirical fault stream files from data/processed/")
        return [("local", f) for f in sorted(local_files)]

    print("--> No datasets found in S3 or data/processed/. Generating synthetic streams.")
    return [("synthetic", f"SYNTH-{i:02d}") for i in range(4)]


def load_dataset(source_type, key):
    """Load dataset from S3, local disk, or synthetic generator."""
    if source_type == "local":
        with open(key, "r") as f:
            return json.load(f)
    elif source_type == "s3" and HAS_BOTO3:
        s3 = boto3.client("s3", region_name="us-east-1")
        local_path = f"/tmp/{os.path.basename(key)}"
        s3.download_file(BUCKET_NAME, key, local_path)
        with open(local_path, "r") as f:
            return json.load(f)
    else:
        # Synthetic nominal + anomaly sequence
        rows = []
        for i in range(120):
            is_anomaly = (30 <= i <= 55)
            rows.append({
                "pack_voltage": round(3.60 if is_anomaly else 4.05, 3),
                "pack_current": round(85.0 if is_anomaly else 22.0, 2),
                "pack_temp_c": round(42.5 if is_anomaly else 26.0, 2),
                "cell_voltage_delta": round(0.048 if is_anomaly else 0.012, 4)
            })
        return rows


def send_sqs_message(payload, vid):
    """Dispatch telemetry payload to AWS SQS FIFO with offline graceful fallback."""
    if HAS_BOTO3:
        try:
            sqs = boto3.client("sqs", region_name="us-east-1")
            sqs.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(payload),
                MessageGroupId=vid,
                MessageDeduplicationId=str(uuid.uuid4())
            )
            return True
        except Exception:
            return False
    return False


async def simulate_vehicle(vid, source_type, key, mode, interval, heartbeat_interval, burst_interval, executor):
    """Simulate an individual EV telemetry stream under interval or adaptive backpressure mode."""
    loop = asyncio.get_running_loop()
    try:
        data = await loop.run_in_executor(executor, load_dataset, source_type, key)
    except Exception as e:
        print(f"[{vid}] Error loading dataset {key}: {e}")
        return

    print(f"[{vid}] Ready. Replaying {len(data)} telemetry cycles in mode='{mode.upper()}'...")

    sim_start_time = time.time()
    actual_packets_sent = 0
    burst_mode_active = False
    burst_remaining_packets = 0

    for idx, row in enumerate(data):
        v = row.get("pack_voltage", 4.0)
        i = row.get("pack_current", 1.5)
        t = row.get("pack_temp_c", 25.0)
        dv = row.get("cell_voltage_delta", 0.015)

        is_pertubation = (dv > 0.03) or (t > 35.0)

        # Decide sleep interval and whether to transmit in adaptive mode
        if mode == "adaptive":
            if is_pertubation:
                if not burst_mode_active:
                    burst_mode_active = True
                    burst_remaining_packets = int(15.0 / burst_interval)  # 15s at burst rate (e.g. 75 packets)
                    state_tag = "BURST_ENTER"
                else:
                    state_tag = "BURSTING"
            else:
                if burst_remaining_packets > 0:
                    burst_remaining_packets -= 1
                    state_tag = "BURST_TAIL"
                else:
                    burst_mode_active = False
                    state_tag = "HEARTBEAT"

            # In adaptive mode:
            # - When bursting: dispatch every burst_interval (5 Hz -> 0.2s)
            # - When heartbeat: dispatch every heartbeat_interval (0.05 Hz -> 20.0s)
            sleep_time = burst_interval if burst_mode_active else heartbeat_interval
        else:
            state_tag = "CONTINUOUS"
            sleep_time = interval

        payload = {
            "vehicle_id": vid,
            "timestamp": int(time.time()),
            "pack_voltage": v,
            "pack_current": i,
            "pack_temp_c": t,
            "cell_voltage_delta": dv,
            "mode": state_tag
        }

        # Dispatch
        await loop.run_in_executor(executor, send_sqs_message, payload, vid)
        actual_packets_sent += 1

        # Calculate live savings
        elapsed = max(0.1, time.time() - sim_start_time)
        continuous_equiv_pkts = max(1, int(elapsed * (1.0 / burst_interval))) if mode == "adaptive" else actual_packets_sent
        savings_pct = max(0.0, (1.0 - (actual_packets_sent / continuous_equiv_pkts)) * 100.0)

        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
        print(
            f"[{now_str}] [{vid}] [{state_tag:11s}] "
            f"Temp: {t:4.1f}°C | dV: {dv:6.4f}V | "
            f"Sent: {actual_packets_sent:3d} (eq {continuous_equiv_pkts:3d}) | "
            f"Bandwidth Saved: {savings_pct:5.1f}%"
        )

        await asyncio.sleep(sleep_time)

    print(f"[{vid}] Completed {len(data)} cycles. Final transmissions: {actual_packets_sent} pkts.")


async def main_async(mode, interval, heartbeat, burst, local_pref):
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=50)
    loop = asyncio.get_running_loop()

    datasets = await loop.run_in_executor(executor, get_available_datasets, local_pref)
    if not datasets:
        print("No datasets available for simulation.")
        return

    tasks = []
    # Limit to top 5 datasets for responsive fleet demo if many present
    selected = datasets[:6]
    for source_type, key in selected:
        base = os.path.basename(key).replace("fault_stream_", "").replace(".json", "")
        vid = f"VIN-NASA-{base}"
        task = asyncio.create_task(
            simulate_vehicle(
                vid=vid,
                source_type=source_type,
                key=key,
                mode=mode,
                interval=interval,
                heartbeat_interval=heartbeat,
                burst_interval=burst,
                executor=executor
            )
        )
        tasks.append(task)

    print(f"--> Spawned {len(tasks)} concurrent EV fleet telematics tasks in '{mode.upper()}' mode.")
    await asyncio.gather(*tasks)


def main():
    parser = argparse.ArgumentParser(
        description="Ωhmnic Fleet Telemetry Replay Engine (Adaptive Bursting & Ingestion Backpressure)"
    )
    parser.add_argument(
        "--mode",
        choices=["interval", "adaptive"],
        default="interval",
        help="Simulation streaming mode: 'interval' (continuous) or 'adaptive' (0.05 Hz heartbeat + 5 Hz burst on variance)"
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=1.0,
        help="Interval (seconds) between row dispatches in continuous mode (default: 1.0s)"
    )
    parser.add_argument(
        "--heartbeat",
        type=float,
        default=20.0,
        help="Heartbeat interval (seconds) in adaptive mode (default: 20.0s = 0.05 Hz)"
    )
    parser.add_argument(
        "--burst-rate",
        type=float,
        default=0.2,
        help="Micro-burst packet spacing (seconds) in adaptive mode (default: 0.2s = 5 Hz)"
    )
    parser.add_argument(
        "--local",
        action="store_true",
        help="Prefer local processed datasets in data/processed/ over S3"
    )
    args = parser.parse_args()

    print("===============================================================")
    print("  Ωhmnic Distributed Fleet Telemetry Replay Engine")
    print(f"  Mode: {args.mode.upper()} | Local Preference: {args.local}")
    print("===============================================================")

    asyncio.run(main_async(args.mode, args.interval, args.heartbeat, args.burst_rate, args.local))


if __name__ == "__main__":
    main()
