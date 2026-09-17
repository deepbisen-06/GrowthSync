"""Exercise prediction/authentication without connecting to PostgreSQL."""

import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from sklearn.dummy import DummyRegressor

from backend.app.deps import get_current_user
from backend.app.routes.analytics import router
from backend.app.services import academic_prediction_service as service


class AcademicPredictionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.directory = Path(self.tmp.name)
        self.override = patch.object(service, "MODEL_DIR", self.directory)
        self.override.start()
        self.addCleanup(self.override.stop)
        service._load_artifacts.cache_clear()
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=1)
        self.app = app
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.payload = {"studytime": 2, "failures": 0, "absences": 4}

    def save_fixture(self, grade=12.0):
        frame = pd.DataFrame([self.payload], columns=service.FEATURES)
        model = DummyRegressor(strategy="constant", constant=grade).fit(frame, [grade])
        joblib.dump(model, self.directory / "student_model.joblib")
        report = {
            "features": service.FEATURES, "target": "G3", "selected_model": "baseline",
            "held_out_test_metrics": {"baseline": {"mae": 2.4}},
        }
        (self.directory / "metrics.json").write_text(json.dumps(report))

    def test_returns_saved_model_prediction(self):
        self.save_fixture()
        response = self.client.post("/api/analytics/academic-prediction", json=self.payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["predicted_grade"], 12.0)
        self.assertFalse(response.json()["display_clipped"])

    def test_missing_artifact_returns_503_without_fake_prediction(self):
        response = self.client.post("/api/analytics/academic-prediction", json=self.payload)
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("predicted_grade", response.json())

    def test_invalid_inputs_are_rejected(self):
        for fields in [{"studytime": 0}, {"absences": -1}, {"absences": 1.5},
                       {"failures": 5}, {"studytime": "2"}, {"G3": 20}]:
            with self.subTest(fields=fields):
                response = self.client.post("/api/analytics/academic-prediction",
                                            json={**self.payload, **fields})
                self.assertEqual(response.status_code, 422)

    def test_authentication_is_required(self):
        def unauthenticated():
            raise HTTPException(status_code=401, detail="Sign in required")
        self.app.dependency_overrides[get_current_user] = unauthenticated
        response = self.client.post("/api/analytics/academic-prediction", json=self.payload)
        self.assertEqual(response.status_code, 401)

    def test_clipping_is_explicit(self):
        self.save_fixture(23.0)
        response = self.client.post("/api/analytics/academic-prediction", json=self.payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["predicted_grade"], 20.0)
        self.assertEqual(response.json()["raw_prediction"], 23.0)
        self.assertTrue(response.json()["display_clipped"])

    def test_corrupt_artifact_returns_503(self):
        self.save_fixture()
        (self.directory / "student_model.joblib").write_bytes(b"invalid")
        response = self.client.post("/api/analytics/academic-prediction", json=self.payload)
        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()
