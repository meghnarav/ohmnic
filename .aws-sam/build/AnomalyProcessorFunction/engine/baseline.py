import os
from typing import Any

import boto3

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('STATE_TABLE', 'ohmnic-vehicle-baselines')
table = dynamodb.Table(table_name)

class BaselineManager:
    @staticmethod
    def get_baseline(vehicle_id: str) -> dict[str, Any] | None:
        """Fetch the vehicle's rolling baseline from DynamoDB."""
        try:
            response = table.get_item(Key={'vehicle_id': vehicle_id})
            if 'Item' in response:
                return response['Item']
            return None
        except Exception as e: # noqa: BLE001
            print(f"Error fetching baseline for {vehicle_id}: {e}")
            return None
            
    @staticmethod
    def update_baseline(vehicle_id: str, new_metrics: dict[str, Any]) -> None:
        """Update the vehicle's rolling baseline in DynamoDB."""
        try:
            # Simplistic rolling update: merge existing with new (in a real app, this would be an EMA or similar)
            table.put_item(
                Item={
                    'vehicle_id': vehicle_id,
                    **new_metrics
                }
            )
        except Exception as e: # noqa: BLE001
            print(f"Error updating baseline for {vehicle_id}: {e}")
