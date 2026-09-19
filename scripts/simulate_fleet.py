import argparse
import json
import time
import uuid
import boto3
import asyncio
import concurrent.futures
from datetime import datetime, timezone

QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/970722351156/ohmnic-battery-telemetry.fifo"
BUCKET_NAME = 'ohmnic-empirical-datasets-unique-id'

def get_s3_files():
    s3 = boto3.client('s3')
    print(f"Scanning S3 bucket {BUCKET_NAME} for fault_stream_*.json files...")
    
    response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix='fault_stream_')
    if 'Contents' not in response:
        print("No fault stream datasets found in bucket!")
        return []
        
    return [obj['Key'] for obj in response['Contents'] if obj['Key'].endswith('.json')]

def download_file(key):
    s3 = boto3.client('s3')
    local_path = f"/tmp/{key}"
    print(f"Downloading {key}...")
    s3.download_file(BUCKET_NAME, key, local_path)
    with open(local_path, 'r') as f:
        return json.load(f)

def send_sqs_message(payload, vid):
    sqs = boto3.client("sqs", region_name="us-east-1")
    sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps(payload),
        MessageGroupId=vid,
        MessageDeduplicationId=str(uuid.uuid4())
    )

async def simulate_vehicle(vid, key, interval, executor):
    print(f"Starting simulation for {vid} using dataset {key}")
    loop = asyncio.get_running_loop()
    
    # Download synchronously but off the main event loop
    try:
        data = await loop.run_in_executor(executor, download_file, key)
    except Exception as e:
        print(f"Error downloading {key}: {e}")
        return

    print(f"[{vid}] Ready. Replaying {len(data)} telemetry rows...")
    
    for row in data:
        payload = {
            "vehicle_id": vid,
            "timestamp": int(time.time()),
            "pack_voltage": row.get("pack_voltage", 4.0),
            "pack_current": row.get("pack_current", 1.5),
            "pack_temp_c": row.get("pack_temp_c", 25.0),
            "cell_voltage_delta": row.get("cell_voltage_delta", 0.015)
        }
        
        # Dispatch to SQS concurrently without blocking other vehicles
        await loop.run_in_executor(executor, send_sqs_message, payload, vid)
        print(f"[{datetime.now(timezone.utc).isoformat()}] {vid} -> Temp: {payload['pack_temp_c']:.1f}°C")
        
        await asyncio.sleep(interval)
        
    print(f"[{vid}] End of empirical cycle replay.")

async def main_async(interval):
    # S3 and SQS requests are blocking in boto3, so we use a ThreadPoolExecutor 
    # to maintain true concurrency in the asyncio event loop.
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=50)
    loop = asyncio.get_running_loop()
    
    keys = await loop.run_in_executor(executor, get_s3_files)
    if not keys:
        return
        
    tasks = []
    for key in keys:
        # Extract the dataset name from the key, e.g. fault_stream_B0005.json -> B0005
        # VIN-NASA-B0005
        base = key.replace('fault_stream_', '').replace('.json', '')
        vid = f"VIN-NASA-{base}"
        
        task = asyncio.create_task(simulate_vehicle(vid, key, interval, executor))
        tasks.append(task)
        
    print(f"Spawned {len(tasks)} concurrent vehicle simulation tasks.")
    await asyncio.gather(*tasks)

def main():
    parser = argparse.ArgumentParser(description="Simulate Ωhmnic Fleet Telemetry empirically (Concurrent Asyncio)")
    parser.add_argument("--interval", type=float, default=1.0, help="Interval between row dispatches")
    args = parser.parse_args()
    
    asyncio.run(main_async(args.interval))

if __name__ == "__main__":
    main()
