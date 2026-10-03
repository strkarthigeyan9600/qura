"""Ownership-scoped patient profiles, assignments, consent and administrative audit."""
from __future__ import annotations
from typing import Any
import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.auth import connection, current_user, roles, public_user, audit, can_access_patient

router=APIRouter(prefix='/api',tags=['Research portals'])

@router.get('/patients')
def patients(user: dict[str,Any] = Depends(current_user)) -> list[dict[str,Any]]:
    """Only a patient's own profile or a doctor's assigned profiles."""
    with connection() as c:
        if user['role']=='admin':rows=c.execute("SELECT * FROM users WHERE role='patient'").fetchall()
        elif user['role']=='doctor':rows=c.execute('SELECT u.* FROM users u JOIN assignments a ON a.patient_id=u.id WHERE a.doctor_id=?',(user['id'],)).fetchall()
        elif user['role']=='patient':rows=c.execute('SELECT * FROM users WHERE id=?',(user['id'],)).fetchall()
        else:rows=[]
    audit(user['id'],'view','patient-list');return [public_user(r) for r in rows]

class Consent(BaseModel):
    """Explicit opt-in; withdrawal stops creation of new patient reports."""
    granted: bool

@router.get('/consent')
def get_consent(user: dict[str,Any] = Depends(current_user)) -> dict[str,Any]:
    """Return only the current user's consent."""
    with connection() as c:row=c.execute('SELECT granted,updated_at FROM consents WHERE user_id=?',(user['id'],)).fetchone()
    return dict(row) if row else {'granted':False,'updated_at':None}

@router.put('/consent')
def consent(payload: Consent,user: dict[str,Any] = Depends(roles('patient'))) -> dict[str,bool]:
    """Consent can be granted or withdrawn by the owner only."""
    with connection() as c:c.execute('INSERT OR REPLACE INTO consents VALUES(?,?,?)',(user['id'],int(payload.granted),time.time()))
    audit(user['id'],'consent_granted' if payload.granted else 'consent_withdrawn','consent:'+user['id'])
    return {'granted':payload.granted}

@router.get('/admin/users')
def users(user: dict[str,Any] = Depends(roles('admin'))) -> list[dict[str,Any]]:
    """Admin identity management never returns hashes."""
    with connection() as c:return [public_user(r) for r in c.execute('SELECT * FROM users')]

@router.post('/admin/doctors/{doctor_id}/approve')
def approve(doctor_id: str,user: dict[str,Any] = Depends(roles('admin'))) -> dict[str,bool]:
    """Only admins can activate doctor registrations."""
    with connection() as c:
        if not c.execute("SELECT 1 FROM users WHERE id=? AND role='doctor'",(doctor_id,)).fetchone():raise HTTPException(404,'Doctor not found')
        c.execute('UPDATE users SET approved=1 WHERE id=?',(doctor_id,))
    audit(user['id'],'approve_doctor','user:'+doctor_id);return {'approved':True}

class Assignment(BaseModel):
    """Validated identity relation rather than caller-controlled ownership."""
    doctor_id: str
    patient_id: str

@router.post('/admin/assignments')
def assign(payload: Assignment,user: dict[str,Any] = Depends(roles('admin'))) -> dict[str,bool]:
    """Assign an approved doctor to a patient."""
    with connection() as c:
        if not c.execute("SELECT 1 FROM users WHERE id=? AND role='doctor' AND approved=1",(payload.doctor_id,)).fetchone() or not c.execute("SELECT 1 FROM users WHERE id=? AND role='patient'",(payload.patient_id,)).fetchone():raise HTTPException(422,'Choose an approved doctor and a patient')
        c.execute('INSERT OR IGNORE INTO assignments VALUES(?,?)',(payload.doctor_id,payload.patient_id))
    audit(user['id'],'assign',payload.doctor_id+':'+payload.patient_id);return {'assigned':True}

@router.get('/admin/audit')
def audit_log(user: dict[str,Any] = Depends(roles('admin'))) -> list[dict[str,Any]]:
    """Read recent append-only audit metadata, excluding report content."""
    with connection() as c:return [dict(r) for r in c.execute('SELECT * FROM audit ORDER BY id DESC LIMIT 500')]
