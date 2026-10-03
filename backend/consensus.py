"""Calibrated dual-model consensus with split-conformal label sets, never diagnosis."""
from __future__ import annotations
from typing import Any
import numpy as np
import pandas as pd
import joblib
from fastapi import HTTPException
from backend.auth import connection
from backend.repository import listing
from backend.settings import storage_dir

def label_set(probability: float,quantile: float) -> list[int]:
    """Invert nonconformity scores; this is a class set, not a probability interval."""
    return [label for label,score in [(0,probability),(1,1-probability)] if score<=quantile]

def consensus(classical: float,quantum: float,classical_q: float,quantum_q: float) -> dict[str,Any]:
    """Combine disagreement, gap and conformal ambiguity into research review routing."""
    agree=(classical>=.5)==(quantum>=.5);gap=abs(classical-quantum)
    labels=sorted(set(label_set(classical,classical_q))|set(label_set(quantum,quantum_q)))
    reasons=[]
    if not agree:reasons.append('The classical and quantum models assign different labels.')
    if gap>.2:reasons.append('The model probabilities differ by more than 20 percentage points.')
    if len(labels)!=1:reasons.append('The split-conformal class set is ambiguous or empty.')
    uncertainty='high' if not agree or len(labels)!=1 else 'medium' if gap>.1 else 'low'
    triage='needs_doctor_review' if uncertainty=='high' else 'review_recommended' if uncertainty=='medium' else 'routine'
    return {'agreement':agree,'probability_gap':float(gap),'confidence_interval':None,'prediction_set':labels,'uncertainty_level':uncertainty,'triage':triage,'reasons':reasons or ['The models agree and the class set contains one label.'],'method':'Union of two 90% split-conformal label sets; not a probability confidence interval or clinical guarantee.'}

def model_visible(model: dict[str,Any],user: dict[str,Any]) -> bool:
    """Patient inference can only use shared or assigned-doctor model artifacts."""
    owner=model.get('owner_id')
    if not owner or owner==user['id'] or user['role']=='admin':return True
    if user['role']=='patient':
        with connection() as c:return bool(c.execute('SELECT 1 FROM assignments WHERE patient_id=? AND doctor_id=?',(user['id'],owner)).fetchone())
    return False

def choose_pair(dataset_id: str,user: dict[str,Any]) -> tuple[dict[str,Any],dict[str,Any]]:
    """Choose by development CV only; preserve same-experiment holdout correspondence."""
    candidates=[m for m in listing('model') if m['dataset_id']==dataset_id and m.get('version')=='qura-2-zz-calibrated' and model_visible(m,user)]
    pairs=[]
    for quantum in candidates:
        if quantum['name']!='Quantum kernel':continue
        classical=[m for m in candidates if m['experiment_id']==quantum['experiment_id'] and m['name'] not in ['Quantum kernel','Variational quantum classifier']]
        if classical:
            best=max(classical,key=lambda m:m['cv']['auc']['mean'])
            pairs.append((best,quantum))
    if not pairs:raise HTTPException(409,'An assigned research doctor must train a calibrated classical and quantum-kernel pair for this dataset first')
    return max(pairs,key=lambda pair:(pair[0]['cv']['auc']['mean']+pair[1]['cv']['auc']['mean'])/2)

def infer_pair(dataset_id: str,sample: dict[str,Any],user: dict[str,Any]) -> dict[str,Any]:
    """Run saved trusted models and attach evidence/version metadata."""
    classical,quantum=choose_pair(dataset_id,user)
    probabilities=[]
    for model in [classical,quantum]:
        estimator=joblib.load(storage_dir()/f'{model["id"]}.joblib')
        probabilities.append(float(estimator.predict_proba(pd.DataFrame([sample]))[0,1]))
    result=consensus(*probabilities,classical['conformal']['quantile'],quantum['conformal']['quantile'])
    return {'classical':{'model_id':classical['id'],'name':classical['name'],'version':classical['version'],'probability':probabilities[0],'label':int(probabilities[0]>=.5)},'quantum':{'model_id':quantum['id'],'name':quantum['name'],'version':quantum['version'],'probability':probabilities[1],'label':int(probabilities[1]>=.5)},'consensus':result,'calibration_note':'Sigmoid/isotonic calibration used separate training-side rows. Calibration is not clinical validation.'}

def heldout_analysis(dataset_id: str,user: dict[str,Any]) -> dict[str,Any]:
    """Describe actual held-out agreement/errors without assuming useful correlation."""
    a,b=choose_pair(dataset_id,user)
    labels=np.array(a['final_predictions']['labels'])
    if not np.array_equal(labels,b['final_predictions']['labels']):raise HTTPException(409,'Holdout partitions do not correspond')
    ca=np.array(a['final_predictions']['probability'])>=.5;qb=np.array(b['final_predictions']['probability'])>=.5
    disagreement=ca!=qb;any_error=(ca!=labels)|(qb!=labels)
    error_agree=float(any_error[~disagreement].mean()) if (~disagreement).any() else None
    error_disagree=float(any_error[disagreement].mean()) if disagreement.any() else None
    correlation=float(np.corrcoef(disagreement.astype(float),any_error.astype(float))[0,1]) if disagreement.std()>0 and any_error.std()>0 else None
    return {'experiment_id':a['experiment_id'],'samples':len(labels),'agreement_rate':float((~disagreement).mean()),'disagreement_count':int(disagreement.sum()),'error_rate_when_agree':error_agree,'error_rate_when_disagree':error_disagree,'disagreement_error_correlation':correlation,'cases':[{'index':int(i),'actual':int(labels[i]),'classical':float(a['final_predictions']['probability'][i]),'quantum':float(b['final_predictions']['probability'][i]),'either_model_wrong':bool(any_error[i])} for i in np.flatnonzero(disagreement)],'note':'Exploratory held-out association only. A null correlation is returned when variance is zero; no clinical triage performance is implied.'}
