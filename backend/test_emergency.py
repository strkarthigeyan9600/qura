"""Real API chain, capacity races, role isolation and live-feed revocation."""
import json
import uuid
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from backend.main import app
from backend.auth import connection, create_user
from backend.settings import allowed_origins


def setup_chain():
    with connection() as c:c.execute('DELETE FROM rate_limits')
    suffix = uuid.uuid4().hex[:8]
    clients, users = {}, {}
    for role in ('patient', 'doctor', 'admin', 'driver', 'hospital'):
        email = f'{role}-{suffix}@test.local'
        users[role] = create_user(role.title() + ' Synthetic', email, 'EmergencyTest9!Pass', role, True)
        client = TestClient(app)
        assert client.post('/api/auth/login', json={'email': email, 'password': 'EmergencyTest9!Pass'}).status_code == 200
        clients[role] = client
    admin, patient, doctor = clients['admin'], clients['patient'], clients['doctor']
    assert admin.post('/api/admin/assignments', json={'doctor_id': users['doctor']['id'], 'patient_id': users['patient']['id']}).status_code == 200
    unit = admin.post('/api/emergency/ambulances', json={'driver_id': users['driver']['id'], 'name': 'Synthetic Ambulance', 'latitude': 13.04, 'longitude': 80.22, 'equipment': ['general', 'cardiac', 'trauma']}).json()['id']
    hospital = admin.post('/api/emergency/hospitals', json={'user_id': users['hospital']['id'], 'name': 'Synthetic Hospital', 'latitude': 13.06, 'longitude': 80.25, 'beds': 1, 'icu_beds': 1, 'capabilities': ['general', 'cardiac', 'trauma']}).json()['id']
    assert patient.put('/api/care/profile', json={'symptoms': 'Synthetic symptoms', 'allergies': 'Synthetic allergy', 'sharing_consent': True}).status_code == 200
    consult = patient.post('/api/care/consultations', json={'doctor_id': users['doctor']['id'], 'reason': 'Synthetic consultation'}).json()['id']
    assert doctor.post(f'/api/care/consultations/{consult}/outcome', json={'notes': 'Synthetic clinician review', 'outcome': 'emergency', 'instructions': 'Human transport coordination'}).status_code == 200
    response = doctor.post('/api/emergency/cases', json={'consultation_id': consult, 'pickup_address': 'Synthetic pickup point', 'latitude': 13.04, 'longitude': 80.22, 'transport_notes': 'Synthetic transport requirements', 'referral_notes': 'Synthetic referral observations'})
    assert response.status_code == 200, response.text
    return clients, users, unit, hospital, response.json()['id']


def step(client, case, action, **kwargs):
    response = client.post(f'/api/emergency/cases/{case}/actions', json={'action': action, **kwargs})
    assert response.status_code == 200, response.text
    return response.json()


def pickup(clients, case, unit):
    step(clients['admin'], case, 'verify')
    step(clients['admin'], case, 'assign', ambulance_id=unit)
    for action in ('accept', 'en_route_patient', 'arrived_pickup', 'patient_onboard'):
        step(clients['driver'], case, action)


