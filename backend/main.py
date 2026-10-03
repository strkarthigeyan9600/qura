import io
import json
import logging
import sqlite3
import time
import uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder, MinMaxScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix, roc_curve
from sklearn.inspection import permutation_importance
from backend.quantum import QuantumKernel, VQC

from backend.settings import storage_dir
ROOT = storage_dir()
ROOT.mkdir(exist_ok=True)
def db():
    connection = sqlite3.connect(ROOT / 'research.db')
    connection.execute('CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, kind TEXT, body TEXT)')
    return connection
def save(kind, record):
    with db() as c:
        c.execute('INSERT OR REPLACE INTO records VALUES (?, ?, ?)', (record['id'], kind, json.dumps(record)))
    return record
def get(id, kind):
    with db() as c:
        row = c.execute('SELECT body FROM records WHERE id=? AND kind=?', (id, kind)).fetchone()
    if not row:
        raise HTTPException(404, 'Record not found')
    return json.loads(row[0])
def listing(kind):
    with db() as c:
        return [json.loads(r[0]) for r in c.execute('SELECT body FROM records WHERE kind=? ORDER BY rowid DESC', (kind,))]

from backend.auth import router as auth_router, current_user, roles, audit
from backend.clinical import router as clinical_router
from backend.settings import allowed_origins
app = FastAPI(title='Qura Research API', version='2.0.0')
app.add_middleware(CORSMiddleware,allow_origins=allowed_origins(),allow_credentials=True,allow_methods=['GET','POST','PATCH','PUT','DELETE'],allow_headers=['Content-Type','Authorization'])
app.include_router(auth_router)
app.include_router(clinical_router)
from backend.reports import router as reports_router
app.include_router(reports_router)
from backend.whatif import router as whatif_router
from backend.pdf_export import router as pdf_router
app.include_router(whatif_router)
app.include_router(pdf_router)

@app.middleware('http')
async def boundaries(request: Request, call_next):
    """Enforce sessions, research roles, origin checks and security headers."""
    path=request.url.path
    try:
        if request.method not in ['GET','HEAD','OPTIONS']:
            origin=request.headers.get('origin')
            if origin and origin not in allowed_origins():raise HTTPException(403,'Origin is not allowed')
        public=['/api/health','/api/auth/register','/api/auth/login','/api/auth/refresh','/api/auth/logout']
        if path.startswith('/api/') and path not in public and request.method!='OPTIONS':
            user=current_user(request)
            if any(path.startswith(prefix) for prefix in ['/api/datasets','/api/models','/api/experiments','/api/preprocess']) and user['role'] not in ['doctor','admin']:
                raise HTTPException(403,'Research tools are limited to doctors and admins')
        response=await call_next(request)
    except HTTPException as error:
        response=JSONResponse(status_code=error.status_code,content={'detail':error.detail},headers=error.headers)
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['X-Frame-Options']='DENY'
    response.headers['Referrer-Policy']='same-origin'
    response.headers['Cache-Control']='no-store' if path.startswith('/api/') else 'no-cache'
    return response


def visible(record,user):
    """Public benchmarks and legacy models are shared; uploaded records have owners."""
    return not record.get('owner_id') or record.get('owner_id')==user['id'] or user['role']=='admin'

def owned(identifier,kind,user):
    """Hide non-owned research records behind a 404."""
    record=get(identifier,kind)
    if not visible(record,user):raise HTTPException(404,'Record not found')
    return record

pool = ThreadPoolExecutor(max_workers=1)

