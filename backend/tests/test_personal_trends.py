import unittest
from datetime import date, timedelta
from types import SimpleNamespace

from backend.app.ml.personal_trends import personal_trends


class PersonalTrendTests(unittest.TestCase):
    today = date(2026, 9, 11)

    def study(self, i, day, hours=2):
        return SimpleNamespace(id=i, study_date=day, study_hours=hours)

    def test_empty_has_no_fake_forecast(self):
        result = personal_trends([], "study", self.today)
        self.assertEqual(result["series"][0]["forecast"], [])
        self.assertIsNone(result["series"][0]["average"])

    def test_duplicate_sessions_do_not_unlock_forecast(self):
        records = [self.study(i, self.today, 1) for i in range(8)]
        result = personal_trends(records, "study", self.today)
        self.assertEqual(result["observed_dates"], 1)
        self.assertEqual(result["series"][0]["history"][0]["value"], 8)
        self.assertFalse(result["can_forecast"])

    def test_invalid_daily_total_is_excluded(self):
        result = personal_trends([self.study(1, self.today, 20), self.study(2, self.today, 10)], "study", self.today)
        self.assertEqual(result["observed_dates"], 0)

    def test_calendar_spacing_and_future_dates(self):
        records = [self.study(i, self.today - timedelta(days=12-2*i), i+1) for i in range(7)]
        result = personal_trends(records, "study", self.today)["series"][0]
        self.assertEqual(len(result["history"]), 7)
        self.assertEqual(result["forecast"][0], {"date": "2026-09-12", "value": 7.5})

    def test_stale_history_suppresses_forecast(self):
        records = [self.study(i, self.today - timedelta(days=30+i)) for i in range(14)]
        self.assertFalse(personal_trends(records, "study", self.today)["can_forecast"])

    def test_holdout_does_not_train_on_test_values(self):
        records = [self.study(i, self.today - timedelta(days=13-i), 2 if i < 11 else 8) for i in range(14)]
        metrics = personal_trends(records, "study", self.today)["series"][0]["evaluation"]
        self.assertEqual(metrics["test_dates"], 3)
        self.assertEqual(metrics["mae"], 6)

    def test_latest_habit_record_wins_without_summing_sleep(self):
        records = [SimpleNamespace(id=i, record_date=self.today, sleep_hours=7+i,
                                   exercise_minutes=30, screen_time=4) for i in [1, 2]]
        result = personal_trends(records, "habit", self.today)
        self.assertEqual(result["series"][0]["average"], 9)


if __name__ == "__main__":
    unittest.main()
