import os
import json
import numpy as np
from datetime import datetime
from decimal import Decimal
import boto3
from src.engine.detector import AnomalyDetector  
from src.engine.explainer import AnomalyExplainer

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'ohmnic-vehicle-baselines')
table = dynamodb.Table(TABLE_NAME)

def float_to_decimal(obj):
    """Recursively converts python floats to Decimals for DynamoDB persistence."""
    if isinstance(obj, float):
        return Decimal(str(obj)) if not np.isnan(obj) else Decimal('0.0')
    elif isinstance(obj, dict):
        return {k: float_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [float_to_decimal(v) for v in obj]
    return obj

def lambda_handler(event, context):
    """
    Processes SQS FIFO high-frequency EV telemetry batches.
    Runs Isolation Forest and appends Kernel SHAP values on critical thresholds.
    """
    processed_records = 0
    
    for record in event.get('Records', []):
        try:
            body = json.loads(record['body'])
            vin = body['vin']
            timestamp = body.get('timestamp', datetime.utcnow().isoformat())
            depot = body.get('depot', 'UNKNOWN')
            
            features = {
                'pack_voltage': float(body['pack_voltage']),
                'pack_current': float(body['pack_current']),
                'pack_temp_c': float(body['pack_temp_c']),
                'ambient_temp_c': float(body.get('ambient_temp_c', 25.0)),
                'cell_voltage_delta': float(body['cell_voltage_delta']),
                'max_cell_temp_c': float(body['max_cell_temp_c']),
                'charge_rate_kw': float(body['charge_rate_kw']),
                'regen_kwh': float(body.get('regen_kwh', 0.0)),
                'consumed_kwh': float(body.get('consumed_kwh', 0.0)),
                'soh': float(body.get('soh', 100.0)),
                'speed_mph': float(body.get('speed_mph', 0.0)),
                'gps_lat': float(body.get('gps_lat', 0.0)),
                'gps_lng': float(body.get('gps_lng', 0.0)),
            }
            
            feature_vector = [
                features['pack_voltage'], features['pack_current'], features['pack_temp_c'],
                features['cell_voltage_delta'], features['max_cell_temp_c'], features['charge_rate_kw']
            ]
            
            anomaly_score = float(AnomalyDetector.predict(feature_vector))
            is_anomaly = anomaly_score > 0.65 
            
            shap_attributions = {}
            if is_anomaly:
                raw_shap = AnomalyExplainer.explain(feature_vector)
                shap_attributions = {
                    'pack_voltage': float(raw_shap[0]),
                    'pack_current': float(raw_shap[1]),
                    'pack_temp_c': float(raw_shap[2]),
                    'cell_voltage_delta': float(raw_shap[3]),
                    'max_cell_temp_c': float(raw_shap[4]),
                    'charge_rate_kw': float(raw_shap[5])
                }
            else:
                shap_attributions = {k: 0.0 for k in features.keys()}
                
            db_item = {
                'vin': vin,
                'last_updated': timestamp,
                'depot': depot,
                'telemetry': features,
                'anomaly_score': anomaly_score,
                'status': 'CRITICAL_FAULT' if is_anomaly else 'NOMINAL',
                'shap_attribution': shap_attributions
            }
            
            table.put_item(Item=float_to_decimal(db_item))
            processed_records += 1
            
        except Exception as e:
            print(f"Error executing inference pipeline on record: {str(e)}")
            continue
            
    return {
        'statusCode': 200,
        'body': json.dumps(f"Processed {processed_records} telemetry packets successfully.")
    }