def register(frame, name, target, id=None):
    if target not in frame.columns or frame[target].isna().any():
        raise HTTPException(422, 'Choose a target column with no missing labels')
    if frame.columns.duplicated().any() or len(frame) < 30 or len(frame) > 10000 or len(frame.columns) > 200:
        raise HTTPException(422, 'Use 30–10,000 rows and at most 200 uniquely named columns')
    classes = sorted(frame[target].unique().tolist(), key=str)
    if len(classes) != 2 or frame[target].value_counts().min() < 5:
        raise HTTPException(422, 'Binary classification requires two classes with at least five samples each')
    if len(frame.columns) < 2:
        raise HTTPException(422, 'At least one feature is required')
    id = id or uuid.uuid4().hex
    frame.to_csv(ROOT / f'{id}.csv', index=False)
    features = [str(c) for c in frame.columns if c != target]
    return save('dataset', dict(id=id, name=name, target=target, samples=len(frame), features=features, classes=[str(c) for c in classes], distribution={str(k):int(v) for k,v in frame[target].value_counts().items()}, missing=int(frame.isna().sum().sum()), duplicates=int(frame.duplicated().sum()), numeric=frame[features].select_dtypes(include='number').columns.tolist(), preview=json.loads(frame.head(6).to_json(orient='records'))))

if not listing('dataset'):
    benchmark = load_breast_cancer(as_frame=True)
    frame = benchmark.data.copy()
    frame['diagnosis'] = pd.Series(benchmark.target).map({0:'malignant', 1:'benign'})
    # Sorted labels mean malignant is the positive class.
    register(frame, 'Wisconsin Breast Cancer', 'diagnosis', 'wisconsin')

for identifier, title in [('heart','UCI Cleveland Heart Disease'),('parkinsons','UCI Parkinsons Voice')]:
    if identifier not in {d['id'] for d in listing('dataset')}:
        register(pd.read_csv(Path(__file__).parent/'bundled'/f'{identifier}.csv'),title,'target',identifier)

@app.get('/api/health')
def health():
    return {'status':'ready', 'backend':'exact statevector simulator', 'research_only':True}
@app.get('/api/datasets')
def datasets(user=Depends(current_user)): return [r for r in listing('dataset') if visible(r,user)]
@app.get('/api/datasets/{id}')
def dataset(id: str,user=Depends(current_user)): return owned(id,'dataset',user)
@app.post('/api/datasets/upload')
async def upload(file: UploadFile = File(...), target: str = Form(...),user=Depends(current_user)):
    if not file.filename or not file.filename.lower().endswith('.csv'):
        raise HTTPException(422, 'Upload a CSV file')
    data = await file.read(10*1024*1024+1)
    if len(data) > 10*1024*1024: raise HTTPException(413, 'Maximum upload size is 10 MB')
    try: frame = pd.read_csv(io.BytesIO(data))
    except Exception: raise HTTPException(422, 'Cannot read CSV')
    record=register(frame,Path(file.filename).name,target)
    record['owner_id']=user['id']
    audit(user['id'],'upload','dataset:'+record['id'])
    return save('dataset',record)

class Config(BaseModel):
    dataset_id: str
    models: list[str] = Field(default_factory=lambda:['Logistic regression','Random forest'])
    seed: int = 42
    test_size: float = Field(.25, ge=.15, le=.4)
    qubits: int = Field(4, ge=2, le=6)
    depth: int = Field(2, ge=1, le=4)
    iterations: int = Field(120, ge=10, le=500)
    cv_folds: int = Field(5, ge=2, le=5)
    cv_repeats: int = Field(2, ge=1, le=5)
    calibration: str = 'sigmoid'
    equal_budget: bool = True
    row_budget: int = Field(160, ge=30, le=300)
    vqc_seeds: int = Field(3, ge=1, le=5)
    balance: bool = True
    selection: str = 'pca'

MODELS = ['Logistic regression','Support vector machine','Random forest','Gradient boosting','Quantum kernel','Variational quantum classifier']

def preprocessing(frame):
    numeric = frame.select_dtypes(include='number').columns.tolist()
    categorical = [c for c in frame.columns if c not in numeric]
    return ColumnTransformer([('numeric', Pipeline([('impute',SimpleImputer(strategy='median', keep_empty_features=True)),('scale',StandardScaler())]), numeric), ('categorical',Pipeline([('impute',SimpleImputer(strategy='most_frequent', keep_empty_features=True)),('encode',OneHotEncoder(handle_unknown='ignore',sparse_output=False))]),categorical)])

