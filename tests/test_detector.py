from src.engine.detector import AnomalyDetector


def test_detector_training_and_prediction():
    detector = AnomalyDetector(contamination=0.1)

    # 15 normal sample records
    baseline_data = [[400.0, 50.0, 30.0, 0.02, 31.0] for _ in range(15)]
    detector.fit(baseline_data)

    # Nominal reading
    normal_reading = [400.0, 50.0, 30.0, 0.02, 31.0]
    pred_normal = detector.predict(normal_reading)
    assert "is_anomaly" in pred_normal
    assert "anomaly_score" in pred_normal

    # Anomaly reading (extreme thermal gradient and high cell voltage delta)
    anomaly_reading = [350.0, 250.0, 75.0, 0.25, 80.0]
    pred_anomaly = detector.predict(anomaly_reading)
    assert isinstance(pred_anomaly["is_anomaly"], bool)