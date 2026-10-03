"""Consent-gated synthetic/public measurement reports and assigned-doctor review."""
from __future__ import annotations
from typing import Any
import time
import uuid
import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from backend.auth import current_user, roles, can_access_patient, connection, audit, rate_limit
from backend.repository import get,save,listing
from backend.consensus import infer_pair,heldout_analysis,model_visible
from backend.settings import storage_dir

router=APIRouter(prefix='/api',tags=['Research reports'])
UNITS={'age':'years','resting_bp':'mmHg','cholesterol':'mg/dL','max_heart_rate':'beats/min','st_depression':'relative units'}

def dataset_visible(dataset: dict[str,Any],user: dict[str,Any]) -> bool:
    """Apply the same assigned-researcher ownership policy to guided schema access."""
    return model_visible(dataset,user)

@router.get('/clinical/datasets')
def schemas(user: dict[str,Any] = Depends(current_user)) -> list[dict[str,Any]]:
    """Expose schemas and public ranges, not training-row previews or patient data."""
    result=[]
    for dataset in listing('dataset'):
        if not dataset_visible(dataset,user):continue
        frame=pd.read_csv(storage_dir()/f'{dataset["id"]}.csv')
        result.append({'id':dataset['id'],'name':dataset['name'],'features':[{'name':f,'numeric':f in dataset['numeric'],'unit':UNITS.get(f,'dataset units'),'min':float(frame[f].min()) if f in dataset['numeric'] else None,'max':float(frame[f].max()) if f in dataset['numeric'] else None,'help':'Match the original dataset definition; demo values are synthetic.'} for f in dataset['features']]})
    return result

def checked_sample(dataset_id: str,sample: dict[str,Any],user: dict[str,Any]) -> tuple[dict[str,Any],list[str]]:
    """Reject incomplete or nonfinite input and report range excursions."""
    dataset=get(dataset_id,'dataset')
    if not dataset_visible(dataset,user):raise HTTPException(404,'Dataset not found')
    if set(sample)!=set(dataset['features']):raise HTTPException(422,'Submit exactly the selected dataset feature columns')
    warnings=[];frame=pd.read_csv(storage_dir()/f'{dataset_id}.csv')
    for feature in dataset['features']:
        if feature in dataset['numeric']:
            value=sample[feature]
            if not isinstance(value,(int,float)) or isinstance(value,bool) or not np.isfinite(value):raise HTTPException(422,'All numerical measurements must be finite numbers')
            if value<float(frame[feature].min()) or value>float(frame[feature].max()):warnings.append(feature+' is outside the observed training-dataset range.')
        elif not isinstance(sample[feature],str) or len(sample[feature])>100:raise HTTPException(422,'Categorical values must be strings of at most 100 characters')
    return dataset,warnings

class Measurements(BaseModel):
    """Bound sample size and optional assigned-patient target."""
    dataset_id: str
    sample: dict[str,Any]
    patient_id: str | None = None

def report_access(identifier: str,user: dict[str,Any]) -> dict[str,Any]:
    """Conceal other patients' reports from all unauthorized roles."""
    report=get(identifier,'report')
    if not can_access_patient(user,report['patient_id']):raise HTTPException(404,'Report not found')
    return report

