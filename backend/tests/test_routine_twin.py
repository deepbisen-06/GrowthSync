import unittest
from datetime import date, timedelta
from types import SimpleNamespace as Row

from backend.app.services.routine_twin import routine_baseline, simulate_routine
from backend.app.ml.personal_trends import personal_trends

TODAY = date(2026,9,17)


def study(hours=2, ago=0, rid=1):
    return Row(id=rid,study_date=TODAY-timedelta(days=ago),study_hours=hours)


def habit(sleep=7, exercise=30, screen=5, ago=0, rid=1):
    return Row(id=rid,record_date=TODAY-timedelta(days=ago),sleep_hours=sleep,
               exercise_minutes=exercise,screen_time=screen)


class RoutineTwinTests(unittest.TestCase):
    def baseline(self, records=None, kind='study'):
        return routine_baseline(records if records is not None else [study()],kind,today=TODAY)

    def test_study_three_scenarios_and_goal(self):
        r=simulate_routine(self.baseline(),reserved_hours=18,study_delta=1,risk_study_loss=1,study_goal_hours=15)
        self.assertEqual([s['metrics'][0]['total'] for s in r['scenarios']],[14,21,7])
        self.assertEqual(r['scenarios'][1]['goal_date'],'2026-09-22')
        self.assertIsNone(r['scenarios'][0]['goal_date'])

    def test_habit_units_and_overlap(self):
        r=simulate_routine(self.baseline([habit()], 'habit'),reserved_hours=12,
                           sleep_delta=1,exercise_delta=30,screen_delta=-1,
                           risk_sleep_loss=1,risk_exercise_loss=15,risk_screen_increase=1)
        self.assertEqual([m['total'] for m in r['scenarios'][1]['metrics']],[56,420,28])
        self.assertEqual(r['scenarios'][1]['daily'][0]['unallocated_hours'],3)

    def test_missing_days_not_zero(self):
        b=self.baseline([study(2,ago=0),study(4,ago=5,rid=2)])
        self.assertEqual(b['observed_dates'],2)
        self.assertEqual(b['series'][0]['average'],3)

    def test_no_recent_records(self):
        for records in ([],[study(ago=30)],[study(ago=-1)]):
            b=self.baseline(records)
            self.assertFalse(b['available'])
            with self.assertRaises(ValueError):simulate_routine(b)

    def test_duplicate_aggregation(self):
        self.assertEqual(self.baseline([study(2),study(3,rid=2)])['series'][0]['average'],5)
        self.assertEqual(self.baseline([habit(6),habit(8,rid=2)],'habit')['series'][0]['average'],8)

    def test_invalid_daily_study_sum(self):
        self.assertFalse(self.baseline([study(20),study(10,rid=2)])['available'])

    def test_impossible_budget_rejected(self):
        with self.assertRaisesRegex(ValueError,'24 hours'):
            simulate_routine(self.baseline(),reserved_hours=22,study_delta=1)
        with self.assertRaisesRegex(ValueError,'waking hours'):
            simulate_routine(self.baseline([habit(screen=18)],'habit'))

    def test_proposed_negative_time_rejected(self):
        with self.assertRaises(ValueError):simulate_routine(self.baseline(),study_delta=-3)

    def test_risk_loss_floor_explicit(self):
        r=simulate_routine(self.baseline(),risk_study_loss=5)
        self.assertEqual(r['scenarios'][2]['metrics'][0]['total'],0)
        self.assertTrue(r['scenarios'][2]['risk_floor_applied'])

    def test_shared_milestone2_trend(self):
        records=[study(2+i*.1,ago=6-i,rid=i+1) for i in range(7)]
        b=self.baseline(records)
        r=simulate_routine(b,baseline_mode='trend',study_delta=.5)
        expected=personal_trends(records,'study',today=TODAY)['series'][0]['forecast']
        self.assertEqual([p['value'] for p in r['scenarios'][0]['metrics'][0]['points']], [p['value'] for p in expected])
        self.assertEqual(r['scenarios'][1]['metrics'][0]['difference'],3.5)

    def test_trend_gating(self):
        with self.assertRaises(ValueError):simulate_routine(self.baseline(),baseline_mode='trend')
        b=self.baseline([study(ago=i,rid=i) for i in range(7)])
        with self.assertRaises(ValueError):simulate_routine(b,baseline_mode='trend',days=14)
        stale=self.baseline([study(ago=i+8,rid=i) for i in range(7)])
        self.assertFalse(stale['trend_available'])

    def test_no_mutations_and_zero_changes(self):
        records=[study()]; before=vars(records[0]).copy()
        r=simulate_routine(self.baseline(records))
        self.assertEqual(vars(records[0]),before)
        self.assertEqual([s['metrics'][0]['difference'] for s in r['scenarios']],[0,0,0])

    def test_nonfinite_input(self):
        with self.assertRaises(ValueError):simulate_routine(self.baseline(),study_delta=float('nan'))


if __name__=='__main__':unittest.main()
