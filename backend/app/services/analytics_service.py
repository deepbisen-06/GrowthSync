"""
Analytics Service Layer for GrowthSync Milestone 2.
Coordinates data retrieval, ML engine execution, threat detection, and demo data generation.
Enforces strict multi-tenant user data isolation.
"""

from datetime import date, datetime, timedelta
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from backend.app.ml.financial_forecast import forecast_financials
from backend.app.ml.habit_analysis import analyze_habits
from backend.app.ml.productivity_model import analyze_productivity
from backend.app.ml.risk_engine import evaluate_risks
from backend.app.ml.study_model import forecast_study
from backend.app.models.expense import ExpenseRecord
from backend.app.models.financial import FinancialRecord
from backend.app.models.habit import HabitRecord
from backend.app.models.study import StudyRecord


class AnalyticsService:
    @staticmethod
    def get_financial_forecast(user_id: int, db: Session) -> Dict[str, Any]:
        """Fetch user records and execute financial linear regression forecast."""
        fin_records = (
            db.query(FinancialRecord)
            .filter(FinancialRecord.user_id == user_id)
            .order_by(FinancialRecord.created_at.asc())
            .all()
        )

        exp_records = (
            db.query(ExpenseRecord)
            .filter(ExpenseRecord.user_id == user_id)
            .order_by(ExpenseRecord.expense_date.asc())
            .all()
        )

        return forecast_financials(fin_records, exp_records)

    @staticmethod
    def get_productivity_analysis(user_id: int, db: Session) -> Dict[str, Any]:
        """Fetch user records and execute productivity scoring & trend analysis."""
        study_records = (
            db.query(StudyRecord)
            .filter(StudyRecord.user_id == user_id)
            .order_by(StudyRecord.study_date.asc())
            .all()
        )

        habit_records = (
            db.query(HabitRecord)
            .filter(HabitRecord.user_id == user_id)
            .order_by(HabitRecord.record_date.asc())
            .all()
        )

        return analyze_productivity(study_records, habit_records)

    @staticmethod
    def get_study_forecast(user_id: int, db: Session) -> Dict[str, Any]:
        """Fetch study records and calculate weekly projections & Best Study Day."""
        study_records = (
            db.query(StudyRecord)
            .filter(StudyRecord.user_id == user_id)
            .order_by(StudyRecord.study_date.asc())
            .all()
        )

        return forecast_study(study_records)

    @staticmethod
    def get_habit_analysis(user_id: int, db: Session) -> Dict[str, Any]:
        """Fetch habit records and execute multi-habit statistical trends."""
        habit_records = (
            db.query(HabitRecord)
            .filter(HabitRecord.user_id == user_id)
            .order_by(HabitRecord.record_date.asc())
            .all()
        )

        return analyze_habits(habit_records)

    @staticmethod
    def get_future_risks(user_id: int, db: Session) -> List[Dict[str, Any]]:
        """Identify potential negative threats across all personal domains."""
        fin = AnalyticsService.get_financial_forecast(user_id, db)
        prod = AnalyticsService.get_productivity_analysis(user_id, db)
        habits = AnalyticsService.get_habit_analysis(user_id, db)
        return evaluate_risks(fin, prod, habits)

    @staticmethod
    def get_full_dashboard(user_id: int, db: Session) -> Dict[str, Any]:
        """Unified aggregated analytics payload for high-performance dashboard load."""
        fin = AnalyticsService.get_financial_forecast(user_id, db)
        prod = AnalyticsService.get_productivity_analysis(user_id, db)
        study = AnalyticsService.get_study_forecast(user_id, db)
        habits = AnalyticsService.get_habit_analysis(user_id, db)
        risks = evaluate_risks(fin, prod, habits)

        return {
            "financial": fin,
            "productivity": prod,
            "study": study,
            "habits": habits,
            "risks": risks,
            "is_demo_mode": False,
        }

    @staticmethod
    def generate_demo_analytics() -> Dict[str, Any]:
        """
        Generate realistic, labeled DEMO analytics dataset for testing and presentations
        when a real user has not yet accumulated 2-3+ months of history.
        Does NOT touch the database.
        """

        # Synthetic mock records
        class MockRecord:
            def __init__(self, **kwargs):
                self.__dict__.update(kwargs)

        today = date.today()
        # 6 months of historical finances
        mock_fin = []
        base_income = 55000.0
        exp_vals = [32000.0, 33500.0, 31000.0, 34200.0, 35000.0, 36000.0]
        for i, exp in enumerate(exp_vals):
            sav = base_income - exp
            m_date = datetime.now() - timedelta(days=(5 - i) * 30)
            mock_fin.append(
                MockRecord(
                    id=i + 1,
                    created_at=m_date,
                    monthly_income=base_income,
                    monthly_expenses=exp,
                    monthly_savings=sav,
                    financial_goal="Emergency Fund & Tech Certification",
                )
            )

        # Categorized expenses for demo
        categories = ["Food", "Travel", "Education", "Shopping", "Bills", "Entertainment", "Health"]
        amounts = [12000.0, 4500.0, 6000.0, 5000.0, 4000.0, 3000.0, 1500.0]
        mock_exp = []
        for i, (cat, amt) in enumerate(zip(categories, amounts)):
            mock_exp.append(
                MockRecord(
                    id=i + 1,
                    user_id=9999,
                    amount=amt,
                    category=cat,
                    expense_date=today - timedelta(days=i * 4),
                    description=f"Demo {cat} expense",
                    created_at=datetime.now(),
                )
            )

        # 21 days of study logs
        mock_study = []
        study_hours = [2.5, 3.0, 4.0, 1.5, 3.5, 5.0, 4.5] * 3
        for i, hrs in enumerate(study_hours):
            s_date = today - timedelta(days=20 - i)
            mock_study.append(
                MockRecord(
                    id=i + 1,
                    study_hours=hrs,
                    subjects="Data Science, Machine Learning, Python",
                    academic_goal="Master Predictive Analytics",
                    study_date=s_date,
                )
            )

        # 21 days of habits
        mock_habit = []
        sleep_hours = [7.5, 8.0, 7.0, 6.5, 8.0, 8.5, 7.5] * 3
        ex_mins = [30, 45, 0, 30, 60, 45, 20] * 3
        screen_hours = [5.0, 4.5, 6.0, 5.5, 4.0, 3.5, 4.5] * 3

        for i in range(21):
            h_date = today - timedelta(days=20 - i)
            mock_habit.append(
                MockRecord(
                    id=i + 1,
                    sleep_hours=sleep_hours[i],
                    exercise_minutes=ex_mins[i],
                    screen_time=screen_hours[i],
                    habit_notes="Daily routine logged",
                    record_date=h_date,
                )
            )

        fin = forecast_financials(mock_fin, mock_exp)
        prod = analyze_productivity(mock_study, mock_habit)
        study = forecast_study(mock_study)
        habits = analyze_habits(mock_habit)
        risks = evaluate_risks(fin, prod, habits)

        return {
            "financial": fin,
            "productivity": prod,
            "study": study,
            "habits": habits,
            "risks": risks,
            "is_demo_mode": True,
        }
