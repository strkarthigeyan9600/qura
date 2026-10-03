"""Human-controlled consultation and transport workflow, independent of research models.

Routes and traffic histories are explicitly synthetic; GPS may be supplied by the
driver's browser. Reported hospital capacity never substitutes for case acceptance.
"""
from __future__ import annotations

import asyncio
import json
import math
import time
import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from backend.auth import audit, can_access_patient, connection, create_user, current_user, roles
from backend.settings import allowed_origins

router = APIRouter(prefix='/api', tags=['Care and emergency coordination'])
ACTIVE = ('assigned', 'accepted', 'en_route_patient', 'arrived_pickup', 'patient_onboard',
          'destination_requested', 'destination_confirmed', 'en_route_hospital', 'arrived_hospital', 'handover_complete')
STATUS_LABELS = {
    'referred': 'Referral awaiting verification', 'verified': 'Verified · awaiting dispatch',
    'assigned': 'Driver response pending', 'accepted': 'Dispatch accepted',
    'en_route_patient': 'En route to patient', 'arrived_pickup': 'Arrived at pickup',
    'patient_onboard': 'Patient onboard · destination needed', 'destination_requested': 'Hospital acceptance pending',
    'destination_confirmed': 'Destination confirmed', 'en_route_hospital': 'En route to hospital',
    'arrived_hospital': 'Arrived at hospital', 'handover_complete': 'Handover complete · admission pending',
    'closed': 'Admission recorded · case closed', 'cancelled': 'Cancelled before pickup',
}


