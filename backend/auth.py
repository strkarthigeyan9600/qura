"""Argon2 identities, revocable cookie sessions and research role boundaries."""
from __future__ import annotations
from typing import Any
import hashlib
import json
import os
import re
import secrets
import sqlite3
import time
import uuid
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from backend.settings import storage_dir, allowed_origins

router=APIRouter(prefix='/api/auth',tags=['Authentication'])
hasher=PasswordHasher()

def connection() -> sqlite3.Connection:
    """Connect to the same isolated or runtime database with foreign keys enabled."""
    c=sqlite3.connect(storage_dir()/'research.db',timeout=20)
    c.row_factory=sqlite3.Row;c.execute('PRAGMA foreign_keys=ON');return c

def initialize() -> None:
    """Create identity and append-only audit structures without modifying legacy records."""
    with connection() as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,role TEXT NOT NULL CHECK(role IN ('patient','doctor','admin')),name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,language_pref TEXT NOT NULL DEFAULT 'en',approved INTEGER NOT NULL DEFAULT 0,created_at REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),refresh_hash TEXT NOT NULL,expires_at REAL NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS assignments(doctor_id TEXT NOT NULL REFERENCES users(id),patient_id TEXT NOT NULL REFERENCES users(id),PRIMARY KEY(doctor_id,patient_id));
        CREATE TABLE IF NOT EXISTS consents(user_id TEXT PRIMARY KEY REFERENCES users(id),granted INTEGER NOT NULL,updated_at REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,actor_id TEXT,action TEXT NOT NULL,resource TEXT NOT NULL,timestamp REAL NOT NULL);
        CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'Audit entries are append-only'); END;
        CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'Audit entries are append-only'); END;
        CREATE TABLE IF NOT EXISTS rate_limits(bucket TEXT NOT NULL,timestamp REAL NOT NULL);
        CREATE INDEX IF NOT EXISTS rate_bucket ON rate_limits(bucket,timestamp);
        ''')

def secret() -> str:
    """Require an environment secret; never silently issue insecure JWTs."""
    value=os.getenv('QURA_JWT_SECRET','')
    if len(value)<32: raise HTTPException(503,'Set QURA_JWT_SECRET to at least 32 random characters in .env')
    return value

def audit(actor: str | None,action: str,resource: str) -> None:
    """Append metadata only: no measurements, notes, passwords or chat text."""
    with connection() as c:c.execute('INSERT INTO audit(actor_id,action,resource,timestamp) VALUES(?,?,?,?)',(actor,action,resource,time.time()))

def rate_limit(bucket: str,limit: int,window: int = 60) -> None:
    """Apply a transactionally counted sliding-window limit persisted in SQLite."""
    with connection() as c:
        c.execute('BEGIN IMMEDIATE')
        c.execute('DELETE FROM rate_limits WHERE timestamp<?',(time.time()-86400,))
        count=c.execute('SELECT COUNT(*) FROM rate_limits WHERE bucket=? AND timestamp>?',(bucket,time.time()-window)).fetchone()[0]
        if count>=limit:raise HTTPException(429,'Too many requests; try again later',headers={'Retry-After':str(window)})
        c.execute('INSERT INTO rate_limits VALUES(?,?)',(bucket,time.time()))

def public_user(row: Any) -> dict[str,Any]:
    """Serialize the profile without credential fields."""
    return {k:row[k] for k in ['id','role','name','email','language_pref','approved','created_at']}

def create_user(name: str,email: str,password: str,role: str = 'patient',approved: bool = False,language: str = 'en') -> dict[str,Any]:
    """Create users; elevated approval is restricted to administrative callers."""
    email=email.strip().lower()
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email):raise HTTPException(422,'Enter a valid email')
    if len(password)<12 or not re.search('[A-Z]',password) or not re.search('[a-z]',password) or not re.search('[0-9]',password) or not re.search(r'[^A-Za-z0-9]',password):
        raise HTTPException(422,'Use at least 12 characters with uppercase, lowercase, a number and a symbol')
    identifier=uuid.uuid4().hex
    try:
        with connection() as c:
            c.execute('INSERT INTO users VALUES(?,?,?,?,?,?,?,?)',(identifier,role,name.strip(),email,hasher.hash(password),language,int(approved or role=='patient'),time.time()))
            c.execute('INSERT INTO consents VALUES(?,0,?)',(identifier,time.time()))
    except sqlite3.IntegrityError:raise HTTPException(409,'Unable to register this email')
    audit(identifier,'register','user:'+identifier)
    with connection() as c:return public_user(c.execute('SELECT * FROM users WHERE id=?',(identifier,)).fetchone())

def current_user(request: Request) -> dict[str,Any]:
    """Verify JWT plus persisted revocation and current approval on every request."""
    if getattr(request.state,'user',None):return request.state.user
    authorization=request.headers.get('authorization','')
    token=authorization[7:] if authorization.startswith('Bearer ') else request.cookies.get('qura_access')
    if not token:raise HTTPException(401,'Sign in to continue')
    try:claims=jwt.decode(token,secret(),algorithms=['HS256'],audience='qura',issuer='qura-local')
    except jwt.PyJWTError:raise HTTPException(401,'Session expired; sign in again')
    with connection() as c:
        row=c.execute('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.id=? AND s.revoked=0 AND s.expires_at>? AND u.id=?',(claims.get('sid'),time.time(),claims.get('sub'))).fetchone()
    if not row or not row['approved']:raise HTTPException(401,'Session unavailable or approval pending')
    user=public_user(row);request.state.user=user;return user

def roles(*allowed: str):
    """FastAPI dependency restricting role membership."""
    def dependency(user: dict[str,Any] = Depends(current_user)) -> dict[str,Any]:
        if user['role'] not in allowed:raise HTTPException(403,'This action is not available for your role')
        return user
    return dependency

def can_access_patient(user: dict[str,Any],patient_id: str) -> bool:
    """Own patient data, assigned doctor data, or administrative access only."""
    if user['role']=='admin':return True
    if user['role']=='patient':return user['id']==patient_id
    with connection() as c:return bool(c.execute('SELECT 1 FROM assignments WHERE doctor_id=? AND patient_id=?',(user['id'],patient_id)).fetchone())

def issue_session(response: Response,user: dict[str,Any],session_id: str | None = None) -> None:
    """Rotate refresh tokens and issue 15-minute HttpOnly access cookies."""
    sid=session_id or uuid.uuid4().hex;refresh=secrets.token_urlsafe(48)
    with connection() as c:c.execute('INSERT OR REPLACE INTO sessions VALUES(?,?,?,?,0)',(sid,user['id'],hashlib.sha256(refresh.encode()).hexdigest(),time.time()+7*86400))
    token=jwt.encode({'sub':user['id'],'sid':sid,'iat':int(time.time()),'exp':int(time.time())+900,'aud':'qura','iss':'qura-local'},secret(),algorithm='HS256')
    secure=os.getenv('QURA_COOKIE_SECURE','false').lower()=='true'
    response.set_cookie('qura_access',token,max_age=900,httponly=True,samesite='strict',secure=secure,path='/api')
    response.set_cookie('qura_refresh',sid+'.'+refresh,max_age=7*86400,httponly=True,samesite='strict',secure=secure,path='/api/auth')

class Register(BaseModel):
    """Self-registration excludes admin elevation and approval fields."""
    name: str = Field(min_length=2,max_length=80)
    email: str = Field(max_length=200)
    password: str = Field(min_length=12,max_length=128)
    role: str = 'patient'
    language_pref: str = 'en'

class Login(BaseModel):
    """Bounded authentication payload."""
    email: str = Field(max_length=200)
    password: str = Field(max_length=128)

@router.post('/register')
def register(payload: Register,request: Request) -> dict[str,Any]:
    """Patients activate immediately; doctors remain pending admin approval."""
    rate_limit('register:'+str(request.client.host if request.client else 'local'),5,300)
    if payload.role not in ['patient','doctor']:raise HTTPException(422,'Choose patient or doctor')
    return create_user(payload.name,payload.email,payload.password,payload.role,False,payload.language_pref)

@router.post('/login')
def login(payload: Login,request: Request,response: Response) -> dict[str,Any]:
    """Authenticate with generic failures and per-IP/email rate limiting."""
    bucket=hashlib.sha256((str(request.client.host if request.client else 'local')+payload.email.lower()).encode()).hexdigest()
    rate_limit('login:'+bucket,8,300)
    with connection() as c:row=c.execute('SELECT * FROM users WHERE email=?',(payload.email.strip().lower(),)).fetchone()
    try:valid=hasher.verify(row['password_hash'] if row else hasher.hash(secrets.token_urlsafe(20)),payload.password)
    except (VerifyMismatchError,VerificationError):valid=False
    if not valid or not row:raise HTTPException(401,'Email or password is incorrect')
    if not row['approved']:raise HTTPException(403,'Doctor registration is awaiting administrator approval')
    user=public_user(row);issue_session(response,user);audit(user['id'],'login','session');return user

@router.post('/refresh')
def refresh(request: Request,response: Response) -> dict[str,Any]:
    """Rotate a valid refresh token; old refresh tokens stop working."""
    value=request.cookies.get('qura_refresh','')
    if '.' not in value:raise HTTPException(401,'Sign in again')
    sid,token=value.split('.',1)
    with connection() as c:
        row=c.execute('SELECT u.*,s.refresh_hash FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.id=? AND s.revoked=0 AND s.expires_at>?',(sid,time.time())).fetchone()
        if not row or not row['approved'] or not secrets.compare_digest(row['refresh_hash'],hashlib.sha256(token.encode()).hexdigest()):raise HTTPException(401,'Sign in again')
    user=public_user(row);issue_session(response,user,sid);return user

@router.post('/logout')
def logout(request: Request,response: Response) -> dict[str,bool]:
    """Revoke the refresh-linked session even if the short access token expired."""
    value=request.cookies.get('qura_refresh','');sid=value.split('.')[0]
    with connection() as c:c.execute('UPDATE sessions SET revoked=1 WHERE id=?',(sid,))
    response.delete_cookie('qura_access',path='/api');response.delete_cookie('qura_refresh',path='/api/auth')
    return {'logged_out':True}

@router.get('/me')
def me(user: dict[str,Any] = Depends(current_user)) -> dict[str,Any]:
    """Return only the authenticated profile."""
    return user

class Preferences(BaseModel):
    """Language preference is validated against supported catalogs."""
    language_pref: str

@router.patch('/me')
def preferences(payload: Preferences,user: dict[str,Any] = Depends(current_user)) -> dict[str,Any]:
    """Persist UI language without editing role or approval."""
    if payload.language_pref not in ['en','ta','hi','te','ml','kn','es','fr','ar']:raise HTTPException(422,'Unsupported language')
    with connection() as c:c.execute('UPDATE users SET language_pref=? WHERE id=?',(payload.language_pref,user['id']))
    user['language_pref']=payload.language_pref;return user

initialize()
