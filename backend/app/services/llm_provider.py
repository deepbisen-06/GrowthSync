"""Gemini-only transport for dashboard chat and recommendation explanations."""
import re


def configured(api_key, model):
    return bool(api_key and re.fullmatch(r'[A-Za-z0-9._-]+', model))


def provider_options(settings):
    return dict(api_key=settings.GEMINI_API_KEY.get_secret_value(), model=settings.GEMINI_MODEL)


def public_config(settings):
    return dict(provider='gemini', label='Gemini', recipient='Google Gemini',
                configured=configured(**provider_options(settings)))


def generate(post, body, api_key, model):
    if not configured(api_key, model):
        raise ValueError('Invalid Gemini configuration')
    return post(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
                headers={'x-goog-api-key':api_key,'Content-Type':'application/json'},
                json=body, timeout=(5,30), allow_redirects=False)
