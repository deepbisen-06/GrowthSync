"""Regression checks for response validation/CORS with sparse personal records."""

import unittest
from datetime import date, timedelta
from types import SimpleNamespace

from fastapi.testclient import TestClient

from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.main import app


class RecordsQuery:
    def __init__(self, rows):
        self.rows = rows

    def filter(self, *args):
        return self

    def order_by(self, *args):
        return self

    def all(self):
        return self.rows


class FixtureDB:
    def __init__(self, count):
        self.count = count

    def query(self, model):
        today = date(2026, 9, 8)
        if model.__name__ == "StudyRecord":
            rows = [SimpleNamespace(id=i+1, study_date=today-timedelta(days=i), study_hours=2.0,
                                    subjects="Fixture", academic_goal="Fixture")
                    for i in range(self.count)]
        elif model.__name__ == "HabitRecord":
            rows = [SimpleNamespace(id=i+1, record_date=today-timedelta(days=i), sleep_hours=8.0,
                                    exercise_minutes=30, screen_time=4.0, habit_notes="")
                    for i in range(self.count)]
        else:
            rows = []
        return RecordsQuery(rows)


class SparseAnalyticsResponseTests(unittest.TestCase):
    def setUp(self):
        self.original_overrides = dict(app.dependency_overrides)
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=1)
        self.client = TestClient(app, raise_server_exceptions=False)

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        app.dependency_overrides.update(self.original_overrides)

    def request(self, endpoint, count):
        app.dependency_overrides[get_db] = lambda: FixtureDB(count)
        return self.client.get(endpoint, headers={"Origin": "http://localhost:5173"})

    def test_empty_dashboard_has_valid_response_and_cors_headers(self):
        result = self.request("/api/analytics/dashboard", 0)
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.headers.get("access-control-allow-origin"), "http://localhost:5173")
        self.assertEqual(result.headers.get("access-control-allow-credentials"), "true")
        self.assertEqual(result.json()["study"]["avg_daily_hours"], 0)
        self.assertEqual(result.json()["habits"]["sleep_consistency_score"], 0)
        self.assertFalse(result.json()["habits"]["has_sufficient_data"])

    def test_one_and_six_days_preserve_observed_study_average(self):
        for count in [1, 6]:
            with self.subTest(count=count):
                result = self.request("/api/analytics/dashboard", count)
                self.assertEqual(result.status_code, 200, result.text)
                self.assertEqual(result.json()["study"]["avg_daily_hours"], 2)
                self.assertEqual(result.json()["study"]["observation_count"], count)

    def test_individual_routes_handle_no_history(self):
        for endpoint in ["/api/analytics/study-forecast", "/api/analytics/habit-analysis"]:
            with self.subTest(endpoint=endpoint):
                result = self.request(endpoint, 0)
                self.assertEqual(result.status_code, 200, result.text)
                self.assertFalse(result.json()["has_sufficient_data"])

    def test_full_history_and_demo_still_validate(self):
        for endpoint in ["/api/analytics/dashboard", "/api/analytics/demo-data"]:
            with self.subTest(endpoint=endpoint):
                result = self.request(endpoint, 14)
                self.assertEqual(result.status_code, 200, result.text)
                self.assertTrue(result.json()["study"]["has_sufficient_data"])


if __name__ == "__main__":
    unittest.main()
