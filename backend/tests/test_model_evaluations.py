"""Summary validation checks; no third-party dependencies or database required."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from backend.app.services import model_evaluation_service as service


class ModelEvaluationTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        override = patch.object(service, "ARTIFACTS", self.root)
        override.start()
        self.addCleanup(override.stop)

    def save(self, kind, report):
        path = self.root / f"{kind}_model"
        path.mkdir(exist_ok=True)
        (path / "metrics.json").write_text(json.dumps(report))

    def habit(self):
        return {"train_rows": 800, "test_rows": 200, "prepared_data": {"source_rows": 1000},
                "labels": ["Low", "Medium", "High"], "selected_model": "logistic_regression",
                "test_metrics": {"majority_baseline": {"macro_f1": .219, "balanced_accuracy": 1/3},
                                 "logistic_regression": {"macro_f1": .317, "balanced_accuracy": .320}},
                "private_rows": "DO NOT EXPOSE"}

    def test_missing_reports_are_not_zero_scores(self):
        response = service.get_model_evaluations()
        self.assertEqual(response["habit"]["status"], "missing")
        self.assertNotIn("rows", response["habit"])

    def test_saved_scores_selected_model_and_privacy(self):
        self.save("habit", self.habit())
        response = service.get_model_evaluations()
        data = response["habit"]
        self.assertEqual(data["selected"], "logistic_regression")
        self.assertEqual(data["rows"][1]["balanced_accuracy"], .320)
        self.assertIn("not been established", data["interpretation"])
        self.assertNotIn("private_rows", json.dumps(response))
        self.assertNotIn("DO NOT EXPOSE", json.dumps(response))

    def test_invalid_one_does_not_hide_the_other(self):
        self.save("habit", self.habit())
        self.save("finance", {"broken": True})
        response = service.get_model_evaluations()
        self.assertEqual(response["habit"]["status"], "ready")
        self.assertEqual(response["finance"]["status"], "invalid")

    def test_nan_and_bad_counts_are_rejected(self):
        data = self.habit()
        data["test_metrics"]["logistic_regression"]["macro_f1"] = float("nan")
        self.save("habit", data)
        self.assertEqual(service.get_model_evaluations()["habit"]["status"], "invalid")
        data = self.habit()
        data["train_rows"] = 999
        self.save("habit", data)
        self.assertEqual(service.get_model_evaluations()["habit"]["status"], "invalid")

    def test_report_refreshes_without_server_restart(self):
        self.save("habit", self.habit())
        service.get_model_evaluations()
        data = self.habit()
        data["test_metrics"]["logistic_regression"]["macro_f1"] = .5
        self.save("habit", data)
        response = service.get_model_evaluations()
        self.assertEqual(response["habit"]["rows"][1]["macro_f1"], .5)

    def test_finance_selected_strategy_and_unknown_units(self):
        metrics = {name: {"mae": 4400, "rmse": 5100, "r2": -.8}
                   for name in ["last_month", "rolling_mean_3", "ridge"]}
        report = {"preparation": {"transaction_rows": 806, "months": 21,
                  "excluded_credit_card_payment_rows": 143},
                  "training_rows_after_lags": 14, "test_rows": 4,
                  "test_metrics": metrics, "selected_strategy": "rolling_mean_3",
                  "currency": "unspecified source units", "test_months": ["2019-06", "2019-09"]}
        self.save("finance", report)
        data = service.get_model_evaluations()["finance"]
        self.assertEqual(data["selected"], "rolling_mean_3")
        self.assertEqual(data["currency"], "unspecified source units")
        self.assertEqual(data["test_months"], 4)
        self.assertIn("not been established", data["interpretation"])


if __name__ == "__main__":
    unittest.main()
