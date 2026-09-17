"""Evaluate one-month-ahead spending forecasts on the supplied transaction file.

Credit Card Payment rows are excluded as transfers for the spending experiment.
All supplied accounts are aggregated; currency and household ownership are unverified.
"""

import argparse
import hashlib
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
FEATURES = ["expense_lag_1", "expense_lag_2", "expense_lag_3", "expense_mean_3"]


def prepare(source: Path):
    if source.suffix.lower() == ".csv":
        rows = pd.read_csv(source)
    else:
        rows = pd.read_excel(source, sheet_name=0)
    required = {"Date", "Amount", "Transaction Type", "Category"}
    if required - set(rows.columns):
        raise ValueError(f"Missing columns: {sorted(required - set(rows.columns))}")
    if rows[list(required)].isna().any().any():
        raise ValueError("Required transaction fields contain missing values")
    rows["Date"] = pd.to_datetime(rows["Date"], errors="raise")
    if rows["Date"].isna().any():
        raise ValueError("Invalid transaction dates")
    rows["Amount"] = pd.to_numeric(rows["Amount"], errors="raise")
    if not np.isfinite(rows["Amount"]).all() or (rows["Amount"] < 0).any():
        raise ValueError("Expected finite, nonnegative amounts with debit/credit in Transaction Type")
    types = rows["Transaction Type"].astype(str).str.strip().str.lower()
    categories = rows["Category"].astype(str).str.strip().str.lower()
    if not types.isin(["debit", "credit"]).all():
        raise ValueError("Transaction Type must be debit or credit")
    periods = rows["Date"].dt.to_period("M")
    if "Month" in rows and not rows["Month"].astype(str).eq(periods.astype(str)).all():
        raise ValueError("Month column disagrees with transaction dates")
    months = pd.period_range(periods.min(), periods.max(), freq="M")
    if len(months) < 18:
        raise ValueError("At least 18 calendar months are required for this small forecasting experiment")
    if len(set(months) - set(periods)):
        raise ValueError("Entire months are missing. Resolve data coverage before assuming zero spending")
    transfers = categories.eq("credit card payment")
    spending = types.eq("debit") & ~transfers
    salary = types.eq("credit") & categories.eq("paycheck")
    monthly = pd.DataFrame(index=months)
    monthly.index.name = "month"
    monthly["expense_total"] = rows.loc[spending].groupby(periods[spending])["Amount"].sum().reindex(months, fill_value=0)
    monthly["paycheck_total"] = rows.loc[salary].groupby(periods[salary])["Amount"].sum().reindex(months, fill_value=0)
    audit = {
        "transaction_rows": len(rows), "months": len(months),
        "first_date": str(rows.Date.min().date()), "last_date": str(rows.Date.max().date()),
        "excluded_credit_card_payment_rows": int(transfers.sum()),
        "spending_rows": int(spending.sum()), "paycheck_rows": int(salary.sum()),
        "other_credit_rows": int((types.eq("credit") & ~salary & ~transfers).sum()),
        "exact_duplicate_rows_retained": int(rows.duplicated().sum()),
        "transfer_policy": "Exclude Category=Credit Card Payment; assumes these are internal repayments",
        "coverage_assumption": "Every represented month is assumed complete; not verified from a bank statement",
    }
    return monthly, audit


def make_features(monthly):
    frame = monthly.copy()
    for lag in [1, 2, 3]:
        frame[f"expense_lag_{lag}"] = frame.expense_total.shift(lag)
    frame["expense_mean_3"] = frame.expense_total.shift(1).rolling(3).mean()
    return frame.dropna(subset=FEATURES)


def predictions_for(name, X, ridge):
    if name == "last_month":
        return X["expense_lag_1"].to_numpy()
    if name == "rolling_mean_3":
        return X["expense_mean_3"].to_numpy()
    return ridge.predict(X)


def evaluate(actual, predicted):
    return {
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(np.sqrt(mean_squared_error(actual, predicted))),
        "r2": float(r2_score(actual, predicted)),
    }


