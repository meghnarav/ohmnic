from sklearn.ensemble import IsolationForest

from src.engine.explainer import AnomalyExplainer


def test_explainer_attributions():
    # 20 distinct records with slight variance
    background = [
        [400.0 + i * 0.1, 50.0 + i * 0.5, 30.0 + i * 0.2, 0.02 + i * 0.001, 31.0 + i * 0.2]
        for i in range(20)
    ]
    feature_names = ["pack_v", "pack_i", "pack_temp", "delta_v", "max_temp"]

    model = IsolationForest(random_state=42)
    model.fit(background)

    explainer = AnomalyExplainer(
        model=model, background_data=background, feature_names=feature_names
    )
    current_reading = [380.0, 180.0, 48.0, 0.18, 52.0]

    attributions = explainer.explain(current_reading)
    assert isinstance(attributions, dict)
    assert len(attributions) == len(feature_names)