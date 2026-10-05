"""Gemini-only configuration and transport regression checks."""
from unittest.mock import Mock
from backend.app.config import Settings
from backend.app.services.llm_provider import configured, generate, provider_options, public_config


def test_legacy_provider_settings_cannot_redirect_requests():
    settings=Settings(_env_file=None, AI_PROVIDER='qwen', QWEN_API_KEY='unused',
                      QWEN_BASE_URL='https://unused.example', GEMINI_API_KEY='test-secret')
    post=Mock()
    generate(post, {'contents':[]}, **provider_options(settings))
    assert post.call_args.args[0].startswith('https://generativelanguage.googleapis.com/')
    assert post.call_args.kwargs['headers']['x-goog-api-key']=='test-secret'
    assert post.call_args.kwargs['allow_redirects'] is False
    assert public_config(settings)['provider']=='gemini'
    assert 'test-secret' not in str(public_config(settings))


def test_configuration_validation():
    assert not configured('', 'gemini-model')
    assert not configured('secret', '../invalid/model')
    assert configured('secret', 'gemini-model')


def test_configuration_route_requires_login_and_hides_key():
    from types import SimpleNamespace
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from backend.app.routes.chat import router
    from backend.app.deps import get_current_user
    app=FastAPI()
    app.include_router(router)
    client=TestClient(app)
    assert client.get('/api/chat/config').status_code==401
    app.dependency_overrides[get_current_user]=lambda:SimpleNamespace(id=1)
    response=client.get('/api/chat/config')
    assert response.status_code==200
    assert response.headers['Cache-Control']=='no-store'
    assert set(response.json())=={'provider','label','recipient','configured'}
    assert response.json()['provider']=='gemini'
