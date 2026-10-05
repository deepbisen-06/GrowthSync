from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from backend.app.config import Settings
from backend.app.main import app


def test_production_rejects_development_defaults():
    with pytest.raises(ValidationError):Settings(_env_file=None,ENVIRONMENT='production')


def test_production_configuration():
    s=Settings(_env_file=None,ENVIRONMENT='production',SECRET_KEY='random-test-secret-'*4,FRONTEND_URL='https://growthsync.example',ALLOWED_ORIGINS='https://growthsync.example')
    assert s.cors_origins==['https://growthsync.example']


def test_health_failure_redacts_database_credentials():
    with patch('backend.app.main.check_db_connection',side_effect=ConnectionError('password=PRIVATE_PASSWORD')):
        r=TestClient(app).get('/health')
    assert r.status_code==503 and 'PRIVATE_PASSWORD' not in r.text


def test_cross_origin_write_is_rejected():
    r=TestClient(app).post('/api/chat',headers={'Origin':'https://untrusted.example'},json={'message':'hello'})
    assert r.status_code==403