def train(source: Path, output: Path, currency: str):
    monthly, audit = prepare(source)
    data = make_features(monthly)
    # Reserve the latest four monthly targets before model/parameter selection.
    training, testing = data.iloc[:-4], data.iloc[-4:]
    X_train, y_train = training[FEATURES], training.expense_total
    X_test, y_test = testing[FEATURES], testing.expense_total
    folds = list(TimeSeriesSplit(n_splits=3).split(X_train))
    ridge_search = GridSearchCV(
        Pipeline([("scale", StandardScaler()), ("ridge", Ridge())]),
        {"ridge__alpha": [0.1, 1.0, 10.0, 100.0]}, cv=folds,
        scoring="neg_mean_absolute_error", n_jobs=1, error_score="raise",
    )
    ridge_search.fit(X_train, y_train)
    ridge = ridge_search.best_estimator_
    cv_mae = {}
    for name in ["last_month", "rolling_mean_3"]:
        cv_mae[name] = float(np.mean([
            mean_absolute_error(y_train.iloc[validation], predictions_for(name, X_train.iloc[validation], ridge))
            for _, validation in folds
        ]))
    cv_mae["ridge"] = float(-ridge_search.best_score_)
    selected_name = min(cv_mae, key=cv_mae.get)
    test_predictions = {name: predictions_for(name, X_test, ridge) for name in cv_mae}
    results = {name: evaluate(y_test, predicted) for name, predicted in test_predictions.items()}
    # Latest observed expenses form one next-month feature vector. No future rows are used.
    latest = monthly.expense_total.to_numpy()
    next_X = pd.DataFrame([[latest[-1], latest[-2], latest[-3], latest[-3:].mean()]], columns=FEATURES)
    raw_next = float(predictions_for(selected_name, next_X, ridge)[0])
    next_month = str(monthly.index[-1] + 1)
    artifact = {
        "artifact_format": "growthsync_finance_v1", "strategy": selected_name,
        "estimator": ridge if selected_name == "ridge" else None,
        "features": FEATURES, "currency": currency,
    }
    report = {
        "task": "one-month-ahead expense forecast", "source_file": source.name,
        "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "source_provenance": "User-supplied file; origin, currency and account ownership not verified",
        "currency": currency, "preparation": audit, "features": FEATURES, "target": "expense_total",
        "training_rows_after_lags": len(training), "test_rows": len(testing),
        "train_months": [str(training.index.min()), str(training.index.max())],
        "test_months": [str(testing.index.min()), str(testing.index.max())],
        "training_cv_mae": cv_mae, "best_ridge_alpha": ridge_search.best_params_["ridge__alpha"],
        "selected_strategy": selected_name, "selection_rule": "Lowest training expanding-window CV MAE",
        "test_metrics": results, "model_fit_scope": "Training partition only; not refitted on test labels",
        "evaluation_protocol": "Rolling one-step predictions: previous test-month actual spending is available for later targets; not a four-month forecast made at one date",
        "next_month_from_dataset": next_month, "next_forecast_raw": raw_next,
        "next_forecast_nonnegative_display": max(0.0, raw_next),
        "versions": {"sklearn": sklearn.__version__, "pandas": pd.__version__, "numpy": np.__version__, "joblib": joblib.__version__},
        "limitations": [
            "Only four held-out monthly targets; reported metrics are unstable and not general performance guarantees.",
            "All accounts are combined, assuming one budget and common currency. Transfers need source review.",
            "The next month is relative to the historical dataset, not today's month or your personal future expenses.",
            "A baseline winning is valid; do not describe a baseline strategy as a trained Ridge model.",
            "Forecasts are spending experiments, not investment or financial advice. No dashboard integration is performed.",
        ],
    }
    output.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, output / "finance_model.joblib")
    joblib.dump(ridge, output / "ridge_model.joblib")
    (output / "metrics.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")
    monthly.to_csv(output / "monthly_finance_data.csv")
    validation = testing[["expense_total"]].rename(columns={"expense_total": "actual_expense"})
    for name, predicted in test_predictions.items():
        validation[name] = predicted
    validation.to_csv(output / "test_predictions.csv")
    restored = joblib.load(output / "finance_model.joblib")
    np.testing.assert_allclose(
        predictions_for(restored["strategy"], X_test, restored["estimator"]), test_predictions[selected_name]
    )
    print(f"Finance preparation: {len(monthly)} months; excluded {audit['excluded_credit_card_payment_rows']} credit-card-payment rows")
    print(f"After 3-month lag creation: {len(training)} training / {len(testing)} testing months")
    for name, result in results.items():
        print(f"{name}: MAE={result['mae']:.2f}; RMSE={result['rmse']:.2f}; R2={result['r2']:.3f}")
    print(f"Selected by training CV: {selected_name}")
    print(f"Dataset next-month estimate ({next_month}): {max(0.0, raw_next):.2f} [{currency}]")
    print(f"Saved in: {output.resolve()}")
    print("Historical experiment only. Metrics use the source currency. Dashboard unchanged.")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT / "datasets/raw/finance/transactions.xlsx")
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts/finance_model")
    parser.add_argument("--currency", default="unspecified source units", help="Only set if verified from the source")
    args = parser.parse_args()
    try:
        train(args.input, args.output, args.currency)
    except (OSError, ValueError, ImportError) as exc:
        parser.exit(1, f"Finance training failed: {exc}\n")


if __name__ == "__main__":
    main()
