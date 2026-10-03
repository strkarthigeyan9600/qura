"""Explanation consistency, PDF output, consent and what-if transport."""
import numpy as np
import pandas as pd
import joblib
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth import create_user, connection
from backend.repository import listing,save
from backend.explain import numbers_consistent,explain_direct
from backend.settings import storage_dir
from backend.pdf_export import create_pdf

def test_generated_numbers_must_match_fact_payload():
    assert numbers_consistent('The model estimate is 12.3%.',{'probability':12.3})
    assert not numbers_consistent('The result is 98.7%.',{'probability':12.3})

def test_row_shap_additivity_and_shape(tmp_path):
    from sklearn.linear_model import LogisticRegression
    X=pd.DataFrame({'a':[0.,.2,.4,.6,.8,1.],'b':[1.,.8,.6,.4,.2,0.]})
    model=LogisticRegression().fit(X,[0,0,0,1,1,1])
    path=tmp_path/'model.joblib';joblib.dump(model,path)
    result=explain_direct(str(path),X.iloc[:3].to_dict('records'),X.iloc[4].to_dict())
    assert len(result['features'])==2
    assert result['local']
    assert result['additivity_error']<1e-5

def test_pdf_creation_and_patient_clinician_boundary():
    owner=create_user('PDF Owner','pdf-owner@test.local','TestingPass123!')
    report={'id':'pdf-report','patient_id':owner['id'],'dataset_id':'heart','dataset_name':'Synthetic demo','sample':{},'created_at':0,'status':'submitted','warnings':[],'reviews':[],'language':'en','patient_view':{'summary':'Research estimate only','next_step':'Discuss with your doctor','top_features':[]},'classical':{'name':'Classical','probability':.2,'model_id':'x'},'quantum':{'name':'Quantum','probability':.3,'model_id':'y'},'consensus':{}}
    save('report',report)
    assert create_pdf(report,'patient','en').startswith(b'%PDF')
    client=TestClient(app);client.post('/api/auth/login',json={'email':'pdf-owner@test.local','password':'TestingPass123!'})
    assert client.get('/api/reports/pdf-report/pdf?audience=doctor').status_code==403
    response=client.get('/api/reports/pdf-report/pdf')
    assert response.status_code==200 and response.content.startswith(b'%PDF')
    assert client.post('/api/what-if',json={'report_id':'pdf-report','changes':{'unknown':1}}).status_code==422
