"""Validate a UCI Student Performance CSV downloaded from Kaggle.

This prepares a separate offline academic experiment; it does not seed users,
train the existing forecasters, or change dashboard predictions.
"""

import argparse
import csv
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path

# Preserve the original categorical studytime scale; it is not daily hours.
COLUMNS = {"studytime": (1, 4), "failures": (0, 4), "absences": (0, 93), "G3": (0, 20)}
ROOT = Path(__file__).resolve().parents[1]


def prepare(source: Path, output: Path, source_url: str) -> dict:
    """Validate all rows before writing a minimal, duplicate-free numeric dataset."""
    payload = source.read_bytes()
    text = payload.decode("utf-8-sig")
    delimiter = ";" if ";" in text.splitlines()[0] else ","
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    missing = set(COLUMNS) - set(reader.fieldnames or [])
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")
    rows, seen = [], set()
    total, duplicates = 0, 0
    for line, row in enumerate(reader, start=2):
        total += 1
        if None in row or any(value is None for value in row.values()):
            raise ValueError(f"Malformed CSV row at line {line}")
        parsed = {}
        for column, (low, high) in COLUMNS.items():
            try:
                value = int(row[column])
            except (ValueError, TypeError) as exc:
                raise ValueError(f"Line {line}: {column} must be an integer") from exc
            if not low <= value <= high:
                raise ValueError(f"Line {line}: {column} must be between {low} and {high}")
            parsed[column] = value
        # Compare original full rows, not just selected features: different students
        # may legitimately have the same studytime, failures, absences and grade.
        fingerprint = tuple(row.values())
        if fingerprint in seen:
            duplicates += 1
            continue
        seen.add(fingerprint)
        rows.append(parsed)
    if not rows:
        raise ValueError("Dataset contains no valid records")
    output.mkdir(parents=True, exist_ok=True)
    csv_path = output / "student_performance.csv"
    if source.resolve() == csv_path.resolve():
        raise ValueError("Input must be kept separately from processed output")
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(COLUMNS))
        writer.writeheader()
        writer.writerows(rows)
    report = {
        "source_file": source.name,
        "source_url": source_url,
        "original_source": "https://archive.ics.uci.edu/dataset/320/student+performance",
        "source_sha256": hashlib.sha256(payload).hexdigest(),
        "prepared_at_utc": datetime.now(timezone.utc).isoformat(),
        "input_rows": total,
        "output_rows": len(rows),
        "exact_duplicate_rows_removed": duplicates,
        "features": list(COLUMNS)[:-1],
        "target": "G3",
        "excluded_prior_grades": ["G1", "G2"],
        "training_status": "not_trained",
        "limitations": [
            "Historical Portuguese secondary-school data; not validated for Indian college students.",
            "studytime is a weekly category 1-4, not exact hours.",
            "absences is a course-level total: this is not a start-of-term predictor.",
            "No dates or personal finance fields; unsuitable for personal time-series forecasting.",
            "Use only one subject file per experiment to avoid cross-subject student overlap.",
            "Provenance URL is user-supplied; schema validation does not authenticate the source.",
        ],
    }
    (output / "data_report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="Downloaded student-mat.csv")
    parser.add_argument("--output", type=Path, default=ROOT / "datasets/processed/student")
    parser.add_argument("--source-url", required=True, help="Exact Kaggle page used to download")
    args = parser.parse_args()
    try:
        report = prepare(args.input, args.output, args.source_url)
    except (OSError, ValueError, IndexError, csv.Error) as exc:
        parser.exit(1, f"Dataset preparation failed: {exc}\n")
    print(f"Prepared {report['output_rows']} rows in {args.output}. No model was trained.")


if __name__ == "__main__":
    main()