def test_full_transport_chain_without_research_or_chatbot(monkeypatch):
    def unavailable(*args, **kwargs):raise AssertionError('Emergency dispatch must not call a research model or chatbot')
    monkeypatch.setattr('backend.consensus.infer_pair', unavailable)
    monkeypatch.setattr('backend.chatbot.provider_reply', unavailable)
    clients, users, unit, hospital, case = setup_chain()
    assert clients['patient'].post(f'/api/emergency/cases/{case}/actions', json={'action': 'verify'}).status_code == 403
    assert clients['admin'].post(f'/api/emergency/cases/{case}/actions', json={'action': 'assign', 'ambulance_id': unit}).status_code == 409
    assert clients['driver'].get(f'/api/emergency/cases/{case}').status_code == 404
    pickup(clients, case, unit)
    position = clients['driver'].post(f'/api/emergency/cases/{case}/location', json={'latitude': 13.045, 'longitude': 80.225})
    assert position.status_code == 200
    assert position.json()['health_profile'] is None
    ranked = clients['driver'].get(f'/api/emergency/cases/{case}/options').json()['options']
    assert any(h['id'] == hospital and h['eligible'] for h in ranked)
    step(clients['driver'], case, 'select_hospital', hospital_id=hospital)
    assert clients['driver'].post(f'/api/emergency/cases/{case}/actions', json={'action': 'en_route_hospital'}).status_code == 409
    step(clients['hospital'], case, 'accept_hospital')
    step(clients['hospital'], case, 'prepare', note='Synthetic bed and team ready')
    step(clients['driver'], case, 'en_route_hospital')
    step(clients['driver'], case, 'arrived_hospital')
    assert clients['driver'].post(f'/api/emergency/cases/{case}/actions', json={'action': 'handover', 'note': 'Synthetic handover'}).status_code == 409
    step(clients['hospital'], case, 'confirm_arrival')
    step(clients['driver'], case, 'handover', note='Synthetic receiving team handover')
    completed = step(clients['hospital'], case, 'admit', bed_assignment='SYNTHETIC-BED-01', note='Synthetic admission')
    assert completed['status'] == 'closed'
    assert completed['admission']['bed'] == 'SYNTHETIC-BED-01'
    assert completed['route']['source'].startswith('SIMULATED')
    assert completed['location']['source'] == 'manual_demo'
    assert completed['timeline'][-1]['action'] == 'admit'
    assert clients['patient'].get(f'/api/emergency/cases/{case}').json()['status'] == 'closed'
    fleet = clients['admin'].get('/api/emergency/resources').json()['ambulances']
    assert next(a for a in fleet if a['id'] == unit)['status'] == 'available'
    with connection() as c:
        assert c.execute('SELECT beds FROM hospitals WHERE id=?', (hospital,)).fetchone()['beds'] == 0
    assert clients['driver'].get('/api/models').status_code == 403
    assert clients['hospital'].get('/api/care/consultations').status_code == 403


def test_rejection_reassignment_and_reserved_bed_release():
    clients, users, unit, hospital, case = setup_chain()
    step(clients['admin'], case, 'verify')
    step(clients['admin'], case, 'assign', ambulance_id=unit)
    result = step(clients['driver'], case, 'reject', note='Synthetic unit unavailable')
    assert result['access_ended']
    assert clients['driver'].get(f'/api/emergency/cases/{case}').status_code == 404
    step(clients['admin'], case, 'assign', ambulance_id=unit)
    step(clients['admin'], case, 'reassign', note='Synthetic dispatcher reassignment')
    step(clients['admin'], case, 'assign', ambulance_id=unit)
    for action in ('accept', 'en_route_patient', 'arrived_pickup', 'patient_onboard'):step(clients['driver'], case, action)
    step(clients['driver'], case, 'select_hospital', hospital_id=hospital)
    step(clients['hospital'], case, 'accept_hospital')
    step(clients['hospital'], case, 'reject_hospital', note='Synthetic acceptance withdrawn')
    assert clients['hospital'].get(f'/api/emergency/cases/{case}').status_code == 404
    with connection() as c:assert c.execute('SELECT beds FROM hospitals WHERE id=?', (hospital,)).fetchone()['beds'] == 1
    assert clients['driver'].get(f'/api/emergency/cases/{case}').json()['status'] == 'patient_onboard'


def test_consent_is_required_and_revocation_hides_profile_and_chat():
    clients, users, unit, hospital, case = setup_chain()
    patient = clients['patient']
    assert patient.put('/api/care/profile', json={'sharing_consent': False, 'symptoms': 'Private synthetic text'}).status_code == 200
    assert patient.post('/api/care/consultations', json={'doctor_id': users['doctor']['id'], 'reason': 'Another synthetic request'}).status_code == 403
    assert clients['doctor'].get('/api/care/profile', params={'patient_id': users['patient']['id']}).status_code == 403
    assert clients['doctor'].get(f'/api/emergency/cases/{case}').json()['health_profile'] is None
    stranger = create_user('Other Patient', 'other-' + uuid.uuid4().hex + '@test.local', 'EmergencyTest9!Pass')
    stranger_client = TestClient(app)
    stranger_client.post('/api/auth/login', json={'email': stranger['email'], 'password': 'EmergencyTest9!Pass'})
    assert stranger_client.get(f'/api/emergency/cases/{case}').status_code == 404
    assert stranger_client.get('/api/emergency/cases').json() == []


