"""Explicit consensus cases and cross-patient report authorization."""
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth import create_user
from backend.consensus import consensus,label_set
from backend.repository import save

def test_agreement_and_disagreement():
    assert consensus(.1,.12,.2,.2)['triage']=='routine'
    result=consensus(.1,.8,.2,.2)
    assert not result['agreement']
    assert result['uncertainty_level']=='high'

def test_borderline_label_set_is_flagged_without_fake_probability_interval():
    result=consensus(.49,.51,.6,.6)
    assert result['prediction_set']==[0,1]
    assert result['confidence_interval'] is None
    assert label_set(.9,.15)==[1]

def test_report_owner_and_research_role_authorization():
    patient=create_user('Report owner','report-owner@test.local','TestingPass123!')
    other=create_user('Other owner','other-owner@test.local','TestingPass123!')
    save('report',{'id':'private-test-report','patient_id':other['id']})
    client=TestClient(app)
    assert client.post('/api/auth/login',json={'email':'report-owner@test.local','password':'TestingPass123!'}).status_code==200
    assert client.get('/api/reports/private-test-report').status_code==404
    assert client.get('/api/consensus/lab/wisconsin').status_code==403
    assert client.post('/api/reports',json={'dataset_id':'wisconsin','sample':{},'patient_id':other['id']}).status_code==403
