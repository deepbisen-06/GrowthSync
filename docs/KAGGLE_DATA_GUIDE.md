# Using real Kaggle data with GrowthSync

## Start with the academic domain

Suggested Kaggle mirror:
https://www.kaggle.com/datasets/larsen0966/student-performance-data-set

Original source and attribution:
Cortez, P. (2008). Student Performance. UCI Machine Learning Repository.
https://doi.org/10.24432/C5TG7T
https://archive.ics.uci.edu/dataset/320/student+performance

The original data came from school reports and questionnaires at two Portuguese
secondary schools. UCI identifies its license as CC BY 4.0. Check that your Kaggle
download is this same dataset and retain attribution and accompanying metadata.
Do not treat any arbitrary Kaggle CSV as verified real observations.

## Download and prepare (Windows)

1. Open the Kaggle page, sign in if requested, and use Download.
2. Extract the download. If it contains a nested `student.zip`, extract that too.
3. Put `student-mat.csv` in `datasets/raw/student/`. Keep the original file unchanged.
4. From the GrowthSync root run:

```powershell
python scripts/prepare_student_data.py --input datasets/raw/student/student-mat.csv --source-url https://www.kaggle.com/datasets/larsen0966/student-performance-data-set
```

The script accepts the original semicolon separator or a comma-separated mirror.
It checks required columns, integer ranges and malformed rows, removes exact full-row
duplicates, and writes `datasets/processed/student/student_performance.csv` plus
`data_report.json` with source URL, SHA-256, counts and limitations. Preparation
fails for invalid data rather than silently substituting synthetic records.
It does not download data, train a model, seed accounts or change the dashboard.

## Field meanings and compatibility

| Source field | Interpretation | Use |
| --- | --- | --- |
| `studytime` | Weekly study-time category, 1–4 | Academic feature; never rename to exact daily `study_hours` |
| `failures` | Prior class-failure count/category | Academic feature |
| `absences` | Course-level absence count | Academic feature only when known at prediction time |
| `G3` | Final grade, 0–20 | Regression target |
| `G1`, `G2` | Earlier period grades | Excluded from prepared baseline; include only in an explicitly later-term experiment |

This dataset has no daily dates, monthly income, sleep duration, exercise minutes
or screen time. It cannot train the existing daily/weekly or financial forecasters.
The absence count also prevents calling this an early-term predictor without a
separate collection-time definition. There are no financial or habit source
columns to map; never invent them or join unrelated people by row number.

## Next experiment, after preparation

- Use one subject file initially. Math and Portuguese contain overlapping students;
  concatenating them and splitting random rows risks leaking students across splits.
- Define the task as offline final-grade prediction using the available features.
- Reserve a reproducible held-out test set (for example 20%, seed 42); tune only
  with cross-validation on the remaining training set.
- Compare a mean-grade DummyRegressor baseline with a simple regularized regression
  pipeline. Fit scaling/encoding inside training folds, never on the whole dataset.
- Report test MAE, RMSE and R-squared with sample counts and baseline comparison.
  Low performance is a result to explain; no accuracy value is promised.
- Save source hash, selected features, split seed, library versions and limitations.
- Add a separate academic prediction input form/API if this experiment is accepted.
  Existing study logs do not collect the required target or all source features.

## Finance and habits

For the current personalized forecasts, actual dated records entered by the user
are the compatible real data source. To evaluate an external finance or habit model,
first find an observational dataset with participant IDs, repeated dates, matching
units and a documented target. Verify original collection and license, then split
by participant or time as appropriate. A synthetic lifestyle or personal-finance
CSV is useful for UI demos, but does not meet the requirement for real collected data.

## Current status

No Kaggle dataset is bundled, no external training has run, and no new model is
connected. Synthetic examples remain clearly separated under `datasets/examples/`.
