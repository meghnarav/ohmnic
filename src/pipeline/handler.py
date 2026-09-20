import json
import boto3
import pickle
import pandas as pd
import shap
from decimal import Decimal

# Load into global scope to prevent reloading during Lambda warm starts
MODEL_PATH = "isolation_forest_bms.pkl"
with open(MODEL_PATH, 'rb') as f:
    detector = pickle.load(f)
explainer = shap.TreeExplainer(detector) 

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ohmnic-vehicle-baselines')

def process_telemetry(event, context):
    for record in event.get('Records', []):
        payload = json.loads(record['body'])
        
        # 1. Format live CAN bus telemetry
        features = ['pack_voltage', 'pack_current', 'pack_temp_c', 'cell_voltage_delta']
        X_live = pd.DataFrame([[payload[f] for f in features]], columns=features)
        
        # 2. Execute Isolation Forest Inference
        is_inlier = detector.predict(X_live)[0]
        raw_score = float(detector.decision_function(X_live)[0])
        
        # Normalize decision_function (negative = highly anomalous) to 0.0 - 1.0 for the React UI
        anomaly_prob = round(float(0.5 - (raw_score * 0.5)), 3)
        
        status = "NOMINAL"
        shap_drivers = []
        
        # 3. Millisecond XAI via TreeSHAP (Only runs if anomaly trips)
        if is_inlier == -1 or anomaly_prob > 0.65:
            status = "FAULT" if anomaly_prob > 0.85 else "WARN"
            shap_values = explainer.shap_values(X_live)
            
            for idx, feature_name in enumerate(features):
                impact = float(shap_values[0][idx])
                # In Isolation Forests, negative SHAP values drive the anomaly score higher
                if impact < 0: 
                    shap_drivers.append({
                        "feature": feature_name,
                        "impact": round(abs(impact), 3),
                        "observed": f"{payload[feature_name]}"
                    })
                    
            # Sort UI payload to show the most critical contributing feature at the top
            shap_drivers = sorted(shap_drivers, key=lambda k: k['impact'], reverse=True)
        
        # 4. Upsert persistent state to DynamoDB
        db_item = json.loads(json.dumps({
            "vehicle_id": payload['vehicle_id'],
            "vin": payload['vehicle_id'],
            "timestamp": payload['timestamp'],
            "packVoltage": payload['pack_voltage'],
            "packCurrent": payload['pack_current'],
            "maxTemp": payload['pack_temp_c'],
            "deltaV": payload['cell_voltage_delta'],
            "status": status,
            "score": anomaly_prob,
            "shap": shap_drivers
        }), parse_float=Decimal)
        
        table.put_item(Item=db_item)
        print(f"[{status}] VIN: {payload['vehicle_id']} processed.")
        
    return {"statusCode": 200, "body": "Success"}

handler = process_telemetry