@router.post('/reports')
async def submit(payload: Measurements,user: dict[str,Any] = Depends(current_user)) -> dict[str,Any]:
    """Create a consented, ownership-scoped dual-model report."""
    rate_limit('reports:'+user['id'],10,60)
    patient_id=payload.patient_id or user['id']
    if not can_access_patient(user,patient_id):raise HTTPException(403,'Patient assignment is required')
    with connection() as c:
        patient=c.execute("SELECT * FROM users WHERE id=? AND role='patient'",(patient_id,)).fetchone()
        consent=c.execute('SELECT granted FROM consents WHERE user_id=?',(patient_id,)).fetchone()
    if not patient:raise HTTPException(422,'Choose a patient profile')
    if not consent or not consent['granted']:raise HTTPException(403,'The participant must give research consent first')
    dataset,warnings=checked_sample(payload.dataset_id,payload.sample,user)
    inference=infer_pair(dataset['id'],payload.sample,user)
    identifier=uuid.uuid4().hex
    report={'id':identifier,'patient_id':patient_id,'dataset_id':dataset['id'],'dataset_name':dataset['name'],'sample':payload.sample,'created_at':time.time(),'status':'needs_review' if inference['consensus']['triage']!='routine' else 'submitted','warnings':warnings,'reviews':[],'language':patient['language_pref'],**inference}
    from backend.explain import explain_row,patient_summary
    report['explanation']=explain_row(report['classical']['model_id'],payload.sample)
    report['patient_view']={'summary':'Your doctor will review this result.' if report['status']=='needs_review' else 'This research result is ready to discuss with your doctor.','next_step':'Discuss this model estimate with your assigned doctor. It does not establish a diagnosis.','top_features':[]}
    report['patient_view']=patient_summary(report,patient['language_pref'])
    from backend.chatbot import provider_reply
    from backend.explain import fact_payload,numbers_consistent
    narrative=await provider_reply('Explain these research facts in simple language. Do not invent numbers or diagnose.',patient['language_pref'],{'role':'patient'},{'report':fact_payload(report)})
    if narrative and numbers_consistent(narrative,{'report':fact_payload(report)}):
        report['patient_view']['next_step']=narrative
        report['patient_view']['source']='Anthropic (validated structured facts)'
    save('report',report);audit(user['id'],'create_report','report:'+identifier)
    return audience_view(report,user)

def audience_view(report: dict[str,Any],user: dict[str,Any]) -> dict[str,Any]:
    """Patients receive plain language and model values without technical triage codes."""
    if user['role']!='patient':return report
    return {k:report[k] for k in ['id','patient_id','dataset_id','dataset_name','sample','created_at','status','warnings','patient_view','classical','quantum','reviews','language','explanation']}

@router.get('/reports')
def report_list(user: dict[str,Any] = Depends(current_user)) -> list[dict[str,Any]]:
    """Filter all records before serialization and prioritize high uncertainty for doctors."""
    rows=[r for r in listing('report') if can_access_patient(user,r['patient_id'])]
    if user['role']=='doctor':rows.sort(key=lambda r:({'high':0,'medium':1,'low':2}[r['consensus']['uncertainty_level']],-r['created_at']))
    audit(user['id'],'view','reports');return [audience_view(r,user) for r in rows]

@router.get('/reports/{identifier}')
def report_detail(identifier: str,user: dict[str,Any] = Depends(current_user)) -> dict[str,Any]:
    """Ownership-aware detail view with metadata audit."""
    report=report_access(identifier,user);audit(user['id'],'view','report:'+identifier);return audience_view(report,user)

class Review(BaseModel):
    """Doctor research review is recorded without silently altering model output."""
    action: str
    note: str = Field(min_length=1,max_length=2000)
    override_label: int | None = Field(None,ge=0,le=1)

@router.post('/reports/{identifier}/review')
def review(identifier: str,payload: Review,user: dict[str,Any] = Depends(roles('doctor','admin'))) -> dict[str,Any]:
    """Append approve, note or override events for assigned patients only."""
    if payload.action not in ['note','approve','override']:raise HTTPException(422,'Use note, approve or override')
    if payload.action=='override' and payload.override_label is None:raise HTTPException(422,'An override label is required')
    report=report_access(identifier,user)
    report['reviews'].append({'doctor_id':user['id'],'doctor_name':user['name'],'timestamp':time.time(),**payload.model_dump()})
    if payload.action!='note':report['status']='reviewed'
    from backend.explain import patient_summary
    report['patient_view']=patient_summary(report,report['language'])
    save('report',report);audit(user['id'],payload.action,'report:'+identifier);return report

@router.get('/consensus/lab/{dataset_id}')
def lab(dataset_id: str,user: dict[str,Any] = Depends(roles('doctor','admin'))) -> dict[str,Any]:
    """Research-only measured held-out disagreement analysis."""
    return heldout_analysis(dataset_id,user)
