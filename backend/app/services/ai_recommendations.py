"""AI explanations of server-calculated evidence, with explicit fallbacks."""
import hashlib
from backend.app.services.llm_provider import configured, generate
import json
import re
import time
from collections import OrderedDict
from threading import Lock

from types import SimpleNamespace
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError, URLError


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _post(url, **kwargs):
    request = Request(url, data=json.dumps(kwargs['json']).encode(),
                      headers=kwargs['headers'], method='POST')
    try:
        with build_opener(_NoRedirect()).open(request, timeout=30) as response:
            raw = response.read(1024*1024+1)
            if len(raw)>1024*1024:
                raise ValueError('Response too large')
            return SimpleNamespace(status_code=response.status, json=lambda:json.loads(raw))
    except HTTPError as exc:
        status = exc.code
        exc.close()
        return SimpleNamespace(status_code=status)

_attempts = OrderedDict()
_lock = Lock()


def result_token(result):
    clean = {k:v for k,v in result.items() if k != 'recommendation_token'}
    return hashlib.sha256(json.dumps(clean, sort_keys=True, allow_nan=False).encode()).hexdigest()


def with_token(result):
    return {**result, 'recommendation_token': result_token(result)}


def allow_attempt(user_id):
    """Bounded per-process cooldown; deployments with multiple workers need shared limits."""
    now = time.monotonic()
    with _lock:
        if now-_attempts.get(user_id, -100) < 30:
            return False
        _attempts[user_id] = now
        _attempts.move_to_end(user_id)
        while len(_attempts)>1024:
            _attempts.popitem(last=False)
    return True


def explain(result, kind, api_key, model, post=None):
    # Only application-generated evidence is sent: never raw notes, names or IDs.
    evidence = [{**r, 'id':i} for i,r in enumerate(result['recommendations'])]
    def fallback(message):
        return {'source':'rule_based','message':message,'recommendations':evidence}
    if not configured(api_key, model):
        return fallback('AI provider is not configured. Check the backend environment and restart. Showing rule-based recommendations.')
    context = {'module':kind, 'evidence':evidence, 'assumptions':result['assumptions']}
    instruction = (
        'Explain the supplied GrowthSync evidence in clear English. Return a JSON array '
        'with one object for every evidence item: {"id": integer, "explanation": string}. '
        'Use two short sentences per item. Explain a feasible next step and its condition. '
        'Do not add calculations, numbers, dates, percentages or numerical targets to explanations; '
        'the application displays exact evidence separately. Do not claim certainty, causal grade '
        'improvements, medical benefits, diagnostic stress levels or investment returns. '
        'Do not label a proposed plan better unless the evidence supports it. '
        'Do not invent user goals, circumstances or recommendations beyond the supplied evidence.'
    )
    body = {'systemInstruction':{'parts':[{'text':instruction}]},
            'contents':[{'role':'user','parts':[{'text':json.dumps(context)}]}],
            'generationConfig':{'temperature':0.2,'maxOutputTokens':4096,
                                'responseMimeType':'application/json',
                                'responseSchema':{'type':'ARRAY','items':{'type':'OBJECT',
                                    'properties':{'id':{'type':'INTEGER'},'explanation':{'type':'STRING'}},
                                    'required':['id','explanation']}}}}
    try:
        response = generate(post or _post, body, api_key, model)
        if response.status_code != 200:
            reason = {400:'AI rejected the request or configuration.',401:'AI authentication failed.',
                      403:'AI key permissions or access were rejected.',404:'The configured AI model is unavailable.',
                      429:'AI quota or rate limit reached.'}.get(response.status_code,f'AI request failed (HTTP {response.status_code}).')
            return fallback(reason+' Showing rule-based recommendations.')
        data=response.json()
        candidate=data['candidates'][0]
        if candidate.get('finishReason')!='STOP':
            return fallback('AI did not return a complete answer. Showing rule-based recommendations.')
        raw=''.join(p.get('text','') for p in candidate['content']['parts'] if not p.get('thought'))
        items=json.loads(raw)
        if not isinstance(items,list) or len(items)!=len(evidence):
            raise ValueError('Invalid evidence count')
        explanations={}
        for item in items:
            idx=item['id']; text=item['explanation']
            if type(idx) is not int or idx not in range(len(evidence)) or idx in explanations:
                raise ValueError('Invalid evidence reference')
            if not isinstance(text,str) or not 10<=len(text.strip())<=1200 or re.search(r'\d',text):
                raise ValueError('Invalid explanation')
            explanations[idx]=text.strip()
        return {'source':'gemini','model':model,
                'message':'AI explanations accompany unchanged calculated evidence. Review the assumptions before acting.',
                'recommendations':[{**r,'explanation':explanations[r['id']]} for r in evidence]}
    except (URLError,TimeoutError,OSError,ValueError,KeyError,IndexError,TypeError,AttributeError):
        # Never return/log provider error bodies, request headers or API keys.
        return fallback('AI could not provide a usable answer. Showing rule-based recommendations.')
