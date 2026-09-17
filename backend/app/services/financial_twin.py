"""Read-only financial scenarios based on recorded monthly budget snapshots.

Records are snapshots, not transactions: retain the latest entry per calendar
month rather than summing repeated updates. No investment returns are assumed.
"""
from datetime import date
from math import isfinite
from statistics import mean


def financial_baseline(records, today=None):
    today = today or date.today()
    months = {}
    excluded = 0
    for row in sorted(records, key=lambda r: (r.created_at, r.id)):
        day = row.created_at.date()
        income, expenses = float(row.monthly_income), float(row.monthly_expenses)
        if day > today or not all(isfinite(v) and 0 <= v <= 1e12 for v in (income, expenses)):
            excluded += 1
            continue
        months[day.strftime('%Y-%m')] = {
            'month': day.strftime('%Y-%m'), 'date': day.isoformat(),
            'income': income, 'expenses': expenses, 'savings': round(income-expenses, 2),
        }
    history = list(months.values())[-12:]
    if not history:
        return {'available': False, 'history': [], 'message': 'Add a financial record to simulate your plan.'}
    latest = history[-1]
    warnings = []
    if len(history) < 4:
        warnings.append('Limited history: fewer than four observed months. This is a budget scenario, not a validated forecast.')
    if (today-date.fromisoformat(latest['date'])).days > 62:
        warnings.append('Your latest budget is over 62 days old. Update it before relying on these scenarios.')
    return {
        'available': True, 'latest': latest, 'history': history,
        'observed_months': len(history), 'excluded_records': excluded,
        'savings_rate': round(latest['savings']/latest['income']*100, 2) if latest['income'] else None,
        'average_income': round(mean(p['income'] for p in history), 2),
        'average_expenses': round(mean(p['expenses'] for p in history), 2),
        'expense_range': [min(p['expenses'] for p in history), max(p['expenses'] for p in history)],
        'warnings': warnings,
        'method': 'Latest valid monthly budget held constant. Latest entry per month; up to 12 observed months for analysis. Missing months are not filled.',
    }


def simulate_finances(baseline, *, months=12, target_rate=30, income_change=0,
                      risk_expense_increase=0, risk_income_drop_pct=0, starting_balance=0):
    if not baseline['available']:
        raise ValueError('Add a financial record before running a simulation.')
    if months not in (3, 6, 12):
        raise ValueError('Choose 3, 6 or 12 months.')
    values = (target_rate, income_change, risk_expense_increase, risk_income_drop_pct, starting_balance)
    if not all(isfinite(v) for v in values):
        raise ValueError('All assumptions must be finite numbers.')
    if not 0 <= target_rate <= 100 or not 0 <= risk_income_drop_pct <= 100:
        raise ValueError('Percentages must be between 0 and 100.')
    if risk_expense_increase < 0 or starting_balance < 0:
        raise ValueError('Risk expenses and starting balance cannot be negative.')
    current = baseline['latest']
    income, expenses = current['income'], current['expenses']
    proposed_income = income + income_change
    if proposed_income < 0:
        raise ValueError('Income change cannot reduce proposed income below zero.')
    proposed_expenses = proposed_income*(1-target_rate/100)
    specs = [
        ('current', 'Current / expected', income, expenses, 'Latest recorded monthly income and expenses continue unchanged.'),
        ('proposed', 'Proposed / improved', proposed_income, proposed_expenses, 'Target savings rate is achieved every month through the displayed expense budget.'),
        ('risk', 'Risk case', income*(1-risk_income_drop_pct/100), expenses+risk_expense_increase,
         'Income drop and extra expenses apply to the current plan every month; this is a stress test, not a probability.'),
    ]
    scenarios = []
    for key, label, inc, exp, assumption in specs:
        saving = round(inc-exp, 2)
        scenarios.append({
            'key': key, 'label': label, 'income': round(inc, 2), 'expenses': round(exp, 2),
            'monthly_savings': saving, 'additional_savings': round(saving*months, 2),
            'ending_balance': round(starting_balance+saving*months, 2), 'assumption': assumption,
            'points': [{'month': m, 'balance': round(starting_balance+saving*m, 2)} for m in range(months+1)],
        })
    for s in scenarios:
        s['difference'] = round(s['ending_balance']-scenarios[0]['ending_balance'], 2)
    cut = round(expenses-proposed_expenses, 2)
    recommendations = [{
        'title': 'Check the proposed expense budget',
        'observation': f'Latest recorded monthly expenses are {expenses:,.2f}.',
        'action': f'To reach {target_rate:g}% savings at the proposed income, keep monthly expenses at or below {proposed_expenses:,.2f}.',
        'impact': f'Projected difference versus current plan: {scenarios[1]["difference"]:+,.2f} over {months} months.',
        'condition': 'Requires the proposed income and expense budget every month. Essential spending has not been classified, so affordability is not confirmed.',
    }]
    if scenarios[2]['monthly_savings'] < 0:
        recommendations.append({
            'title': 'Risk scenario creates a monthly deficit',
            'observation': f'Risk expenses exceed income by {-scenarios[2]["monthly_savings"]:,.2f} per month.',
            'action': 'Review which expenses can be reduced or how the income shortfall could be covered.',
            'impact': f'Risk ending balance: {scenarios[2]["ending_balance"]:,.2f}. Negative balances indicate an uncovered funding gap.',
            'condition': 'The specified setback persists for the entire simulation.',
        })
    if scenarios[1]['difference'] <= 0:
        recommendations.append({
            'title': 'Proposed plan does not increase savings',
            'observation': 'The proposed ending balance is no higher than the current plan.',
            'action': 'Review the target and income assumption before choosing this plan.',
            'impact': f'Difference: {scenarios[1]["difference"]:+,.2f}.',
            'condition': 'A scenario labelled improved is only an improvement when its calculated result is better.',
        })
    return {'baseline': baseline, 'months': months, 'starting_balance': starting_balance,
            'required_expense_reduction': cut, 'scenarios': scenarios,
            'recommendations': recommendations,
            'assumptions': ['All amounts use the same currency as your saved records; no currency conversion.',
                            'No interest, investment returns, inflation or automatic income growth.',
                            'Starting balance is user-entered; monthly savings are not treated as an existing bank balance.',
                            'Scenarios are conditional calculations, not guarantees or trained-model accuracy claims.']}
