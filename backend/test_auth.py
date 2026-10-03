"""Portal roles, refresh revocation, ownership and append-only audit checks."""
import sqlite3
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth import create_user, connection

def signed_client(email: str,password: str = 'TestingPass123!') -> TestClient:
    """Sign in an isolated test identity using the real cookie flow."""
    client=TestClient(app)
    assert client.post('/api/auth/login',json={'email':email,'password':password}).status_code==200
    return client

def test_patient_cannot_enter_research_or_other_profiles():
    a=create_user('Patient A','pa@test.local','TestingPass123!')
    b=create_user('Patient B','pb@test.local','TestingPass123!')
    client=signed_client('pa@test.local')
    assert client.get('/api/datasets').status_code==403
    assert [p['id'] for p in client.get('/api/patients').json()]==[a['id']]
    assert client.get('/api/admin/users').status_code==403
    assert client.put('/api/consent',json={'granted':True}).json()['granted']
    assert b['id']!=a['id']

def test_doctor_requires_approval_and_admin_assignment():
    client=TestClient(app)
    response=client.post('/api/auth/register',json={'name':'Pending Doctor','email':'pending@test.local','password':'TestingPass123!','role':'doctor'})
    assert response.status_code==200
    assert client.post('/api/auth/login',json={'email':'pending@test.local','password':'TestingPass123!'}).status_code==403
    create_user('Admin','admin@test.local','TestingPass123!','admin',True)
    admin=signed_client('admin@test.local')
    assert admin.post('/api/admin/doctors/'+response.json()['id']+'/approve').status_code==200
    doctor=signed_client('pending@test.local')
    assert doctor.get('/api/patients').json()==[]
    patient=create_user('Assigned','assigned@test.local','TestingPass123!')
    assert admin.post('/api/admin/assignments',json={'doctor_id':response.json()['id'],'patient_id':patient['id']}).status_code==200
    assert doctor.get('/api/patients').json()[0]['id']==patient['id']

def test_logout_revokes_tokens_and_audit_cannot_be_rewritten():
    create_user('Session Test','session@test.local','TestingPass123!')
    client=signed_client('session@test.local')
    assert client.post('/api/auth/refresh').status_code==200
    token=client.cookies.get('qura_access')
    assert client.post('/api/auth/logout').status_code==200
    assert client.get('/api/auth/me',headers={'Authorization':'Bearer '+token}).status_code==401
    with connection() as c:
        with pytest.raises(sqlite3.IntegrityError):c.execute("UPDATE audit SET action='changed'")

def test_invalid_role_password_and_origin_are_rejected():
    client=TestClient(app)
    assert client.post('/api/auth/register',json={'name':'Unsafe','email':'unsafe@test.local','password':'TestingPass123!','role':'admin'}).status_code==422
    assert client.post('/api/auth/register',json={'name':'Weak','email':'weak@test.local','password':'abcdefghijkl'}).status_code==422
    assert client.post('/api/auth/login',json={'email':'a','password':'b'},headers={'Origin':'https://untrusted.example'}).status_code==403
