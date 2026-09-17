"""Dated personal trends. Missing days remain unknown, never zero-filled."""

from datetime import date, timedelta
from math import isfinite

import numpy as np
from sklearn.linear_model import LinearRegression


def personal_trends(records, kind, today=None):
    today = today or date.today()
    date_field = "study_date" if kind == "study" else "record_date"
    fields = [("study_hours", "Study hours", "hours", 24)] if kind == "study" else [
        ("sleep_hours", "Sleep duration", "hours", 24),
        ("exercise_minutes", "Exercise", "minutes", 1440),
        ("screen_time", "Screen time", "hours", 24),
    ]
    grouped = {}
    ignored = 0
    for record in sorted(records, key=lambda r: r.id):
        day = getattr(record, date_field)
        values = {key: float(getattr(record, key)) for key, _, _, _ in fields}
        if day > today or any(not isfinite(values[key]) or not 0 <= values[key] <= cap
                              for key, _, _, cap in fields):
            ignored += 1
            continue
        if kind == "study" and day in grouped:
            grouped[day]["study_hours"] += values["study_hours"]
        else:
            grouped[day] = values
    invalid_days = [day for day, values in grouped.items()
                    if any(values[key] > cap for key, _, _, cap in fields)]
    for day in invalid_days:
        del grouped[day]
    days = sorted(grouped)
    count = len(days)
    stale = bool(days and (today - days[-1]).days > 7)
    can_forecast = count >= 7 and not stale
    message = ("Preliminary linear trend estimates, not guaranteed outcomes."
               if can_forecast else "Add logs on at least 7 distinct dates to unlock forecasts.")
    if stale:
        message = "Your latest log is over 7 days old. Add recent records to unlock forecasts."
    if ignored or invalid_days:
        message += f" Excluded {ignored} invalid/future records and {len(invalid_days)} days exceeding daily limits."
    series = []
    x = np.array([(day - days[0]).days for day in days]).reshape(-1, 1) if days else None
    for key, label, unit, cap in fields:
        y = np.array([grouped[day][key] for day in days])
        forecast, evaluation = [], None
        if can_forecast:
            model = LinearRegression().fit(x, y)
            for step in range(1, 8):
                day = today + timedelta(days=step)
                value = float(np.clip(model.predict([[(day - days[0]).days]])[0], 0, cap))
                forecast.append({"date": day.isoformat(), "value": round(value, 2)})
        if count >= 14:
            split = count - max(3, count // 5)
            predicted = np.clip(LinearRegression().fit(x[:split], y[:split]).predict(x[split:]), 0, cap)
            error = y[split:] - predicted
            evaluation = {
                "train_dates": split, "test_dates": count - split,
                "mae": round(float(np.abs(error).mean()), 3),
                "rmse": round(float(np.sqrt((error ** 2).mean())), 3),
                "baseline_mae": round(float(np.abs(y[split:] - y[split - 1]).mean()), 3),
                "protocol": "Latest observed dates held out; fixed linear regression versus last training value.",
            }
        series.append({"key": key, "label": label, "unit": unit,
                       "average": round(float(y.mean()), 2) if count else None,
                       "history": [{"date": day.isoformat(), "value": grouped[day][key]} for day in days],
                       "forecast": forecast, "evaluation": evaluation})
    return {"kind": kind, "observed_dates": count, "can_forecast": can_forecast,
            "message": message, "series": series,
            "aggregation": "Same-day study sessions are summed." if kind == "study" else
            "For multiple daily habit logs, the latest saved record for that date is used.",
            "missing_days": "Unlogged days are unknown. Forecasts assume recorded days represent your routine."}
