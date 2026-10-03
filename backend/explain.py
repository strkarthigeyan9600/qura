"""Bounded row-specific attribution and strict number consistency for summaries."""
from __future__ import annotations
from typing import Any
import multiprocessing as mp
import queue
import re
import time
import joblib
import numpy as np
import pandas as pd
from backend.repository import get
from backend.settings import storage_dir

def numbers_consistent(text: str,facts: dict[str,Any]) -> bool:
    """Every numeric token in generated text must exist in the structured fact payload."""
    import json
    supplied=set(re.findall(r'(?<![A-Za-z])[-+]?\d+(?:\.\d+)?',json.dumps(facts,ensure_ascii=False)))
    generated=set(re.findall(r'(?<![A-Za-z])[-+]?\d+(?:\.\d+)?',text))
    return generated.issubset(supplied)

def explain_direct(path: str,background: list[dict[str,Any]],sample: dict[str,Any]) -> dict[str,Any]:
    """Explain the actual calibrated pipeline; optional tree diagnostics stay separate."""
    import shap
    columns=list(sample)
    bg=pd.DataFrame(background)[columns]
    fitted=joblib.load(path)
    def probability(values: np.ndarray) -> np.ndarray:
        return fitted.predict_proba(pd.DataFrame(values,columns=columns))[:,1]
    explainer=shap.KernelExplainer(probability,bg.to_numpy())
    values=np.asarray(explainer.shap_values(pd.DataFrame([sample])[columns].to_numpy(),nsamples=min(64,2*len(columns)+16),silent=True)).reshape(-1)
    base=float(np.asarray(explainer.expected_value).reshape(-1)[0])
    prediction=float(probability(pd.DataFrame([sample]).to_numpy())[0])
    result={'method':'Kernel SHAP on calibrated positive probability','features':sorted([{'feature':f,'value':float(v)} for f,v in zip(columns,values)],key=lambda x:abs(x['value']),reverse=True),'base_value':base,'probability':prediction,'additivity_error':float(abs(base+values.sum()-prediction)),'local':True}
    # Tree SHAP belongs to the uncalibrated component, not the calibrated report number.
    try:
        pipeline=fitted.calibrated_classifiers_[0].estimator.estimator
        model=pipeline.named_steps['model']
        if model.__class__.__name__ in ['RandomForestClassifier','HistGradientBoostingClassifier']:
            transform=pipeline[:-1];data=transform.transform(bg);row=transform.transform(pd.DataFrame([sample])[columns])
            tree=shap.TreeExplainer(model,data)
            diagnostic=np.asarray(tree.shap_values(row))
            result['tree_diagnostic']={'method':'Tree SHAP on uncalibrated transformed features','values':diagnostic.tolist(),'note':'Component-level diagnostic, not the calibrated probability explanation.'}
    except Exception:pass
    return result

def _worker(path: str,background: list[dict[str,Any]],sample: dict[str,Any],output: Any) -> None:
    """Worker isolates SHAP import/runtime; errors contain no submitted values."""
    try:output.put(explain_direct(path,background,sample))
    except Exception:output.put(None)

def explain_row(model_id: str,sample: dict[str,Any],budget: float = 8.) -> dict[str,Any]:
    """Terminate at a wall-clock budget; accurately label the global fallback."""
    model=get(model_id,'model')
    context=mp.get_context('spawn');output=context.Queue()
    worker=context.Process(target=_worker,args=(str(storage_dir()/f'{model_id}.joblib'),model.get('background',[]),sample,output),daemon=True)
    worker.start();worker.join(budget)
    if worker.is_alive():worker.terminate();worker.join()
    try:result=output.get(timeout=.2)
    except queue.Empty:result=None
    finally:output.close()
    if result:return result
    return {'method':'Global permutation importance fallback (SHAP timed out or unavailable)','features':model['importance'][:8],'local':False,'base_value':None,'probability':None,'additivity_error':None,'note':'These values explain overall held-out model behavior, not this specific sample.'}

def fact_payload(report: dict[str,Any]) -> dict[str,Any]:
    """Constrain generated narratives to explicitly rounded facts, no identities."""
    return {'classical_probability_percent':round(report['classical']['probability']*100,1),'quantum_probability_percent':round(report['quantum']['probability']*100,1),'needs_review':report['status']=='needs_review','research_only':True,'measurements':{k:v for k,v in report['sample'].items() if isinstance(v,(int,float))},'top_features':[f['feature'] for f in report.get('explanation',{}).get('features',[])[:3]]}

def patient_summary(report: dict[str,Any],language: str = 'en') -> dict[str,Any]:
    """Safe deterministic summary, replaced only by validated provider text later."""
    local=report.get('explanation',{}).get('local',False)
    from backend.i18n import message
    return {'summary':message('review' if report['status']=='needs_review' else 'ready',language),'next_step':message('next',language),'top_features':[{'feature':f['feature'],'description':message('localFeature' if local else 'globalFeature',language)} for f in report.get('explanation',{}).get('features',[])[:3]],'language':language,'source':'validated local template','explanation_scope':'row-specific' if local else 'global fallback'}
