"""Leakage-aware calibrated evaluation with a separate final test partition."""
from __future__ import annotations
from typing import Any
import time
import json
import uuid
import joblib
import numpy as np
import pandas as pd
from scipy.stats import t
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.frozen import FrozenEstimator
from sklearn.model_selection import train_test_split, RepeatedStratifiedKFold
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, MinMaxScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix, roc_curve, brier_score_loss
from backend.quantum import QuantumKernel, SeededVQC

NAMES = ['Logistic regression', 'Support vector machine', 'Random forest', 'Gradient boosting', 'Quantum kernel', 'Variational quantum classifier']

def prepare(frame: pd.DataFrame) -> ColumnTransformer:
    """Build unfitted transforms; all learning happens inside a training partition."""
    numeric = frame.select_dtypes(include='number').columns.tolist()
    other = [c for c in frame if c not in numeric]
    return ColumnTransformer([
        ('numeric', Pipeline([('impute', SimpleImputer(strategy='median', keep_empty_features=True)), ('scale', StandardScaler())]), numeric),
        ('categorical', Pipeline([('impute', SimpleImputer(strategy='most_frequent', keep_empty_features=True)), ('encode', OneHotEncoder(handle_unknown='ignore', sparse_output=False))]), other),
    ])

def build_pipeline(name: str, X: pd.DataFrame, cfg: dict[str, Any], seed: int) -> Pipeline:
    """Construct comparable classical/quantum estimators without fitting."""
    weight = 'balanced' if cfg['balance'] else None
    estimators = {
        NAMES[0]: lambda: LogisticRegression(max_iter=1000, class_weight=weight, random_state=seed),
        NAMES[1]: lambda: SVC(probability=True, class_weight=weight, random_state=seed),
        NAMES[2]: lambda: RandomForestClassifier(n_estimators=120, class_weight=weight, random_state=seed, n_jobs=1),
        NAMES[3]: lambda: HistGradientBoostingClassifier(random_state=seed),
        NAMES[4]: lambda: QuantumKernel(depth=cfg['depth'], seed=seed),
        NAMES[5]: lambda: SeededVQC(depth=cfg['depth'], iterations=cfg['iterations'], seed=seed, seeds=cfg['vqc_seeds']),
    }
    steps: list[tuple[str, Any]] = [('preprocess', prepare(X))]
    if name in NAMES[-2:] or cfg['equal_budget']:
        k = min(cfg['qubits'], len(X.columns), len(X)-1)
        steps.append(('reduce', PCA(n_components=k, random_state=seed) if cfg['selection']=='pca' else SelectKBest(f_classif, k=k)))
        # Both branches receive the same features/scaling in equal-budget mode.
        steps.append(('angles', MinMaxScaler(feature_range=(-np.pi, np.pi), clip=True)))
    return Pipeline(steps + [('model', estimators[name]())])

def fit_calibrated(name: str, X: pd.DataFrame, y: np.ndarray, cfg: dict[str, Any], seed: int) -> tuple[Any, int, pd.DataFrame]:
    """Reserve calibration rows, fit the base only on proper training, then freeze it."""
    base_X, calibration_X, base_y, calibration_y = train_test_split(X, y, test_size=.25, stratify=y, random_state=seed)
    if (name in NAMES[-2:] or cfg['equal_budget']) and len(base_X)>cfg['row_budget']:
        base_X, _, base_y, _ = train_test_split(base_X, base_y, train_size=cfg['row_budget'], stratify=base_y, random_state=cfg['seed'])
    base = build_pipeline(name, base_X, cfg, cfg['seed'] if cfg['equal_budget'] else seed)
    base.fit(base_X, base_y)
    model = CalibratedClassifierCV(FrozenEstimator(base), method=cfg['calibration'])
    model.fit(calibration_X, calibration_y)
    return model, len(base_X), base_X.head(12)

def metrics(y: np.ndarray, probability: np.ndarray) -> dict[str, Any]:
    """Compute threshold and ranking metrics from real probabilities."""
    labels = (probability>=.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, labels, labels=[0,1]).ravel()
    fpr, tpr, _ = roc_curve(y, probability)
    observed, predicted = calibration_curve(y, probability, n_bins=8, strategy='uniform')
    return dict(accuracy=float(accuracy_score(y,labels)), precision=float(precision_score(y,labels,zero_division=0)), sensitivity=float(recall_score(y,labels,zero_division=0)), specificity=float(tn/(tn+fp)), f1=float(f1_score(y,labels,zero_division=0)), auc=float(roc_auc_score(y,probability)), pr_auc=float(average_precision_score(y,probability)), brier=float(brier_score_loss(y,probability)), confusion=[[int(tn),int(fp)],[int(fn),int(tp)]], roc={'fpr':fpr.tolist(),'tpr':tpr.tolist()}, reliability={'predicted':predicted.tolist(),'observed':observed.tolist()})

