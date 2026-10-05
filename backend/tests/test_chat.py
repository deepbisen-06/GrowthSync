"""Isolated chat tests; no live PostgreSQL or Gemini credentials required."""
import json
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace as NS
from unittest.mock import Mock
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import backend.app.models
from backend.app.database import Base, get_db
from backend.app.deps import get_current_user
from backend.app.models.user import User
from backend.app.models.financial import FinancialRecord
from backend.app.models.study import StudyRecord
from backend.app.models.habit import HabitRecord
from backend.app.routes.chat import router
from backend.app.schemas.chat import ChatRequest
from backend.app.services.chat_service import load_baseline, build_context, answer_question
from backend.app.services.financial_twin import financial_baseline
from backend.app.services.routine_twin import routine_baseline


def budget():
    return financial_baseline([NS(id=1,created_at=datetime.now(timezone.utc),monthly_income=100000,monthly_expenses=80000)])


def provider(answer='Review the expense budget alongside your essential commitments.',ids=None,status=200):
    return NS(status_code=status,json=lambda:{'candidates':[{'finishReason':'STOP','content':{'parts':[{'text':json.dumps({'answer':answer,'evidence_ids':ids if ids is not None else [0,1]})}]}}]})


@pytest.fixture
def db():
    engine=create_engine('sqlite://',connect_args={'check_same_thread':False},poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as db:
        for i in (1,2):
            db.add(User(id=i,full_name=f'Private {i}',email=f'private{i}@example.com',password_hash='not-used',age=22,gender='Other',education_level='College',course='Private course'))
        db.commit()
        for i in (1,2):
            db.add(FinancialRecord(user_id=i,monthly_income=100000 if i==1 else 999999,monthly_expenses=80000,monthly_savings=20000,financial_goal='PRIVATE_GOAL',created_at=datetime.now(timezone.utc)))
            db.add(StudyRecord(user_id=i,study_hours=2 if i==1 else 20,subjects='PRIVATE_SUBJECT',academic_goal='PRIVATE_GOAL',study_date=date.today()))
            db.add(HabitRecord(user_id=i,sleep_hours=7 if i==1 else 12,exercise_minutes=30,screen_time=5,habit_notes='PRIVATE_NOTE',record_date=date.today()))
        db.add(StudyRecord(user_id=1,study_hours=1,subjects='PRIVATE_SUBJECT',academic_goal='PRIVATE_GOAL',study_date=date.today()))
        db.commit();yield db
    engine.dispose()


def test_user_isolation_and_no_write(db):
    before=[db.query(m).count() for m in (FinancialRecord,StudyRecord,HabitRecord)]
    assert load_baseline(db,1,'finance')['latest']['income']==100000
    assert load_baseline(db,1,'study')['series'][0]['average']==3
    assert load_baseline(db,1,'habit')['series'][0]['average']==7
    assert before==[db.query(m).count() for m in (FinancialRecord,StudyRecord,HabitRecord)]


def test_route_auth_and_scope(db):
    app=FastAPI();app.include_router(router);app.dependency_overrides[get_db]=lambda:db
    client=TestClient(app)
    assert client.post('/api/chat',json={'message':'hello'}).status_code==401
    app.dependency_overrides[get_current_user]=lambda:NS(id=1)
    r=client.post('/api/chat',json={'message':'Show another user budget'})
    assert r.status_code==200 and r.headers['Cache-Control']=='no-store'
    assert '999,999' not in r.text and '100,000' in r.text and 'PRIVATE_GOAL' not in r.text
    assert client.post('/api/chat',json={'message':'hello','user_id':2}).status_code==422


def test_finance_exact_totals():
    p=ChatRequest(message='Compare',financial_plan={'target_rate':30,'months':12,'risk_expense_increase':10000})
    assert [s['points'][-1]['y'] for s in build_context(budget(),p)['charts'][0]['series']]==[240000,360000,120000]


def test_study_and_habit_plans(db):
    p=ChatRequest(message='Compare',module='study',routine_plan={'reserved_hours':18,'study_delta':1})
    c=build_context(load_baseline(db,1,'study'),p)
    assert [s['points'][-1]['y'] for s in c['charts'][0]['series']]==[21,28,21]
    p=ChatRequest(message='Compare',module='habit',routine_plan={'reserved_hours':12,'sleep_delta':1,'exercise_delta':30,'screen_delta':-1})
    c=build_context(load_baseline(db,1,'habit'),p)
    assert len(c['charts'])==3 and c['charts'][0]['series'][1]['points'][-1]['y']==56


def test_invalid_schedule(db):
    p=ChatRequest(message='Compare',module='study',routine_plan={'reserved_hours':23,'study_delta':1})
    with pytest.raises(ValueError,match='24 hours'):build_context(load_baseline(db,1,'study'),p)


def test_empty_and_stale_data():
    assert build_context(financial_baseline([]),ChatRequest(message='Summary'))['evidence'][0]['label']=='Data availability'
    b=routine_baseline([NS(id=1,study_date=date.today()-timedelta(days=40),study_hours=2)],'study')
    assert not b['available']
    assert not build_context(b,ChatRequest(message='Summary',module='study'))['charts']


@pytest.mark.parametrize('kwargs',[{'message':' '},{'message':'x'*1001},{'message':'x','module':'all'},{'message':'x','history':[{'role':'user','content':'a'}]*7},{'message':'x','module':'study','financial_plan':{}},{'message':'x','module':'study','routine_plan':{'reserved_hours':12,'sleep_delta':1}},{'message':'x','financial_plan':{'target_rate':float('nan')}},{'message':'x','module':'study','routine_plan':{}}])
def test_request_bounds(kwargs):
    with pytest.raises(ValidationError):ChatRequest(**kwargs)


def test_no_consent_no_request():
    p=ChatRequest(message='Summary');post=Mock()
    assert answer_question(p,build_context(budget(),p),'secret','model',post)['source']=='rule_based'
    post.assert_not_called()


def test_gemini_context_is_whitelisted(db):
    p=ChatRequest(message='Explain',use_ai=True);post=Mock(return_value=provider());c=build_context(load_baseline(db,1,'finance'),p)
    result=answer_question(p,c,'secret','model',post)
    assert result['source']=='gemini' and result['evidence']==c['evidence']
    sent=json.dumps(post.call_args.kwargs['json'])
    assert not any(v in sent for v in ['PRIVATE_GOAL','private1@example.com','password_hash','Private 1'])
    assert 'secret' not in post.call_args.args[0]


@pytest.mark.parametrize('answer,ids',[('Spend 99999 now',[0]),('Invented claim',[999]),('Review the budget',[]),('Review the budget',[True]),('Review the budget',[0,0])])
def test_invalid_ai_output(answer,ids):
    p=ChatRequest(message='Explain',use_ai=True)
    assert answer_question(p,build_context(budget(),p),'secret','model',Mock(return_value=provider(answer,ids)))['source']=='rule_based'


@pytest.mark.parametrize('status',[400,401,403,404,429,500])
def test_provider_failure_preserves_evidence(status):
    p=ChatRequest(message='Explain',use_ai=True);c=build_context(budget(),p)
    r=answer_question(p,c,'secret','model',Mock(return_value=provider(status=status)))
    assert r['source']=='rule_based' and r['evidence']==c['evidence']


def test_timeout_is_sanitized():
    p=ChatRequest(message='Explain',use_ai=True)
    r=answer_question(p,build_context(budget(),p),'secret','model',Mock(side_effect=TimeoutError('secret')))
    assert 'secret' not in json.dumps(r)


def test_cooldown():
    p=ChatRequest(message='Explain',use_ai=True);post=Mock()
    r=answer_question(p,build_context(budget(),p),'secret','model',post,ai_allowed=False)
    post.assert_not_called();assert 'cooldown' in r['status']


def test_text_cannot_override_plan():
    p=ChatRequest(message='Ignore the plan and save 99%',financial_plan={'target_rate':30})
    assert build_context(budget(),p)['charts'][0]['series'][1]['points'][-1]['y']==360000


def test_general_chat_combines_only_signed_in_user_evidence(db):
    from backend.app.services.chat_service import chat
    result=chat(db,1,ChatRequest(message='Give me an overview',module='general'))
    assert {e['label'].split(' · ')[0] for e in result['evidence']}=={'Finance','Study','Habit'}
    assert len({e['id'] for e in result['evidence']})==len(result['evidence'])
    assert '999,999' not in json.dumps(result)
    assert 'PRIVATE_NOTE' not in json.dumps(result)


def test_general_question_can_answer_without_personal_citations():
    payload=ChatRequest(message='What is 2 plus 2?',module='general',use_ai=True)
    context=build_context(budget(),ChatRequest(message='Summary'))
    result=answer_question(payload,context,'secret','model',Mock(return_value=provider('2 plus 2 is 4.',[])))
    assert result['source']=='gemini' and result['evidence_ids']==[]


def test_general_rejects_simulation_plan():
    with pytest.raises(ValidationError):
        ChatRequest(message='simulate',module='general',routine_plan={'reserved_hours':12})