def train(config, experiment):
    """Train calibrated models using development CV and an untouched final partition."""
    from backend.evaluation import evaluate_model
    try:
        info = get(config.dataset_id, 'dataset')
        frame = pd.read_csv(ROOT / f'{info["id"]}.csv').drop_duplicates()
        X = frame.drop(columns=info['target'])
        y = frame[info['target']].astype(str).map({v:i for i,v in enumerate(info['classes'])}).to_numpy()
        for name in config.models:
            result=evaluate_model(name,X,y,config.model_dump(),ROOT)
            result.update(dataset_id=info['id'],experiment_id=experiment['id'],positive_class=info['classes'][1],config=config.model_dump(),owner_id=experiment.get('owner_id'),created_at=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()))
            save('model',result)
            experiment['completed']+=1
            save('experiment',experiment)
        experiment['status']='completed'
    except Exception:
        logging.exception('Training failed')
        experiment.update(status='failed',error='Training failed. Check sample counts, fold configuration and server logs.')
    save('experiment',experiment)

@app.post('/api/models/train')
def start(config: Config,user=Depends(current_user)):
    owned(config.dataset_id,'dataset',user)
    if not config.models or any(m not in MODELS for m in config.models) or len(config.models)>6:
        raise HTTPException(422,'Select between one and six supported models')
    if config.calibration not in ['sigmoid','isotonic']: raise HTTPException(422,'Use sigmoid or isotonic calibration')
    if config.selection not in ['pca','select']: raise HTTPException(422,'Select pca or select')
    if any(e['status']=='running' for e in listing('experiment')): raise HTTPException(409,'A training run is already active')
    experiment = save('experiment',dict(id=uuid.uuid4().hex,owner_id=user['id'],status='running',completed=0,total=len(config.models),config=config.model_dump(),created_at=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())))
    pool.submit(train,config,experiment)
    return experiment
@app.get('/api/models')
def models(user=Depends(current_user)): return [r for r in listing('model') if visible(r,user)]
@app.get('/api/models/{id}/metrics')
def metrics(id: str,user=Depends(current_user)): return owned(id,'model',user)
@app.get('/api/models/{id}/explain')
def explain(id: str,user=Depends(current_user)): return {'method':'Held-out permutation importance; accuracy decrease','features':owned(id,'model',user)['importance']}
@app.get('/api/experiments')
def experiments(user=Depends(current_user)): return [r for r in listing('experiment') if visible(r,user)]
@app.get('/api/experiments/{id}')
def experiment(id: str,user=Depends(current_user)): return owned(id,'experiment',user)

class Prediction(BaseModel):
    model_id: str
    samples: list[dict] = Field(min_length=1,max_length=100)
@app.post('/api/models/predict')
def predict(request: Prediction,user=Depends(current_user)):
    model = owned(request.model_id,'model',user)
    info = get(model['dataset_id'],'dataset')
    frame = pd.DataFrame(request.samples)
    if set(frame.columns)!=set(info['features']): raise HTTPException(422,'Sample columns must exactly match dataset features')
    try:
        pipeline = joblib.load(ROOT / f'{model["id"]}.joblib')
        probabilities = pipeline.predict_proba(frame)[:,1]
    except Exception: raise HTTPException(422,'Invalid sample values')
    return {'positive_class':model['positive_class'],'predictions':[{'class':info['classes'][int(p>=.5)],'probability':float(p)} for p in probabilities], 'explanation':model['importance'][:5], 'note':'Probability is a model estimate, not calibrated clinical confidence.'}

@app.post('/api/preprocess')
def preview_preprocessing(config: Config,user=Depends(current_user)):
    info=owned(config.dataset_id,'dataset',user)
    return {'dataset_id':info['id'],'strategy':'Training-only median/mode imputation, standard scaling, categorical one-hot encoding','selection':config.selection,'components':config.qubits,'test_size':config.test_size,'seed':config.seed,'missing':info['missing'],'duplicates':info['duplicates']}

# Recover interrupted jobs after a process restart.
for record in listing('experiment'):
    if record['status']=='running':
        record.update(status='failed',error='Server restarted during training. Start a new experiment.')
        save('experiment',record)

frontend = Path(__file__).parent.parent / 'dist'
if frontend.exists():
    app.mount('/', StaticFiles(directory=frontend, html=True), name='frontend')
