import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any

class AnomalyDetector:
    def __init__(self, contamination: float = 0.05):
        self.model = IsolationForest(contamination=contamination, random_state=42)
        
    def fit(self, historical_features: List[List[float]]):
        """Train the Isolation Forest model on a vehicle's historical baseline data."""
        if not historical_features or len(historical_features) < 10:
            # Need minimum data to fit
            return
            
        X = np.array(historical_features)
        self.model.fit(X)
        
    def predict(self, current_features: List[float]) -> Dict[str, Any]:
        """Predict if the current telemetry is anomalous."""
        try:
            X = np.array([current_features])
            prediction = self.model.predict(X)[0] # 1 for normal, -1 for anomaly
            score = self.model.decision_function(X)[0]
            
            return {
                "is_anomaly": prediction == -1,
                "anomaly_score": float(score)
            }
        except Exception as e:
            print(f"Error predicting anomaly: {e}")
            return {
                "is_anomaly": False,
                "anomaly_score": 0.0
            }
