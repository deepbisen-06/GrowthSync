import unittest
from datetime import date, datetime
from types import SimpleNamespace
from backend.app.services.financial_twin import financial_baseline, simulate_finances


def record(income=100000, expenses=80000, day='2026-09-01', rid=1):
    return SimpleNamespace(id=rid, created_at=datetime.fromisoformat(day), monthly_income=income, monthly_expenses=expenses)


class FinancialTwinTests(unittest.TestCase):
    def baseline(self, records=None):
        return financial_baseline(records if records is not None else [record()], date(2026,9,17))

    def test_mentor_example(self):
        result=simulate_finances(self.baseline(), target_rate=30, risk_expense_increase=10000)
        self.assertEqual([s['ending_balance'] for s in result['scenarios']], [240000,360000,120000])
        self.assertEqual(result['required_expense_reduction'],10000)
        self.assertEqual(result['scenarios'][1]['difference'],120000)

    def test_empty_does_not_invent_income(self):
        b=self.baseline([])
        self.assertFalse(b['available'])
        with self.assertRaises(ValueError): simulate_finances(b)

    def test_zero_income_and_deficit_preserved(self):
        b=self.baseline([record(0,1000)])
        self.assertIsNone(b['savings_rate'])
        result=simulate_finances(b, months=3, starting_balance=500)
        self.assertEqual(result['scenarios'][0]['ending_balance'],-2500)
        self.assertTrue(any('deficit' in r['title'] for r in result['recommendations']))

    def test_latest_month_snapshot_not_summed(self):
        b=self.baseline([record(50000,20000,'2026-08-01'),record(),record(100000,70000,rid=2)])
        self.assertEqual(b['observed_months'],2)
        self.assertEqual(b['latest']['expenses'],70000)
        self.assertEqual(b['average_expenses'],45000)

    def test_invalid_and_future_records_excluded(self):
        b=self.baseline([record(),record(float('nan')),record(day='2026-10-01')])
        self.assertEqual(b['excluded_records'],2)
        self.assertEqual(b['latest']['income'],100000)

    def test_reset_matches_current_with_same_target(self):
        result=simulate_finances(self.baseline(), target_rate=20)
        self.assertEqual(len({s['ending_balance'] for s in result['scenarios']}),1)

    def test_income_change_and_risk_are_separate(self):
        result=simulate_finances(self.baseline(), months=6,target_rate=50,income_change=20000,risk_income_drop_pct=10)
        self.assertEqual(result['scenarios'][1]['monthly_savings'],60000)
        self.assertEqual(result['scenarios'][2]['monthly_savings'],10000)
        self.assertEqual(result['scenarios'][1]['points'][0]['balance'],0)

    def test_rejects_invalid_assumptions(self):
        for kwargs in [{'target_rate':101},{'target_rate':float('nan')},{'months':5},{'income_change':-100001},{'starting_balance':-1},{'risk_expense_increase':-1}]:
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                simulate_finances(self.baseline(),**kwargs)

    def test_stale_and_missing_months(self):
        b=self.baseline([record(day='2026-01-01'),record(day='2026-04-01')])
        self.assertEqual(b['observed_months'],2)
        self.assertTrue(any('62 days' in w for w in b['warnings']))

    def test_does_not_modify_records(self):
        r=record(); before=vars(r).copy()
        simulate_finances(self.baseline([r]))
        self.assertEqual(vars(r),before)


if __name__=='__main__': unittest.main()
