"""Nonprescriptive model-behavior exploration with consent and ownership checks."""
from __future__ import annotations
from typing import Any
import numpy as np
import pandas as pd
import joblib
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel,Field
from backend.auth import current_user,rate_limit,audit
from backend.reports import report_access,checked_sample
from backend.repository import get
from backend.settings import storage_dir

router=APIRouter(prefix='/api',tags=['What-if research'])

class WhatIf(BaseModel):
    """Explore at most 10 changed feature values in one owned report."""
    report_id: str
    changes: dict[str,float] = Field(default_factory=dict)

@router.post('/what-if')
def what_if(payload: WhatIf,user: dict[str,Any] = Depends(current_user)) -> dict[str,Any]:
    """Return changed probabilities without overwriting the original report."""
    rate_limit('whatif:'+user['id'],40,60)
    report=report_access(payload.report_id,user)
    if len(payload.changes)>10 or not set(payload.changes).issubset(report['sample']):raise HTTPException(422,'Change at most 10 known features')
    sample={**report['sample'],**payload.changes};_,warnings=checked_sample(report['dataset_id'],sample,user)
    values={}
    for branch in ['classical','quantum']:
        model_id=report[branch]['model_id']
        fitted=joblib.load(storage_dir()/f'{model_id}.joblib')
        values[branch]=float(fitted.predict_proba(pd.DataFrame([sample]))[0,1])
    audit(user['id'],'what_if','report:'+report['id'])
    return {'probabilities':values,'original':{b:report[b]['probability'] for b in values},'warnings':warnings,'note':'Model behavior only. These changes are not health targets or medical recommendations.'}

@router.post('/what-if/counterfactual')
def counterfactual(payload: WhatIf,user: dict[str,Any] = Depends(current_user)) -> dict[str,Any]:
    """Bounded single-feature grid search; do not claim a global minimum."""
    rate_limit('counterfactual:'+user['id'],5,60)
    report=report_access(payload.report_id,user);model=get(report['classical']['model_id'],'model')
    fitted=joblib.load(storage_dir()/f'{model["id"]}.joblib')
    candidates=[]
    original=report['classical']['probability']
    if original<.5:return {'candidates':[],'already_below_threshold':True,'note':'Original classical estimate is already below 0.5. No changes suggested.'}
    features=[f['feature'] for f in model['importance'][:5] if f['feature'] in model.get('ranges',{})]
    for feature in features:
        bounds=model['ranges'][feature];width=bounds['max']-bounds['min']
        if width<=0:continue
        grid=np.linspace(bounds['min'],bounds['max'],15)
        samples=[{**report['sample'],feature:float(v)} for v in grid]
        probabilities=fitted.predict_proba(pd.DataFrame(samples))[:,1]
        for value,probability in zip(grid,probabilities):
            if probability<.5:candidates.append({'feature':feature,'original':report['sample'][feature],'value':float(value),'probability':float(probability),'normalized_change':float(abs(value-report['sample'][feature])/width)})
    return {'candidates':sorted(candidates,key=lambda c:c['normalized_change'])[:3],'note':'Smallest normalized changes among the tested single-feature grid only. Features may not be modifiable; this is not an action plan, global counterfactual optimum or medical advice.'}
