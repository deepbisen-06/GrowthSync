"""Build anonymous grouped chart data from the supplied source CSV files."""
import argparse
import csv
import hashlib
import json
from pathlib import Path


def read_rows(path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        sample = stream.read(4096)
        stream.seek(0)
        return list(csv.DictReader(stream, dialect=csv.Sniffer().sniff(sample, delimiters=",;")))


def chart(rows, group, value, labels, title, unit):
    points = []
    for key, label in labels:
        numbers = [float(row[value]) for row in rows if row[group] == key]
        if numbers:
            points.append({"label": label, "value": round(sum(numbers) / len(numbers), 3), "count": len(numbers)})
    return {"title": title, "unit": unit, "points": points}


def build(student, habit):
    students, habits = read_rows(student), read_rows(habit)
    stress = [(name, name) for name in ["Low", "Medium", "High"]]
    return {
        "student": {"rows": len(students), "source": student.name,
                    "sha256": hashlib.sha256(student.read_bytes()).hexdigest(),
                    "description": "Historical Portuguese student records. Group averages describe this dataset, not your grades or changes over time.",
                    "charts": [chart(students, "studytime", "G3", [("1", "<2 hours"), ("2", "2–5 hours"), ("3", "5–10 hours"), ("4", ">10 hours")], "Weekly study-time category vs average final grade", "grade / 20"),
                               chart(students, "failures", "G3", [(str(i), str(i)) for i in range(4)], "Previous failures vs average final grade", "grade / 20")]},
        "habit": {"rows": len(habits), "source": habit.name,
                  "sha256": hashlib.sha256(habit.read_bytes()).hexdigest(),
                  "description": "Reported survey stress groups. Associations are not causal effects or personal stress predictions. Source collection method is unverified.",
                  "charts": [chart(habits, "Stress Level", field, stress, title, unit) for field, title, unit in [
                      ("Sleep Duration (hrs)", "Average sleep by reported stress category", "hours"),
                      ("Screen Time (hrs/day)", "Average screen time by reported stress category", "hours/day"),
                      ("Physical Activity (hrs/week)", "Average physical activity by reported stress category", "hours/week")]]}}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--student", type=Path, required=True)
    parser.add_argument("--habit", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("datasets/processed/dataset_analysis.json"))
    args = parser.parse_args()
    result = build(args.student, args.habit)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Built dataset charts: {result['student']['rows']} student rows, {result['habit']['rows']} survey rows")
