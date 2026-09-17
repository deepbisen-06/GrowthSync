"""Data-contract and chronological-feature checks; no database required."""

import tempfile
import unittest
from pathlib import Path

import pandas as pd

from scripts.train_finance_model import make_features, prepare as prepare_finance
from scripts.train_habit_model import prepare as prepare_habits


class TrainingDataTests(unittest.TestCase):
    def test_lags_do_not_use_current_or_future_expenses(self):
        series = pd.DataFrame({"expense_total": [10., 20., 30., 40., 50., 60.]},
                              index=pd.period_range("2020-01", periods=6, freq="M"))
        original = make_features(series)
        changed = series.copy()
        changed.iloc[3:, 0] = 99999
        updated = make_features(changed)
        for column in ["expense_lag_1", "expense_lag_2", "expense_lag_3", "expense_mean_3"]:
            self.assertEqual(original.iloc[0][column], updated.iloc[0][column])
        self.assertEqual(original.iloc[0].expense_mean_3, 20.)

    def test_credit_card_repayments_do_not_double_count_spending(self):
        rows = []
        for month in pd.date_range("2020-01-01", periods=18, freq="MS"):
            for category, kind, amount in [("Groceries", "debit", 100),
                                            ("Credit Card Payment", "debit", 100),
                                            ("Credit Card Payment", "credit", 100),
                                            ("Paycheck", "credit", 500)]:
                rows.append({"Date": month, "Category": category,
                             "Transaction Type": kind, "Amount": amount})
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "transactions.csv"
            pd.DataFrame(rows).to_csv(path, index=False)
            monthly, audit = prepare_finance(path)
        self.assertTrue(monthly.expense_total.eq(100).all())
        self.assertTrue(monthly.paycheck_total.eq(500).all())
        self.assertEqual(audit["excluded_credit_card_payment_rows"], 36)

    def test_habit_units_and_name_exclusion(self):
        rows = [{"Name": "fixture", "Screen Time (hrs/day)": 4,
                 "Sleep Duration (hrs)": 8, "Physical Activity (hrs/week)": 7,
                 "Stress Level": label} for label in ["Low", "Medium", "High"] for _ in range(10)]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "habits.csv"
            pd.DataFrame(rows).to_csv(path, index=False)
            X, _, _ = prepare_habits(path)
            self.assertNotIn("Name", X)
            self.assertTrue(X.activity_hours_per_week.eq(7).all())
            rows[0]["Sleep Duration (hrs)"] = 25
            pd.DataFrame(rows).to_csv(path, index=False)
            with self.assertRaises(ValueError):
                prepare_habits(path)

    def test_missing_finance_month_is_not_silently_zero_filled(self):
        dates = pd.date_range("2020-01-01", periods=20, freq="MS").delete(5)
        rows = pd.DataFrame({"Date": dates, "Amount": 100,
                             "Category": "Groceries", "Transaction Type": "debit"})
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "transactions.csv"
            rows.to_csv(path, index=False)
            with self.assertRaisesRegex(ValueError, "Entire months are missing"):
                prepare_finance(path)


if __name__ == "__main__":
    unittest.main()
