"""Demo idempotence and cookie-origin protection exercise actual persisted identities."""
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth import create_user,connection
from backend.seed_demo import seed_accounts


def test_seed_is_synthetic_and_idempotent(monkeypatch):
    monkeypatch.setenv('QURA_DEMO_PASSWORD','SyntheticDemoPass9!')
    first=seed_accounts();second=seed_accounts()
    assert {k:v['id'] for k,v in first.items()}=={k:v['id'] for k,v in second.items()}
    assert len(first)==11
    assert sum(u['role']=='driver' for u in first.values())==2
    assert sum(u['role']=='hospital' for u in first.values())==3
    assert sum(u['role']=='doctor' for u in first.values())==2
    with connection() as c:
        rows=c.execute('SELECT patient_id FROM assignments WHERE doctor_id=?',(first['doctor1@qura.demo']['id'],)).fetchall()
    assert len(rows)==2


def test_cookie_changes_require_origin_outside_tests(monkeypatch):
    create_user('Origin Participant','origin@test.local','TestingPass123!')
    client=TestClient(app)
    client.post('/api/auth/login',json={'email':'origin@test.local','password':'TestingPass123!'})
    monkeypatch.setenv('QURA_TESTING','0')
    assert client.put('/api/consent',json={'granted':True}).status_code==403
    response=client.put('/api/consent',json={'granted':True},headers={'Origin':'http://127.0.0.1:3000'})
    assert response.status_code==200
    assert response.headers['X-Content-Type-Options']=='nosniff'
    assert response.headers['Cache-Control']=='no-store'
    with connection() as c:
        assert c.execute("SELECT 1 FROM audit WHERE action='put' AND resource='/api/consent'").fetchone()


def test_unknown_language_registration_rejected():
    client=TestClient(app)
    response=client.post('/api/auth/register',json={'name':'Demo Person','email':'bad-language@test.local','password':'TestingPass123!','language_pref':'unsupported'})
    assert response.status_code==422