def test_capacity_change_requires_human_reconfirmation_and_atomic_bed_acceptance():
    clients, users, unit, hospital, case = setup_chain()
    pickup(clients, case, unit)
    step(clients['driver'], case, 'select_hospital', hospital_id=hospital)
    # Repeated acceptance must reserve only one bed, including concurrent requests.
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: clients['hospital'].post(f'/api/emergency/cases/{case}/actions', json={'action': 'accept_hospital'}).status_code, range(2)))
    assert sorted(responses) == [200, 409]
    assert clients['hospital'].put(f'/api/emergency/hospitals/{hospital}/capacity', json={'beds': 0, 'icu_beds': 1, 'accepting': False}).status_code == 200
    assert clients['driver'].get(f'/api/emergency/cases/{case}').json()['needs_reconfirmation']
    assert clients['driver'].post(f'/api/emergency/cases/{case}/actions', json={'action': 'en_route_hospital'}).status_code == 409
    clients['hospital'].put(f'/api/emergency/hospitals/{hospital}/capacity', json={'beds': 0, 'icu_beds': 1, 'accepting': True})
    step(clients['hospital'], case, 'reconfirm_hospital', note='Staff reconfirm the reserved synthetic bed')
    step(clients['driver'], case, 'en_route_hospital')
    with connection() as c:assert c.execute('SELECT beds FROM hospitals WHERE id=?', (hospital,)).fetchone()['beds'] == 0


def test_live_feed_checks_origin_identity_and_reassignment():
    clients, users, unit, hospital, case = setup_chain()
    step(clients['admin'], case, 'verify');step(clients['admin'], case, 'assign', ambulance_id=unit)
    path = f'/api/emergency/cases/{case}/live'
    with pytest.raises(WebSocketDisconnect):
        with clients['driver'].websocket_connect(path, headers={'Origin': 'https://untrusted.example'}):pass
    with clients['driver'].websocket_connect(path, headers={'Origin': allowed_origins()[0]}) as ws:
        assert ws.receive_json()['case']['status'] == 'assigned'
        step(clients['admin'], case, 'reassign', note='Synthetic revocation check')
        with pytest.raises(WebSocketDisconnect):ws.receive_json()


def test_service_accounts_are_admin_only_and_resources_validate_roles():
    clients, users, unit, hospital, case = setup_chain()
    payload = {'name': 'Synthetic Operator', 'email': uuid.uuid4().hex + '@test.local', 'password': 'EmergencyTest9!Pass', 'role': 'driver'}
    assert clients['patient'].post('/api/admin/service-accounts', json=payload).status_code == 403
    assert clients['admin'].post('/api/admin/service-accounts', json=payload).status_code == 200
    assert clients['patient'].post('/api/auth/register', json=payload).status_code == 422
    assert clients['admin'].post('/api/emergency/ambulances', json={'driver_id': users['patient']['id'], 'name': 'Invalid', 'latitude': 13, 'longitude': 80}).status_code == 422
    assert clients['driver'].post(f'/api/emergency/cases/{case}/location', json={'latitude': 100, 'longitude': 80}).status_code == 422
    assert clients['hospital'].get('/api/patients').json() == []


def test_existing_identity_database_migrates_without_losing_sessions_or_assignments(tmp_path):
    import sqlite3
    with sqlite3.connect(tmp_path / 'research.db') as c:
        c.executescript("""
        CREATE TABLE users(id TEXT PRIMARY KEY,role TEXT NOT NULL CHECK(role IN ('patient','doctor','admin')),name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,language_pref TEXT NOT NULL DEFAULT 'en',approved INTEGER NOT NULL DEFAULT 0,created_at REAL NOT NULL);
        CREATE TABLE sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),refresh_hash TEXT NOT NULL,expires_at REAL NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE assignments(doctor_id TEXT NOT NULL REFERENCES users(id),patient_id TEXT NOT NULL REFERENCES users(id),PRIMARY KEY(doctor_id,patient_id));
        INSERT INTO users VALUES('old-patient','patient','Synthetic Patient','old-p@test.local','synthetic-hash','en',1,1);
        INSERT INTO users VALUES('old-doctor','doctor','Synthetic Doctor','old-d@test.local','synthetic-hash','en',1,1);
        INSERT INTO sessions VALUES('old-session','old-patient','synthetic-refresh-hash',9999999999,0);
        INSERT INTO assignments VALUES('old-doctor','old-patient');
        """)
    code = """
from backend.auth import connection,create_user
with connection() as c:
 assert c.execute('SELECT COUNT(*) FROM users').fetchone()[0]==2
 assert c.execute('SELECT user_id FROM sessions').fetchone()[0]=='old-patient'
 assert c.execute('SELECT doctor_id FROM assignments').fetchone()[0]=='old-doctor'
 assert not c.execute('PRAGMA foreign_key_check').fetchall()
create_user('New Driver','migration-driver@test.local','EmergencyTest9!Pass','driver',True)
"""
    result = subprocess.run([sys.executable, '-c', code], env={**os.environ, 'QURA_STORAGE_DIR': str(tmp_path)}, capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, result.stderr
