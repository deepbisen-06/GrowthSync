import csv
import io

from sqlalchemy.orm import Session

from backend.app.models.financial import FinancialRecord
from backend.app.models.habit import HabitRecord
from backend.app.models.study import StudyRecord
from backend.app.models.user import User


def generate_anonymized_dataset_csv(db: Session) -> str:
    """
    Generates a unified, anonymized CSV string containing all collected user records.
    PII (names, email addresses, password hashes) is completely excluded for privacy and ML readiness.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # Write Header
    writer.writerow(
        [
            "record_category",
            "anonymous_user_id",
            "user_age",
            "user_gender",
            "user_education_level",
            "user_course",
            "financial_income",
            "financial_expenses",
            "financial_savings",
            "financial_goal",
            "study_hours",
            "study_subjects",
            "study_academic_goal",
            "study_date",
            "habit_sleep_hours",
            "habit_exercise_minutes",
            "habit_screen_time",
            "habit_notes",
            "habit_record_date",
            "record_created_at",
        ]
    )

    users = db.query(User).all()
    user_map = {u.id: u for u in users}

    # 1. Financial Records
    financials = db.query(FinancialRecord).all()
    for rec in financials:
        u = user_map.get(rec.user_id)
        writer.writerow(
            [
                "FINANCIAL",
                f"anon_usr_{rec.user_id:04d}",
                u.age if u else "",
                u.gender if u else "",
                u.education_level if u else "",
                u.course if u else "",
                rec.monthly_income,
                rec.monthly_expenses,
                rec.monthly_savings,
                rec.financial_goal,
                "",
                "",
                "",
                "",  # Study fields
                "",
                "",
                "",
                "",
                "",  # Habit fields
                rec.created_at.strftime("%Y-%m-%d %H:%M:%S") if rec.created_at else "",
            ]
        )

    # 2. Study Records
    studies = db.query(StudyRecord).all()
    for rec in studies:
        u = user_map.get(rec.user_id)
        writer.writerow(
            [
                "STUDY",
                f"anon_usr_{rec.user_id:04d}",
                u.age if u else "",
                u.gender if u else "",
                u.education_level if u else "",
                u.course if u else "",
                "",
                "",
                "",
                "",  # Financial fields
                rec.study_hours,
                rec.subjects,
                rec.academic_goal,
                rec.study_date.strftime("%Y-%m-%d") if rec.study_date else "",
                "",
                "",
                "",
                "",
                "",  # Habit fields
                rec.created_at.strftime("%Y-%m-%d %H:%M:%S") if rec.created_at else "",
            ]
        )

    # 3. Habit Records
    habits = db.query(HabitRecord).all()
    for rec in habits:
        u = user_map.get(rec.user_id)
        writer.writerow(
            [
                "HABIT",
                f"anon_usr_{rec.user_id:04d}",
                u.age if u else "",
                u.gender if u else "",
                u.education_level if u else "",
                u.course if u else "",
                "",
                "",
                "",
                "",  # Financial fields
                "",
                "",
                "",
                "",  # Study fields
                rec.sleep_hours,
                rec.exercise_minutes,
                rec.screen_time,
                rec.habit_notes or "",
                rec.record_date.strftime("%Y-%m-%d") if rec.record_date else "",
                rec.created_at.strftime("%Y-%m-%d %H:%M:%S") if rec.created_at else "",
            ]
        )

    return output.getvalue()
