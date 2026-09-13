import numpy as np
import shap
from sklearn.ensemble import IsolationForest


class AnomalyExplainer:
    def __init__(self, model: IsolationForest, background_data: list[list[float]], feature_names: list[str]):
        """Initialize Kernel SHAP explainer."""
        bg_array = np.array(background_data)
        # Use shap.sample to safely pick up to 10 points without kmeans clustering errors
        sample_size = min(10, len(bg_array))
        background = shap.sample(bg_array, sample_size)
        
        self.model = model
        self.feature_names = feature_names
        self.explainer = shap.KernelExplainer(model.decision_function, background)

    def explain(self, current_features: list[float]) -> dict[str, float]:
        """Calculate SHAP values to explain the anomaly score."""
        try:
            arr = np.array(current_features).reshape(1, -1)
            shap_values = self.explainer.shap_values(arr, nsamples=50, silent=True)
            
            # Handle 1D vs 2D shap output shapes
            vals = shap_values[0] if isinstance(shap_values, list) else shap_values
            if hasattr(vals, "flatten"):
                vals = vals.flatten()
                
            return {
                name: float(val)
                for name, val in zip(self.feature_names, vals, strict=False)
            }
        except Exception as e:  # noqa: BLE001
            print(f"Error calculating SHAP explanations: {e}")
            return {}