def initialize() -> None:
    with connection() as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS health_profiles(patient_id TEXT PRIMARY KEY REFERENCES users(id),body TEXT NOT NULL,updated_at REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS consultations(id TEXT PRIMARY KEY,patient_id TEXT NOT NULL REFERENCES users(id),doctor_id TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL,body TEXT NOT NULL,created_at REAL NOT NULL,updated_at REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS hospitals(id TEXT PRIMARY KEY,user_id TEXT UNIQUE NOT NULL REFERENCES users(id),name TEXT NOT NULL,latitude REAL NOT NULL,longitude REAL NOT NULL,beds INTEGER NOT NULL CHECK(beds>=0),icu_beds INTEGER NOT NULL CHECK(icu_beds>=0),accepting INTEGER NOT NULL,capabilities TEXT NOT NULL,traffic_factor REAL NOT NULL,updated_at REAL NOT NULL,source TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS ambulances(id TEXT PRIMARY KEY,driver_id TEXT UNIQUE NOT NULL REFERENCES users(id),name TEXT NOT NULL,status TEXT NOT NULL,latitude REAL NOT NULL,longitude REAL NOT NULL,equipment TEXT NOT NULL,updated_at REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS emergency_cases(id TEXT PRIMARY KEY,consultation_id TEXT UNIQUE NOT NULL REFERENCES consultations(id),patient_id TEXT NOT NULL REFERENCES users(id),doctor_id TEXT NOT NULL REFERENCES users(id),driver_id TEXT REFERENCES users(id),ambulance_id TEXT REFERENCES ambulances(id),hospital_id TEXT REFERENCES hospitals(id),status TEXT NOT NULL,body TEXT NOT NULL,created_at REAL NOT NULL,updated_at REAL NOT NULL,revision INTEGER NOT NULL DEFAULT 1);
        CREATE TABLE IF NOT EXISTS emergency_events(id INTEGER PRIMARY KEY AUTOINCREMENT,case_id TEXT NOT NULL REFERENCES emergency_cases(id),actor_id TEXT NOT NULL REFERENCES users(id),action TEXT NOT NULL,status TEXT NOT NULL,note TEXT NOT NULL,timestamp REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS gps_points(id INTEGER PRIMARY KEY AUTOINCREMENT,case_id TEXT NOT NULL REFERENCES emergency_cases(id),latitude REAL NOT NULL,longitude REAL NOT NULL,source TEXT NOT NULL,timestamp REAL NOT NULL);
        CREATE INDEX IF NOT EXISTS emergency_patient ON emergency_cases(patient_id);
        CREATE INDEX IF NOT EXISTS emergency_driver ON emergency_cases(driver_id);
        CREATE INDEX IF NOT EXISTS emergency_hospital ON emergency_cases(hospital_id);
        CREATE INDEX IF NOT EXISTS gps_case ON gps_points(case_id,id);
        CREATE TRIGGER IF NOT EXISTS emergency_events_no_update BEFORE UPDATE ON emergency_events BEGIN SELECT RAISE(ABORT,'Timeline entries are append-only'); END;
        CREATE TRIGGER IF NOT EXISTS emergency_events_no_delete BEFORE DELETE ON emergency_events BEGIN SELECT RAISE(ABORT,'Timeline entries are append-only'); END;
        ''')


def require_shared(c: Any, patient_id: str) -> dict[str, Any]:
    row = c.execute('SELECT body FROM health_profiles WHERE patient_id=?', (patient_id,)).fetchone()
    profile = json.loads(row['body']) if row else {}
    if not profile.get('sharing_consent'):
        raise HTTPException(403, 'The patient must enable health-profile sharing consent first')
    return profile


class Profile(BaseModel):
    age: int | None = Field(default=None, ge=0, le=120)
    symptoms: str = Field(default='', max_length=3000)
    medical_history: str = Field(default='', max_length=3000)
    allergies: str = Field(default='', max_length=1000)
    medications: str = Field(default='', max_length=1000)
    contact: str = Field(default='', max_length=200)
    vital_notes: str = Field(default='', max_length=1000)
    sharing_consent: bool = False


@router.get('/care/profile')
def profile(patient_id: str | None = None, user: dict = Depends(current_user)) -> dict:
    identifier = patient_id or user['id']
    if user['role'] not in ('patient', 'doctor', 'admin') or not can_access_patient(user, identifier):
        raise HTTPException(404, 'Profile not found')
    with connection() as c:
        row = c.execute('SELECT body,updated_at FROM health_profiles WHERE patient_id=?', (identifier,)).fetchone()
        data = json.loads(row['body']) if row else Profile().model_dump()
        if user['role'] != 'patient':
            require_shared(c, identifier)
        return {'patient_id': identifier, **data, 'updated_at': row['updated_at'] if row else None}


@router.put('/care/profile')
def save_profile(payload: Profile, user: dict = Depends(roles('patient'))) -> dict:
    with connection() as c:
        c.execute('INSERT OR REPLACE INTO health_profiles VALUES(?,?,?)',
                  (user['id'], json.dumps(payload.model_dump()), time.time()))
    audit(user['id'], 'update_health_profile', 'profile:' + user['id'])
    return profile(user=user)


class ConsultationRequest(BaseModel):
    doctor_id: str
    reason: str = Field(min_length=3, max_length=3000)
    share_chat: bool = False


@router.get('/care/doctors')
def assigned_doctors(user: dict = Depends(roles('patient'))) -> list[dict]:
    with connection() as c:
        return [dict(r) for r in c.execute('SELECT u.id,u.name FROM users u JOIN assignments a ON a.doctor_id=u.id WHERE a.patient_id=? AND u.approved=1 AND u.role=\'doctor\'', (user['id'],))]


@router.post('/care/consultations')
def request_consultation(payload: ConsultationRequest, user: dict = Depends(roles('patient'))) -> dict:
    identifier, now = uuid.uuid4().hex, time.time()
    with connection() as c:
        c.execute('BEGIN IMMEDIATE')
        require_shared(c, user['id'])
        doctor = c.execute('SELECT u.id FROM users u JOIN assignments a ON a.doctor_id=u.id WHERE a.patient_id=? AND u.id=? AND u.role=\'doctor\' AND u.approved=1', (user['id'], payload.doctor_id)).fetchone()
        if not doctor:
            raise HTTPException(422, 'Select a currently assigned approved doctor')
        if c.execute("SELECT 1 FROM consultations WHERE patient_id=? AND doctor_id=? AND status='requested'", (user['id'], payload.doctor_id)).fetchone():
            raise HTTPException(409, 'A consultation request is already pending with this doctor')
        body = {'reason': payload.reason, 'share_chat': payload.share_chat, 'notes': '', 'outcome': None, 'instructions': ''}
        c.execute('INSERT INTO consultations VALUES(?,?,?,?,?,?,?)', (identifier, user['id'], payload.doctor_id, 'requested', json.dumps(body), now, now))
    audit(user['id'], 'request_consultation', 'consultation:' + identifier)
    return {'id': identifier, 'status': 'requested'}


def consultation_view(row: Any, c: Any, user: dict) -> dict:
    data = {**dict(row), **json.loads(row['body'])}
    del data['body']
    for role in ('patient', 'doctor'):
        data[role + '_name'] = c.execute('SELECT name FROM users WHERE id=?', (row[role + '_id'],)).fetchone()['name']
    sharing = c.execute('SELECT body FROM health_profiles WHERE patient_id=?', (row['patient_id'],)).fetchone()
    consent = bool(sharing and json.loads(sharing['body']).get('sharing_consent'))
    data['profile_shared'] = consent
    data['chat_excerpt'] = []
    if user['role'] == 'doctor' and consent and data['share_chat']:
        # A small, current excerpt; withdrawal or deletion takes immediate effect.
        from backend.repository import listing
        data['chat_excerpt'] = [{'text': r.get('text', ''), 'reply': r.get('reply', '')}
                                for r in listing('chat') if r.get('user_id') == row['patient_id']][:5]
    case = c.execute('SELECT id,status FROM emergency_cases WHERE consultation_id=?', (row['id'],)).fetchone()
    data['emergency_case'] = dict(case) if case else None
    return data


@router.get('/care/consultations')
def consultations(user: dict = Depends(roles('patient', 'doctor', 'admin'))) -> list[dict]:
    with connection() as c:
        rows = c.execute('SELECT * FROM consultations ORDER BY created_at DESC').fetchall()
        return [consultation_view(r, c, user) for r in rows if
                user['role'] == 'admin' or user['role'] == 'patient' and r['patient_id'] == user['id'] or
                user['role'] == 'doctor' and r['doctor_id'] == user['id'] and can_access_patient(user, r['patient_id'])]


class ConsultationOutcome(BaseModel):
    notes: str = Field(min_length=3, max_length=5000)
    outcome: Literal['follow_up', 'examination', 'care_instructions', 'emergency']
    instructions: str = Field(default='', max_length=3000)


@router.post('/care/consultations/{identifier}/outcome')
def record_outcome(identifier: str, payload: ConsultationOutcome, user: dict = Depends(roles('doctor'))) -> dict:
    with connection() as c:
        c.execute('BEGIN IMMEDIATE')
        row = c.execute('SELECT * FROM consultations WHERE id=?', (identifier,)).fetchone()
        if not row or row['doctor_id'] != user['id'] or not can_access_patient(user, row['patient_id']):
            raise HTTPException(404, 'Consultation not found')
        require_shared(c, row['patient_id'])
        if row['status'] != 'requested':
            raise HTTPException(409, 'This consultation already has a recorded outcome')
        body = {**json.loads(row['body']), **payload.model_dump()}
        c.execute("UPDATE consultations SET status='reviewed',body=?,updated_at=? WHERE id=?", (json.dumps(body), time.time(), identifier))
    audit(user['id'], 'record_consultation_outcome', 'consultation:' + identifier)
    return {'id': identifier, 'status': 'reviewed', **body}


class Referral(BaseModel):
    consultation_id: str
    pickup_address: str = Field(min_length=3, max_length=1000)
    contact_details: str = Field(default='', max_length=200)
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)
    priority: Literal['urgent', 'high', 'standard'] = 'urgent'
    bed_type: Literal['general', 'icu'] = 'general'
    required_capability: Literal['general', 'cardiac', 'trauma'] = 'general'
    transport_notes: str = Field(min_length=3, max_length=3000)
    referral_notes: str = Field(min_length=3, max_length=5000)


def event(c: Any, case: dict, actor: str, action: str, note: str = '') -> None:
    now = time.time()
    case['updated_at'] = now
    case['revision'] += 1
    c.execute('UPDATE emergency_cases SET driver_id=?,ambulance_id=?,hospital_id=?,status=?,body=?,updated_at=?,revision=? WHERE id=?',
              (case['driver_id'], case['ambulance_id'], case['hospital_id'], case['status'], json.dumps(case['details']), now, case['revision'], case['id']))
    c.execute('INSERT INTO emergency_events(case_id,actor_id,action,status,note,timestamp) VALUES(?,?,?,?,?,?)',
              (case['id'], actor, action, case['status'], note, now))


def raw_case(c: Any, identifier: str) -> dict:
    row = c.execute('SELECT * FROM emergency_cases WHERE id=?', (identifier,)).fetchone()
    if not row:
        raise HTTPException(404, 'Emergency case not found')
    case = dict(row)
    case['details'] = json.loads(case.pop('body'))
    return case


def accessible(case: dict, user: dict, c: Any) -> bool:
    if user['role'] == 'admin':
        return True
    if user['role'] == 'patient':
        return user['id'] == case['patient_id']
    if user['role'] == 'doctor':
        return user['id'] == case['doctor_id'] and can_access_patient(user, case['patient_id'])
    if user['role'] == 'driver':
        return user['id'] == case['driver_id']
    if user['role'] == 'hospital' and case['hospital_id']:
        hospital = c.execute('SELECT user_id FROM hospitals WHERE id=?', (case['hospital_id'],)).fetchone()
        return bool(hospital and hospital['user_id'] == user['id'])
    return False


def checked_case(c: Any, identifier: str, user: dict) -> dict:
    case = raw_case(c, identifier)
    if not accessible(case, user, c):
        raise HTTPException(404, 'Emergency case not found')
    return case


@router.post('/emergency/cases')
def refer(payload: Referral, user: dict = Depends(roles('doctor'))) -> dict:
    identifier, now = 'Q-' + uuid.uuid4().hex[:16].upper(), time.time()
    with connection() as c:
        c.execute('BEGIN IMMEDIATE')
        consult = c.execute('SELECT * FROM consultations WHERE id=?', (payload.consultation_id,)).fetchone()
        if not consult or consult['doctor_id'] != user['id'] or not can_access_patient(user, consult['patient_id']):
            raise HTTPException(404, 'Consultation not found')
        require_shared(c, consult['patient_id'])
        if consult['status'] != 'reviewed' or json.loads(consult['body']).get('outcome') != 'emergency':
            raise HTTPException(409, 'Record an emergency consultation outcome before referral')
        if c.execute('SELECT 1 FROM emergency_cases WHERE consultation_id=?', (payload.consultation_id,)).fetchone():
            raise HTTPException(409, 'This consultation already has an emergency case')
        details = {**payload.model_dump(), 'hospital_accepted': False, 'reservation_active': False,
                   'prepared': False, 'arrival_confirmed': False, 'needs_reconfirmation': False,
                   'admission': None, 'route': None, 'coordination_notes': [], 'integration_mode': 'synthetic_routes_and_capacity'}
        c.execute('INSERT INTO emergency_cases VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
                  (identifier, payload.consultation_id, consult['patient_id'], user['id'], None, None, None,
                   'referred', json.dumps(details), now, now, 1))
        case = raw_case(c, identifier)
        event(c, case, user['id'], 'referral_created', payload.referral_notes)
    audit(user['id'], 'emergency_referral', 'case:' + identifier)
    return case_view(identifier, user)


def distance(a: tuple, b: tuple) -> float:
    la, lo, lb, lp = map(math.radians, (*a, *b))
    h = math.sin((lb - la) / 2) ** 2 + math.cos(la) * math.cos(lb) * math.sin((lp - lo) / 2) ** 2
    return 6371 * 2 * math.asin(min(1, math.sqrt(h)))


def route_for(start: tuple, hospital: Any) -> dict:
    """Synthetic traffic regression on 7 days of generated hourly observations.

    A deterministic explanatory model, not real traffic or road navigation.
    Neither clinical models nor external AI are used by this service.
    """
    from sklearn.linear_model import LinearRegression
    import numpy as np
    hours = np.tile(np.arange(24), 7)
    x = np.column_stack([np.sin(hours * math.pi / 12), np.cos(hours * math.pi / 12),
                         np.sin(hours * math.pi / 6), np.cos(hours * math.pi / 6)])
    y = 1.25 + .3 * np.cos((hours - 8) * math.pi / 6) + .08 * np.sin(np.arange(168))
    model = LinearRegression().fit(x, y)
    hour = (time.time() / 3600 + 5.5) % 24
    future = hour + .5
    features = [[math.sin(future * math.pi / 12), math.cos(future * math.pi / 12),
                 math.sin(future * math.pi / 6), math.cos(future * math.pi / 6)]]
    predicted = round(float(np.clip(model.predict(features)[0], 1, 2.5)), 2)
    direct_km = distance(start, (hospital['latitude'], hospital['longitude']))
    approximate_km = max(.05, direct_km * 1.3)
    current_factor = hospital['traffic_factor']
    minutes = round(max(1, approximate_km / 35 * 60 * max(current_factor, predicted)), 1)
    return {'distance_km': round(approximate_km, 2), 'eta_minutes': minutes,
            'current_traffic_factor': current_factor, 'predicted_traffic_factor': predicted,
            'cost': round(minutes + approximate_km * .2, 2),
            'polyline': [list(start), [hospital['latitude'], hospital['longitude']]],
            'source': 'SIMULATED · straight-line schematic with 1.3 distance factor; not road directions',
            'prediction_source': 'Linear regression trained on 168 synthetic hourly observations',
            'updated_at': time.time()}


def serialize(c: Any, case: dict, user: dict) -> dict:
    data = {**case, **case['details']}
    del data['details']
    data['status_label'] = STATUS_LABELS.get(case['status'], case['status'])
    data['patient_name'] = c.execute('SELECT name FROM users WHERE id=?', (case['patient_id'],)).fetchone()['name']
    data['doctor_name'] = c.execute('SELECT name FROM users WHERE id=?', (case['doctor_id'],)).fetchone()['name']
    data['ambulance'] = dict(c.execute('SELECT * FROM ambulances WHERE id=?', (case['ambulance_id'],)).fetchone()) if case['ambulance_id'] else None
    data['hospital'] = dict(c.execute('SELECT * FROM hospitals WHERE id=?', (case['hospital_id'],)).fetchone()) if case['hospital_id'] else None
    data['timeline'] = [dict(r) for r in c.execute('SELECT action,status,note,timestamp FROM emergency_events WHERE case_id=? ORDER BY id', (case['id'],))]
    points = [dict(r) for r in c.execute('SELECT latitude,longitude,source,timestamp FROM gps_points WHERE case_id=? ORDER BY id DESC LIMIT 200', (case['id'],))]
    data['gps_history'] = list(reversed(points))
    data['location'] = points[0] if points else None
    data['gps_stale'] = bool(points and time.time() - points[0]['timestamp'] > 60)
    data['health_profile'] = None
    shared = c.execute('SELECT body FROM health_profiles WHERE patient_id=?', (case['patient_id'],)).fetchone()
    if shared and json.loads(shared['body']).get('sharing_consent') and user['role'] in ('patient', 'doctor', 'admin', 'hospital'):
        fields = ('age', 'symptoms', 'medical_history', 'allergies', 'medications', 'vital_notes')
        profile = json.loads(shared['body'])
        data['health_profile'] = {key: profile.get(key) for key in fields}
    # Drivers receive transport/referral information, not profile or chatbot history.
    return data


@router.get('/emergency/cases')
def cases(user: dict = Depends(current_user)) -> list[dict]:
    with connection() as c:
        rows = c.execute('SELECT id FROM emergency_cases ORDER BY created_at DESC').fetchall()
        return [serialize(c, case, user) for row in rows if accessible(case := raw_case(c, row['id']), user, c)]


@router.get('/emergency/cases/{identifier}')
def case_view(identifier: str, user: dict = Depends(current_user)) -> dict:
    with connection() as c:
        return serialize(c, checked_case(c, identifier, user), user)


@router.get('/emergency/resources')
def resources(user: dict = Depends(roles('admin', 'driver', 'hospital', 'doctor'))) -> dict:
    with connection() as c:
        ambulances = [dict(r) for r in c.execute('SELECT * FROM ambulances') if user['role'] == 'admin' or r['driver_id'] == user['id']]
        hospitals = [dict(r) for r in c.execute('SELECT * FROM hospitals') if user['role'] != 'hospital' or r['user_id'] == user['id']]
        return {'ambulances': ambulances, 'hospitals': hospitals, 'integration_mode': 'synthetic_demo',
                'warning': 'Capacity is manually reported. Routes/traffic are simulated. Confirm destination with receiving staff.'}


@router.get('/emergency/cases/{identifier}/options')
def options(identifier: str, user: dict = Depends(roles('admin', 'doctor', 'driver'))) -> dict:
    with connection() as c:
        case = checked_case(c, identifier, user)
        if case['status'] not in ('patient_onboard', 'destination_requested', 'destination_confirmed', 'en_route_hospital'):
            raise HTTPException(409, 'Hospital selection is available after patient pickup')
        point = c.execute('SELECT latitude,longitude FROM gps_points WHERE case_id=? ORDER BY id DESC LIMIT 1', (identifier,)).fetchone()
        start = (point['latitude'], point['longitude']) if point else (case['details']['latitude'], case['details']['longitude'])
        result = []
        for row in c.execute('SELECT * FROM hospitals'):
            hospital = dict(row)
            reasons = []
            required = case['details']['required_capability']
            if required not in json.loads(hospital['capabilities']):reasons.append('Required department is not reported')
            bed = 'icu_beds' if case['details']['bed_type'] == 'icu' else 'beds'
            has_reservation = case['hospital_id'] == hospital['id'] and case['details']['reservation_active']
            if hospital[bed] <= 0 and not has_reservation:reasons.append('No suitable reported free bed')
            if not hospital['accepting']:reasons.append('Hospital is not accepting referrals')
            if time.time() - hospital['updated_at'] > 1800:reasons.append('Capacity report is stale; refresh and coordinate manually')
            if distance(start, (hospital['latitude'], hospital['longitude'])) > 60:reasons.append('Outside the 60 km supported demo search area')
            result.append({**hospital, 'eligible': not reasons, 'reasons': reasons,
                           'acceptance': 'Confirmed for this case' if has_reservation and case['details']['hospital_accepted'] else 'Receiving hospital confirmation required',
                           'route': route_for(start, hospital)})
        result.sort(key=lambda h: (not h['eligible'], h['route']['cost']))
        return {'options': result, 'requires_manual_coordination': not any(h['eligible'] for h in result),
                'warning': 'Simulated route ranking supports human coordination; it does not make clinical decisions.'}


class CaseAction(BaseModel):
    action: Literal['verify', 'assign', 'reassign', 'accept', 'reject', 'en_route_patient', 'arrived_pickup',
                    'patient_onboard', 'select_hospital', 'accept_hospital', 'reject_hospital', 'prepare',
                    'en_route_hospital', 'arrived_hospital', 'confirm_arrival', 'reconfirm_hospital', 'handover', 'admit', 'coordinate', 'cancel']
    ambulance_id: str | None = None
    hospital_id: str | None = None
    note: str = Field(default='', max_length=3000)
    bed_assignment: str = Field(default='', max_length=200)


def release_bed(c: Any, case: dict) -> None:
    if case['hospital_id'] and case['details'].get('reservation_active'):
        column = 'icu_beds' if case['details']['bed_type'] == 'icu' else 'beds'
        c.execute(f'UPDATE hospitals SET {column}={column}+1 WHERE id=?', (case['hospital_id'],))
    case['details'].update(hospital_accepted=False, reservation_active=False, prepared=False, arrival_confirmed=False, needs_reconfirmation=False)


@router.post('/emergency/cases/{identifier}/actions')
def act(identifier: str, payload: CaseAction, user: dict = Depends(current_user)) -> dict:
    with connection() as c:
        # Status checks, fleet locks and bed reservations share one transaction.
        c.execute('BEGIN IMMEDIATE')
        case = checked_case(c, identifier, user)
        action, status, role, details = payload.action, case['status'], user['role'], case['details']
        if status in ('closed', 'cancelled'):raise HTTPException(409, 'This case is already closed')

        def allow(allowed_role: str, *states: str) -> None:
            if role != allowed_role:raise HTTPException(403, 'This action is not available for your role')
            if status not in states:raise HTTPException(409, 'Complete the preceding workflow stage first')

        if action == 'verify':
            allow('admin', 'referred');case['status'] = 'verified'
        elif action == 'assign':
            allow('admin', 'verified')
            unit = c.execute("SELECT a.* FROM ambulances a JOIN users u ON u.id=a.driver_id WHERE a.id=? AND a.status='available' AND u.approved=1", (payload.ambulance_id,)).fetchone()
            if not unit:raise HTTPException(409, 'Choose an available ambulance with an approved driver')
            if details['required_capability'] != 'general' and details['required_capability'] not in json.loads(unit['equipment']):
                raise HTTPException(422, 'This ambulance does not report the required transport equipment')
            c.execute("UPDATE ambulances SET status='assigned',updated_at=? WHERE id=?", (time.time(), unit['id']))
            case.update(driver_id=unit['driver_id'], ambulance_id=unit['id'], status='assigned')
        elif action == 'reassign':
            allow('admin', 'assigned', 'accepted', 'en_route_patient', 'arrived_pickup')
            if not payload.note.strip():raise HTTPException(422, 'Record the reason for reassignment')
            c.execute("UPDATE ambulances SET status='available',updated_at=? WHERE id=?", (time.time(), case['ambulance_id']))
            case.update(driver_id=None, ambulance_id=None, status='verified')
        elif action == 'reject':
            allow('driver', 'assigned')
            if not payload.note.strip():raise HTTPException(422, 'Record the reason for rejection')
            c.execute("UPDATE ambulances SET status='available',updated_at=? WHERE id=?", (time.time(), case['ambulance_id']))
            case.update(driver_id=None, ambulance_id=None, status='verified')
        elif action == 'accept':allow('driver', 'assigned');case['status'] = 'accepted'
        elif action == 'en_route_patient':allow('driver', 'accepted');case['status'] = action
        elif action == 'arrived_pickup':allow('driver', 'en_route_patient');case['status'] = action
        elif action == 'patient_onboard':allow('driver', 'arrived_pickup');case['status'] = action
        elif action == 'select_hospital':
            allow('driver', 'patient_onboard', 'destination_requested', 'destination_confirmed', 'en_route_hospital')
            ranked = options(identifier, user)
            selected = next((h for h in ranked['options'] if h['id'] == payload.hospital_id and h['eligible']), None)
            if not selected:raise HTTPException(409, 'Hospital is not eligible; coordinate with administration')
            release_bed(c, case)
            case['hospital_id'] = selected['id'];case['status'] = 'destination_requested';details['route'] = selected['route']
        elif action == 'accept_hospital':
            allow('hospital', 'destination_requested')
            hospital = c.execute('SELECT * FROM hospitals WHERE id=?', (case['hospital_id'],)).fetchone()
            column = 'icu_beds' if details['bed_type'] == 'icu' else 'beds'
            if not hospital['accepting'] or hospital[column] < 1 or time.time() - hospital['updated_at'] > 1800 or details['required_capability'] not in json.loads(hospital['capabilities']):
                raise HTTPException(409, 'Confirm fresh suitable capacity before accepting this case')
            c.execute(f'UPDATE hospitals SET {column}={column}-1 WHERE id=?', (hospital['id'],))
            details.update(hospital_accepted=True, reservation_active=True, needs_reconfirmation=False)
            case['status'] = 'destination_confirmed'
        elif action == 'reject_hospital':
            allow('hospital', 'destination_requested', 'destination_confirmed', 'en_route_hospital')
            if not payload.note.strip():raise HTTPException(422, 'Record a rejection/withdrawal reason')
            release_bed(c, case);case['hospital_id'] = None;case['status'] = 'patient_onboard';details['route'] = None
        elif action == 'reconfirm_hospital':
            allow('hospital', 'destination_confirmed', 'en_route_hospital')
            hospital = c.execute('SELECT * FROM hospitals WHERE id=?', (case['hospital_id'],)).fetchone()
            if not hospital['accepting'] or not details['reservation_active'] or time.time()-hospital['updated_at']>1800:
                raise HTTPException(409, 'Refresh capacity and confirm the existing reserved bed first')
            if not payload.note.strip():raise HTTPException(422, 'Record staff confirmation of destination and reserved capacity')
            details['needs_reconfirmation'] = False
        elif action == 'prepare':
            allow('hospital', 'destination_confirmed', 'en_route_hospital')
            if details['needs_reconfirmation']:raise HTTPException(409, 'Acceptance needs reconfirmation')
            if not payload.note.strip():raise HTTPException(422, 'Record department, bed and team preparation')
            details['prepared'] = True
        elif action == 'en_route_hospital':
            allow('driver', 'destination_confirmed')
            if not details['hospital_accepted'] or details['needs_reconfirmation']:
                raise HTTPException(409, 'Hospital must confirm acceptance first')
            case['status'] = action
        elif action == 'arrived_hospital':
            allow('driver', 'en_route_hospital')
            if details['needs_reconfirmation']:raise HTTPException(409, 'Destination needs reconfirmation')
            case['status'] = action
        elif action == 'confirm_arrival':allow('hospital', 'arrived_hospital');details['arrival_confirmed'] = True
        elif action == 'handover':
            allow('driver', 'arrived_hospital')
            if not details['arrival_confirmed']:raise HTTPException(409, 'Receiving staff must confirm arrival first')
            if not payload.note.strip():raise HTTPException(422, 'Record the handover observations')
            case['status'] = 'handover_complete'
        elif action == 'admit':
            allow('hospital', 'handover_complete')
            if not payload.bed_assignment.strip():raise HTTPException(422, 'Record an admission bed assignment')
            details['admission'] = {'bed': payload.bed_assignment, 'note': payload.note, 'recorded_at': time.time()}
            details['reservation_active'] = False  # Reserved bed becomes occupied, not free.
            details['needs_reconfirmation'] = False
            case['status'] = 'closed'
            c.execute("UPDATE ambulances SET status='available',updated_at=? WHERE id=?", (time.time(), case['ambulance_id']))
        elif action == 'cancel':
            allow('admin', 'referred', 'verified', 'assigned', 'accepted', 'en_route_patient', 'arrived_pickup')
            if not payload.note.strip():raise HTTPException(422, 'Record a cancellation reason')
            if case['ambulance_id']:c.execute("UPDATE ambulances SET status='available',updated_at=? WHERE id=?", (time.time(), case['ambulance_id']))
            case['status'] = 'cancelled'
        elif action == 'coordinate':
            if role not in ('admin', 'doctor', 'driver', 'hospital'):raise HTTPException(403, 'Authorized staff only')
            if not payload.note.strip():raise HTTPException(422, 'Enter a manual coordination note')
            details['coordination_notes'].append({'note': payload.note, 'actor': user['name'], 'timestamp': time.time()})
        event(c, case, user['id'], action, payload.note)
    audit(user['id'], action, 'case:' + identifier)
    # Rejected drivers/hospitals lose access immediately; return a small acknowledgement.
    with connection() as c:
        if not accessible(raw_case(c, identifier), user, c):return {'id': identifier, 'status': case['status'], 'access_ended': True}
    return case_view(identifier, user)


class Position(BaseModel):
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)
    source: Literal['manual_demo', 'browser_gps'] = 'manual_demo'


@router.post('/emergency/cases/{identifier}/location')
def location(identifier: str, payload: Position, user: dict = Depends(roles('driver'))) -> dict:
    with connection() as c:
        c.execute('BEGIN IMMEDIATE')
        case = checked_case(c, identifier, user)
        if case['status'] not in ACTIVE or case['status'] == 'assigned':raise HTTPException(409, 'Accept the assignment before sharing position')
        previous = c.execute('SELECT timestamp FROM gps_points WHERE case_id=? ORDER BY id DESC LIMIT 1', (identifier,)).fetchone()
        if previous and time.time() - previous['timestamp'] < 2:raise HTTPException(429, 'Location updates are limited to one every two seconds')
        c.execute('INSERT INTO gps_points(case_id,latitude,longitude,source,timestamp) VALUES(?,?,?,?,?)', (identifier, payload.latitude, payload.longitude, payload.source, time.time()))
        c.execute('UPDATE ambulances SET latitude=?,longitude=?,updated_at=? WHERE id=?', (payload.latitude, payload.longitude, time.time(), case['ambulance_id']))
        if case['hospital_id']:
            hospital = c.execute('SELECT * FROM hospitals WHERE id=?', (case['hospital_id'],)).fetchone()
            case['details']['route'] = route_for((payload.latitude, payload.longitude), hospital)
        event(c, case, user['id'], 'location_updated', 'Browser GPS' if payload.source == 'browser_gps' else 'Manual/simulated position')
    audit(user['id'], 'location_updated', 'case:' + identifier)
    return case_view(identifier, user)


class Capacity(BaseModel):
    beds: int = Field(ge=0, le=10000)
    icu_beds: int = Field(ge=0, le=10000)
    accepting: bool
    traffic_factor: float = Field(default=1.2, ge=1, le=4, allow_inf_nan=False)


@router.put('/emergency/hospitals/{identifier}/capacity')
def capacity(identifier: str, payload: Capacity, user: dict = Depends(roles('hospital', 'admin'))) -> dict:
    with connection() as c:
        c.execute('BEGIN IMMEDIATE')
        hospital = c.execute('SELECT * FROM hospitals WHERE id=?', (identifier,)).fetchone()
        if not hospital or user['role'] != 'admin' and hospital['user_id'] != user['id']:raise HTTPException(404, 'Hospital not found')
        c.execute('UPDATE hospitals SET beds=?,icu_beds=?,accepting=?,traffic_factor=?,updated_at=? WHERE id=?',
                  (payload.beds, payload.icu_beds, int(payload.accepting), payload.traffic_factor, time.time(), identifier))
        for row in c.execute("SELECT id FROM emergency_cases WHERE hospital_id=? AND status NOT IN ('closed','cancelled')", (identifier,)).fetchall():
            case = raw_case(c, row['id'])
            if not payload.accepting and case['details']['hospital_accepted']:
                case['details']['needs_reconfirmation'] = True;case['details']['prepared'] = False
            if case['details']['route']:
                start = tuple(case['details']['route']['polyline'][0])
                updated = {**dict(hospital), **payload.model_dump()}
                case['details']['route'] = route_for(start, updated)
            event(c, case, user['id'], 'capacity_updated', 'Hospital capacity or traffic report changed; verify destination if flagged.')
    audit(user['id'], 'capacity_updated', 'hospital:' + identifier)
    return {'saved': True}


class Account(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(max_length=200)
    password: str = Field(min_length=12, max_length=128)
    role: Literal['driver', 'hospital']


@router.post('/admin/service-accounts')
def service_account(payload: Account, user: dict = Depends(roles('admin'))) -> dict:
    created = create_user(payload.name, payload.email, payload.password, payload.role, True)
    audit(user['id'], 'provision_service_account', 'user:' + created['id'])
    return created


class FleetUnit(BaseModel):
    driver_id: str
    name: str = Field(min_length=2, max_length=80)
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)
    equipment: list[Literal['general', 'cardiac', 'trauma']] = Field(default_factory=lambda: ['general'], max_length=3)


@router.post('/emergency/ambulances')
def add_unit(payload: FleetUnit, user: dict = Depends(roles('admin'))) -> dict:
    identifier = uuid.uuid4().hex
    with connection() as c:
        if not c.execute("SELECT 1 FROM users WHERE id=? AND role='driver' AND approved=1", (payload.driver_id,)).fetchone():raise HTTPException(422, 'Choose an approved driver')
        if c.execute('SELECT 1 FROM ambulances WHERE driver_id=?', (payload.driver_id,)).fetchone():raise HTTPException(409, 'Driver already has an ambulance unit')
        c.execute('INSERT INTO ambulances VALUES(?,?,?,?,?,?,?,?)', (identifier, payload.driver_id, payload.name, 'available', payload.latitude, payload.longitude, json.dumps(payload.equipment), time.time()))
    audit(user['id'], 'add_ambulance', 'ambulance:' + identifier)
    return {'id': identifier}


class HospitalRegistration(BaseModel):
    user_id: str
    name: str = Field(min_length=2, max_length=120)
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)
    beds: int = Field(ge=0, le=10000)
    icu_beds: int = Field(ge=0, le=10000)
    capabilities: list[Literal['general', 'cardiac', 'trauma']] = Field(default_factory=lambda: ['general'], max_length=3)


class FleetStatus(BaseModel):
    status: Literal['available', 'unavailable']


@router.put('/emergency/ambulances/{identifier}/availability')
def fleet_status(identifier: str, payload: FleetStatus, user: dict = Depends(roles('admin'))) -> dict:
    with connection() as c:
        c.execute('BEGIN IMMEDIATE')
        unit = c.execute('SELECT * FROM ambulances WHERE id=?', (identifier,)).fetchone()
        if not unit:raise HTTPException(404, 'Ambulance not found')
        if c.execute("SELECT 1 FROM emergency_cases WHERE ambulance_id=? AND status NOT IN ('closed','cancelled')", (identifier,)).fetchone():
            raise HTTPException(409, 'Reassign or finish the active case before changing fleet availability')
        c.execute('UPDATE ambulances SET status=?,updated_at=? WHERE id=?', (payload.status, time.time(), identifier))
    audit(user['id'], 'fleet_availability', 'ambulance:' + identifier)
    return {'saved': True}


@router.post('/emergency/hospitals')
def add_hospital(payload: HospitalRegistration, user: dict = Depends(roles('admin'))) -> dict:
    identifier = uuid.uuid4().hex
    with connection() as c:
        if not c.execute("SELECT 1 FROM users WHERE id=? AND role='hospital' AND approved=1", (payload.user_id,)).fetchone():raise HTTPException(422, 'Choose an approved hospital account')
        if c.execute('SELECT 1 FROM hospitals WHERE user_id=?', (payload.user_id,)).fetchone():raise HTTPException(409, 'Account already has a hospital')
        c.execute('INSERT INTO hospitals VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', (identifier, payload.user_id, payload.name, payload.latitude, payload.longitude, payload.beds, payload.icu_beds, 1, json.dumps(payload.capabilities), 1.2, time.time(), 'manually_reported_prototype'))
    audit(user['id'], 'add_hospital', 'hospital:' + identifier)
    return {'id': identifier}


@router.websocket('/emergency/cases/{identifier}/live')
async def live(websocket: WebSocket, identifier: str) -> None:
    """Read-only, origin-checked, session/assignment-checked live case feed."""
    if websocket.headers.get('origin') not in allowed_origins():
        await websocket.close(code=1008);return
    try:
        user = current_user(websocket)
        case_view(identifier, user)
    except HTTPException:
        await websocket.close(code=1008);return
    await websocket.accept()
    audit(user['id'], 'live_tracking_started', 'case:' + identifier)
    previous = ''
    try:
        while True:
            # Clear memoized identity so approval, session revocation and expiry are rechecked.
            websocket.state.user = None
            user = current_user(websocket)
            data = case_view(identifier, user)
            serialized = json.dumps(data, sort_keys=True)
            if serialized != previous:
                await websocket.send_json({'type': 'case_update', 'case': data});previous = serialized
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=1)
                if len(message) > 1000:await websocket.close(code=1009);return
            except asyncio.TimeoutError:pass
    except HTTPException:
        await websocket.close(code=1008)
    except WebSocketDisconnect:pass


initialize()
