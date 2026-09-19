import os
import json
import boto3
import pickle
import pandas as pd
from sklearn.ensemble import IsolationForest

BUCKET_NAME = 'ohmnic-empirical-datasets-unique-id'
NOMINAL_KEY = 'nasa_nominal_baseline.json'
LOCAL_PATH = '/tmp/nasa_nominal_baseline.json'
MODEL_OUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'isolation_forest_bms.pkl')

def main():
    print(f"Downloading {NOMINAL_KEY} from {BUCKET_NAME}...")
    s3 = boto3.client('s3')
    
    s3.download_file(BUCKET_NAME, NOMINAL_KEY, LOCAL_PATH)
            
    print("Loading data into Pandas DataFrame...")
    with open(LOCAL_PATH, 'r') as f:
        data = json.load(f)
        
    df = pd.DataFrame(data)
    features = ['pack_voltage', 'pack_current', 'pack_temp_c', 'cell_voltage_delta']
    X = df[features]
    
    print("Training Isolation Forest on healthy NASA cycles...")
    detector = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)
    detector.fit(X)
    
    print(f"Saving model to {MODEL_OUT_PATH}")
    with open(MODEL_OUT_PATH, 'wb') as f:
        pickle.dump(detector, f)
    print("Training complete.")

if __name__ == '__main__':
    main()
