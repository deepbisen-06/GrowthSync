"""Dataset-contract checks that run without PostgreSQL or network access."""

import json
import tempfile
import unittest
from pathlib import Path

from scripts.prepare_student_data import prepare


class PrepareStudentDataTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.source = self.root / "student-mat.csv"
        self.output = self.root / "processed"

    def run_preparation(self, text):
        self.source.write_text(text, encoding="utf-8")
        return prepare(self.source, self.output, "https://example.test/dataset")

    def test_original_delimiter_and_duplicate_identity(self):
        report = self.run_preparation(
            "school;studytime;failures;absences;G1;G2;G3\n"
            "GP;2;0;4;10;12;14\nGP;2;0;4;10;12;14\nMS;2;0;4;10;12;14\n"
        )
        self.assertEqual(report["input_rows"], 3)
        self.assertEqual(report["output_rows"], 2)
        self.assertEqual(report["exact_duplicate_rows_removed"], 1)
        self.assertEqual(
            (self.output / "student_performance.csv").read_text().splitlines()[0],
            "studytime,failures,absences,G3",
        )
        saved = json.loads((self.output / "data_report.json").read_text())
        self.assertEqual(saved["training_status"], "not_trained")
        self.assertEqual(len(saved["source_sha256"]), 64)

    def test_comma_delimiter(self):
        report = self.run_preparation("studytime,failures,absences,G3\n1,0,0,20\n")
        self.assertEqual(report["output_rows"], 1)

    def test_missing_column_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Missing required columns"):
            self.run_preparation("studytime,failures,absences\n1,0,0\n")
        self.assertFalse(self.output.exists())

    def test_invalid_category_is_not_converted_to_hours(self):
        with self.assertRaisesRegex(ValueError, "studytime must be between"):
            self.run_preparation("studytime,failures,absences,G3\n8,0,0,14\n")
        self.assertFalse(self.output.exists())

    def test_missing_and_nonfinite_values_are_rejected(self):
        for value in ["", "NaN", "inf", "2.5"]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.run_preparation(f"studytime,failures,absences,G3\n2,0,0,{value}\n")
        self.assertFalse(self.output.exists())

    def test_malformed_row_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Malformed CSV row"):
            self.run_preparation("studytime,failures,absences,G3\n2,0,0,14,extra\n")


if __name__ == "__main__":
    unittest.main()
