"""Typed JSON-record persistence shared by research and clinical services."""
from __future__ import annotations
from typing import Any
import json
from fastapi import HTTPException
from backend.auth import connection

def save(kind: str,record: dict[str,Any]) -> dict[str,Any]:
    """Store application-owned metadata under a server-generated identifier."""
    with connection() as c:
        c.execute('CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,kind TEXT,body TEXT)')
        c.execute('INSERT OR REPLACE INTO records VALUES(?,?,?)',(record['id'],kind,json.dumps(record,allow_nan=False)))
    return record

def get(identifier: str,kind: str) -> dict[str,Any]:
    """Read one record without exposing cross-kind identifiers."""
    with connection() as c:row=c.execute('SELECT body FROM records WHERE id=? AND kind=?',(identifier,kind)).fetchone()
    if not row:raise HTTPException(404,'Record not found')
    return json.loads(row[0])

def listing(kind: str) -> list[dict[str,Any]]:
    """Return newest records first; callers must apply authorization filters."""
    with connection() as c:return [json.loads(r[0]) for r in c.execute('SELECT body FROM records WHERE kind=? ORDER BY rowid DESC',(kind,))]
