import time
import numpy as np
from fastapi.testclient import TestClient
from backend.main import app
from backend.quantum import statevector, QuantumKernel, VQC

client = TestClient(app)
from backend.auth import create_user
create_user('Test Doctor','doctor@test.local','TestingPass123!','doctor',True)
assert client.post('/api/auth/login',json={'email':'doctor@test.local','password':'TestingPass123!'}).status_code==200

def test_quantum_normalization_and_reproducibility():
    x = np.array([.2,.5,.7])
    assert np.isclose(np.linalg.norm(statevector(x, np.ones(6), 2)),1)
    X=np.array([[0,0],[.1,.2],[2,2],[2.1,2.2]])
    y=np.array([0,0,1,1])
    for classifier in [QuantumKernel(depth=1), VQC(depth=1,iterations=10)]:
        classifier.fit(X,y)
        probabilities=classifier.predict_proba(X)
        assert np.allclose(probabilities.sum(axis=1),1)
        assert np.all((probabilities>=0)&(probabilities<=1))
    a=VQC(depth=1,iterations=10).fit(X,y)
    b=VQC(depth=1,iterations=10).fit(X,y)
    assert np.allclose(a.weights_,b.weights_)

def test_end_to_end():
    assert client.get('/api/health').status_code==200
    dataset=client.get('/api/datasets/wisconsin').json()
    assert dataset['samples']==569
    assert client.post('/api/datasets/upload',files={'file':('bad.txt',b'bad')},data={'target':'y'}).status_code==422
    response=client.post('/api/models/train',json={'dataset_id':'wisconsin','models':['Logistic regression','Support vector machine','Random forest','Gradient boosting','Quantum kernel','Variational quantum classifier'],'qubits':2,'depth':1,'iterations':10,'cv_folds':2,'cv_repeats':1,'vqc_seeds':1,'row_budget':40})
    assert response.status_code==200, response.text
    id=response.json()['id']
    for _ in range(180):
        experiment=client.get(f'/api/experiments/{id}').json()
        if experiment['status']!='running': break
        time.sleep(1)
    assert experiment['status']=='completed',experiment
    models=[m for m in client.get('/api/models').json() if m['experiment_id']==id]
    assert len(models)==6
    sample={k:v for k,v in dataset['preview'][0].items() if k!=dataset['target']}
    for model in models:
        assert 0<=model['auc']<=1
        assert sum(sum(r) for r in model['confusion'])==model['test_samples']
        assert model['positive_class']=='malignant'
        result=client.post('/api/models/predict',json={'model_id':model['id'],'samples':[sample]})
        assert result.status_code==200,result.text
        assert 0<=result.json()['predictions'][0]['probability']<=1
    assert client.post('/api/models/predict',json={'model_id':models[0]['id'],'samples':[{'invalid':1}]}).status_code==422