def summarize(values: list[float]) -> dict[str, Any]:
    """Descriptive fold mean/spread with an approximate, not independent-fold, CI."""
    array=np.array(values)
    mean=float(array.mean()); std=float(array.std(ddof=1)) if len(array)>1 else 0.
    margin=float(t.ppf(.975,len(array)-1)*std/np.sqrt(len(array))) if len(array)>1 else 0.
    return {'mean':mean,'std':std,'ci95':[max(0.,mean-margin),min(1.,mean+margin)],'n':len(values),'method':'Descriptive t interval; overlapping CV folds are correlated.'}

def evaluate_model(name: str, X: pd.DataFrame, y: np.ndarray, cfg: dict[str, Any], artifact_root: Any) -> dict[str, Any]:
    """Repeated CV on development only, then calibrate and test a final checkpoint."""
    development, final_X, dev_y, final_y = train_test_split(X,y,test_size=cfg['test_size'],stratify=y,random_state=cfg['seed'])
    proper, conformal_X, proper_y, conformal_y = train_test_split(development,dev_y,test_size=.2,stratify=dev_y,random_state=cfg['seed']+17)
    if np.bincount(proper_y).min()<cfg['cv_folds']*2:
        raise ValueError('Too few minority examples for the chosen folds and nested calibration splits')
    folds=RepeatedStratifiedKFold(n_splits=cfg['cv_folds'],n_repeats=cfg['cv_repeats'],random_state=cfg['seed'])
    cv_results=[]; started=time.perf_counter()
    for index,(training,validation) in enumerate(folds.split(proper,proper_y)):
        fitted,_,_=fit_calibrated(name,proper.iloc[training],proper_y[training],cfg,cfg['seed']+index)
        cv_results.append(metrics(proper_y[validation],fitted.predict_proba(proper.iloc[validation])[:,1]))
    fitted,count,background=fit_calibrated(name,proper,proper_y,cfg,cfg['seed'])
    seed_spread=None
    if name==NAMES[-1]:
        ensemble=fitted.calibrated_classifiers_[0].estimator.estimator.named_steps['model']
        losses=np.asarray(ensemble.losses_)
        seed_spread={'seeds':[cfg['seed']+i for i in range(cfg['vqc_seeds'])],
                     'training_losses':losses.tolist(),'loss_mean':float(losses.mean()),
                     'loss_std':float(losses.std()),'note':'Member training losses, not clinical performance intervals.'}
    duration=time.perf_counter()-started
    inference=time.perf_counter(); probability=fitted.predict_proba(final_X)[:,1]
    inference_ms=(time.perf_counter()-inference)*1000/len(final_X)
    conformal_prob=fitted.predict_proba(conformal_X)[:,1]
    scores=np.where(conformal_y==1,1-conformal_prob,conformal_prob)
    level=min(1.,np.ceil((len(scores)+1)*.9)/len(scores))
    quantile=float(np.quantile(scores,level,method='higher'))
    sample=final_X.head(32)
    importance=permutation_importance(fitted,sample,final_y[:len(sample)],n_repeats=2,random_state=cfg['seed'],scoring='accuracy').importances_mean
    identifier=uuid.uuid4().hex
    joblib.dump(fitted,artifact_root/f'{identifier}.joblib')
    summary={key:summarize([r[key] for r in cv_results]) for key in ['accuracy','sensitivity','specificity','auc']}
    return dict(id=identifier, name=name, **metrics(final_y,probability), cv=summary, cv_scores=[{k:r[k] for k in summary} for r in cv_results], training_time=round(duration,3), inference_ms=round(inference_ms,3), train_samples=count, test_samples=len(final_X), conformal={'alpha':.1,'quantile':quantile,'samples':len(scores),'method':'Split conformal label set; NOT a probability confidence interval'}, final_predictions={'probability':probability.tolist(),'labels':final_y.tolist()}, background=json.loads(background.to_json(orient='records')), ranges={c:{'min':float(X[c].min()),'max':float(X[c].max())} for c in X.select_dtypes(include='number')}, importance=sorted([{'feature':f,'value':float(v)} for f,v in zip(X.columns,importance)],key=lambda r:r['value'],reverse=True), calibration=cfg['calibration'], version='qura-2-zz-calibrated', seed_spread=seed_spread)
