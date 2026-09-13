import shap
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any

class AnomalyExplainer:
    def __init__(self, model: IsolationForest, background_data: List[List[float]], feature_names: List[str]):
        """Initialize Kernel SHAP explainer."""
        # Using a subset of background data for Kernel SHAP to keep it fast
        background = shap.kmeans(np.array(background_data), 10)
        # IsolationForest decision_function outputs anomaly scores
        self.explainer = shap.KernelExplainer(model.decision_function, background)
        self.feature_names = feature_names
        
    def explain(self, current_features: List[float]) -> Dict[str, float]:
        """Calculate SHAP values to explain the anomaly score."""
        try:
            X = np.array([current_features])
            shap_values = self.explainer.shap_values(X)
            
            # Extract values for the single instance
            instance_shap_values = shap_values[0]
            
            # Map feature names to their absolute SHAP attribution
            attributions = {
                name: float(abs(val)) 
                for name, val in zip(self.feature_names, instance_shap_values)
            }
            
            # Normalize to percentages
            total_attribution = sum(attributions.values())
            if total_attribution > 0:
                attributions = {
                    name: (val / total_attribution) * 100 
                    for name, val in attributions.items()
                }
                
            return attributions
        except Exception as e:
            print(f"Error calculating SHAP explanations: {e}")
            return {}
