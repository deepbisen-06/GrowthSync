import json
import unittest
from types import SimpleNamespace
from unittest.mock import Mock
from backend.app.services.ai_recommendations import explain, result_token, with_token, allow_attempt, _attempts


def result():
    return {'recommendations':[{'title':'Budget','observation':'Expenses 80000',
        'action':'Keep expenses within 70000','impact':'Difference +120000',
        'condition':'Income unchanged'}], 'assumptions':['Conditional scenario'],
        'baseline':{'private_note':'NEVER_SEND_THIS','email':'private@example.com'}}


def response(items=None,finish='STOP',status=200):
    data={'candidates':[{'finishReason':finish,'content':{'parts':[{'text':json.dumps(items if items is not None else [{'id':0,'explanation':'Review the proposed expense budget. Follow it only if your essential commitments remain covered.'}])}]}}]}
    return SimpleNamespace(status_code=status,json=lambda:data)


class AITests(unittest.TestCase):
    def test_missing_key_no_request(self):
        post=Mock();r=explain(result(),'finance','','gemini-2.5-flash',post)
        self.assertEqual(r['source'],'rule_based');post.assert_not_called()

    def test_success_and_minimized_context(self):
        post=Mock(return_value=response());r=explain(result(),'finance','test-secret','gemini-2.5-flash',post)
        self.assertEqual(r['source'],'gemini')
        self.assertEqual(r['recommendations'][0]['impact'],'Difference +120000')
        sent=json.dumps(post.call_args.kwargs['json'])
        self.assertNotIn('NEVER_SEND_THIS',sent);self.assertNotIn('private@example.com',sent)
        self.assertNotIn('test-secret',post.call_args.args[0])
        self.assertFalse(post.call_args.kwargs['allow_redirects'])

    def test_provider_failures(self):
        for status in (400,401,403,404,429,500):
            r=explain(result(),'finance','key','model',Mock(return_value=response(status=status)))
            self.assertEqual(r['source'],'rule_based')

    def test_timeout_sanitized(self):
        r=explain(result(),'finance','key','model',Mock(side_effect=TimeoutError('secret')))
        self.assertNotIn('secret',json.dumps(r));self.assertEqual(r['source'],'rule_based')

    def test_invalid_outputs_fallback(self):
        for items in ([],[{'id':1,'explanation':'Wrong evidence reference.'}],
                      [{'id':0,'explanation':'Save 99999 immediately.'}],
                      [{'id':0,'explanation':None}]):
            r=explain(result(),'habit','key','model',Mock(return_value=response(items)))
            self.assertEqual(r['source'],'rule_based')

    def test_truncated_blocked_fallback(self):
        for finish in ('MAX_TOKENS','SAFETY'):
            self.assertEqual(explain(result(),'study','key','model',Mock(return_value=response(finish=finish)))['source'],'rule_based')

    def test_bad_model_no_request(self):
        post=Mock();explain(result(),'study','key','../evil',post);post.assert_not_called()

    def test_snapshot_token(self):
        r=result();token=result_token(r)
        self.assertEqual(result_token(with_token(r)),token)
        r['recommendations'][0]['impact']='Changed'
        self.assertNotEqual(result_token(r),token)

    def test_per_user_cooldown(self):
        _attempts.clear()
        self.assertTrue(allow_attempt(1));self.assertFalse(allow_attempt(1));self.assertTrue(allow_attempt(2))


if __name__=='__main__':unittest.main()
