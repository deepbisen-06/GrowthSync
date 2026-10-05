"""Conditional routine scenarios; observational trends are not causal effects."""
from datetime import date, timedelta
from math import isfinite
from statistics import mean

from backend.app.ml.personal_trends import personal_trends


FIELDS = {
    'study': [('study_hours', 'Study time', 'hours', 24)],
    'habit': [('sleep_hours', 'Sleep duration', 'hours', 24),
              ('exercise_minutes', 'Exercise time', 'minutes', 1440),
              ('screen_time', 'Screen time', 'hours', 24)],
}


def routine_baseline(records, kind, today=None):
    if kind not in FIELDS:
        raise ValueError('Choose study or habit.')
    today = today or date.today()
    start = today-timedelta(days=29)
    date_field = 'study_date' if kind == 'study' else 'record_date'
    recent = [r for r in records if start <= getattr(r, date_field) <= today]
    # Share Milestone 2 aggregation, validation and calendar-day regression.
    trends = personal_trends(recent, kind, today=today)
    available = trends['observed_dates'] > 0
    return {
        'kind': kind, 'available': available, 'as_of': today.isoformat(),
        'window_start': start.isoformat(), 'observed_dates': trends['observed_dates'],
        'coverage_days': 30, 'trend_available': trends['can_forecast'],
        'series': trends['series'], 'message': trends['message'],
        'method': 'Means use observed dates within the last 30 calendar days. Missing days are unknown, not zero. Applying the mean every future day is a scenario assumption.',
    }


def simulate_routine(baseline, *, days=7, baseline_mode='observed', reserved_hours=0,
                     study_delta=0, sleep_delta=0, exercise_delta=0, screen_delta=0,
                     risk_study_loss=0, risk_sleep_loss=0, risk_exercise_loss=0,
                     risk_screen_increase=0, study_goal_hours=0):
    if not baseline['available']:
        raise ValueError('Add a valid record within the last 30 days before simulating.')
    if days not in (7, 14, 28) or baseline_mode not in ('observed', 'trend'):
        raise ValueError('Choose a supported duration and baseline method.')
    values = (reserved_hours,study_delta,sleep_delta,exercise_delta,screen_delta,
              risk_study_loss,risk_sleep_loss,risk_exercise_loss,risk_screen_increase,study_goal_hours)
    if not all(isfinite(v) for v in values):
        raise ValueError('Inputs must be finite numbers.')
    if not 0 <= reserved_hours <= 24 or min(risk_study_loss,risk_sleep_loss,risk_exercise_loss,risk_screen_increase,study_goal_hours)<0:
        raise ValueError('Time reservations must be 0–24 hours; losses and goals cannot be negative.')
    if baseline_mode == 'trend' and (days != 7 or not baseline['trend_available']):
        raise ValueError('Milestone 2 trend mode needs 7 recent observed dates and supports only the next 7 days.')
    kind = baseline['kind']
    deltas = dict(study_hours=study_delta, sleep_hours=sleep_delta,
                  exercise_minutes=exercise_delta, screen_time=screen_delta)
    risk_deltas = dict(study_hours=-risk_study_loss, sleep_hours=-risk_sleep_loss,
                       exercise_minutes=-risk_exercise_loss, screen_time=risk_screen_increase)
    series_by_key = {s['key']: s for s in baseline['series']}
    scenarios = []
    for scenario, label in [('current','Current / expected'),('proposed','Proposed routine'),('risk','Risk / setback')]:
        daily = []
        floor_applied = False
        for index in range(days):
            row = {'day': index+1, 'date': (date.fromisoformat(baseline['as_of'])+timedelta(days=index+1)).isoformat()}
            for key, _, _, cap in FIELDS[kind]:
                source = series_by_key[key]
                base = source['forecast'][index]['value'] if baseline_mode == 'trend' else source['average']
                value = base + (deltas[key] if scenario == 'proposed' else risk_deltas[key] if scenario == 'risk' else 0)
                if scenario == 'risk' and value < 0:
                    value = 0
                    floor_applied = True
                if not 0 <= value <= cap:
                    raise ValueError(f'{label}: {key} on day {index+1} is outside 0–{cap}. Adjust the changes or baseline mode.')
                row[key] = round(value, 2)
            committed = row['study_hours'] if kind == 'study' else row['sleep_hours']+row['exercise_minutes']/60
            if committed+reserved_hours > 24+1e-8:
                raise ValueError(f'{label}: day {index+1} exceeds 24 hours including reserved commitments. Adjust the assumptions.')
            if kind == 'habit' and row['screen_time']+row['sleep_hours'] > 24+1e-8:
                raise ValueError(f'{label}: screen time exceeds waking hours on day {index+1}. Adjust screen or sleep assumptions.')
            row['unallocated_hours'] = round(24-committed-reserved_hours, 2)
            daily.append(row)
        metrics = []
        for key, label_metric, unit, _ in FIELDS[kind]:
            total = 0
            points = []
            for row in daily:
                total += row[key]
                points.append({'day':row['day'],'date':row['date'],'value':row[key],'cumulative':round(total,2)})
            metrics.append({'key':key,'label':label_metric,'unit':unit,
                            'daily_average':round(mean(r[key] for r in daily),2),
                            'total':round(total,2),'points':points})
        goal_day = None
        if kind == 'study' and study_goal_hours > 0:
            goal_day = next((p['date'] for p in metrics[0]['points'] if p['cumulative'] >= study_goal_hours), None)
        scenarios.append({'key':scenario,'label':label,'metrics':metrics,'daily':daily,
                          'goal_date':goal_day,'risk_floor_applied':floor_applied})
    for scenario in scenarios:
        for i, metric in enumerate(scenario['metrics']):
            metric['difference'] = round(metric['total']-scenarios[0]['metrics'][i]['total'],2)
    recommendations = []
    for m in scenarios[1]['metrics']:
        source = series_by_key[m['key']]
        recommendations.append({
            'title': f'Plan your {m["label"].lower()}',
            'observation': f'Observed-date average: {source["average"]} {m["unit"]}/day from {baseline["observed_dates"]} recorded dates.',
            'action': f'The proposed routine allocates an average of {m["daily_average"]} {m["unit"]}/day. Check it against your commitments.',
            'impact': f'{m["difference"]:+g} {m["unit"]} versus the current scenario over {days} days.',
            'condition': 'Changes are followed on every simulated day. Time allocations do not establish grade, stress or health improvements.',
        })
    if study_goal_hours>0 and kind=='study':
        reached = scenarios[1]['goal_date']
        recommendations.append({'title':'Study goal check','observation':f'Remaining study-time goal: {study_goal_hours:g} hours.',
                                'action':'Review the daily allocation and goal size together.',
                                'impact':f'Proposed goal date: {reached}.' if reached else 'The proposed routine does not reach this goal within the selected horizon.',
                                'condition':'This measures allocated study time, not syllabus completion or exam readiness.'})
    return {'baseline':baseline,'days':days,'baseline_mode':baseline_mode,'reserved_hours':reserved_hours,
            'study_goal_hours':study_goal_hours,'scenarios':scenarios,'recommendations':recommendations,
            'assumptions':[
                'Observed mode repeats the recorded-date mean; trend mode reuses Milestone 2 linear estimates for seven days only.',
                'Proposed changes apply every day. Risk losses apply to the current path and are floored at zero, not probabilities.',
                'Study: reserved hours include sleep, work, exercise, travel and meals outside study.',
                'Habit: reserved hours include study, work, travel and meals outside sleep and exercise.',
                'Screen time may overlap study/work; it is not added again to the daily budget, but cannot exceed waking hours.',
                'No fabricated history, database inserts, diagnostic stress predictions or guaranteed productivity gains.',
            ]}
