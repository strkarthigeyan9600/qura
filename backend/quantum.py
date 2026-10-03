"""Exact simulator with input-dependent ZZ feature maps and seeded VQC members."""
from __future__ import annotations
import numpy as np
from scipy.optimize import minimize
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.svm import SVC


def statevector(x: np.ndarray, weights: np.ndarray | None = None, depth: int = 1, feature_map: bool = False) -> np.ndarray:
    """Apply RY rotations, ZZ phases and/or variational CNOT layers to |0>."""
    n=len(x)
    state=np.zeros(2**n,dtype=complex);state[0]=1
    def ry(angle: float,wire: int) -> None:
        c,s=np.cos(angle/2),np.sin(angle/2)
        for i in range(len(state)):
            if not (i>>wire)&1:
                j=i|(1<<wire);a,b=state[i],state[j]
                state[i],state[j]=c*a-s*b,s*a+c*b
    for wire,angle in enumerate(x):ry(float(angle),wire)
    for layer in range(depth):
        if feature_map:
            for wire in range(n-1):
                angle=float(x[wire]*x[wire+1])
                for i in range(len(state)):
                    parity=1 if ((i>>wire)&1)==((i>>(wire+1))&1) else -1
                    state[i]*=np.exp(-.5j*angle*parity)
            if layer<depth-1:
                for wire,angle in enumerate(x):ry(float(angle),wire)
        else:
            if weights is not None:
                for wire in range(n):ry(float(weights[layer*n+wire]),wire)
            if n>1:
                for control in range(n):
                    target=(control+1)%n
                    for i in range(len(state)):
                        if ((i>>control)&1) and not ((i>>target)&1):
                            j=i|(1<<target);state[i],state[j]=state[j],state[i]
    return state


class QuantumKernel(ClassifierMixin,BaseEstimator):
    """SVM with exact squared-overlap input-dependent ZZ kernels."""
    def __init__(self,depth: int = 2,seed: int = 42):self.depth,self.seed=depth,seed
    def fit(self,X: np.ndarray,y: np.ndarray) -> QuantumKernel:
        self.states_=np.array([statevector(x,depth=max(2,self.depth),feature_map=True) for x in X])
        self.model_=SVC(kernel='precomputed',probability=True,random_state=self.seed)
        self.model_.fit(abs(self.states_@self.states_.conj().T)**2,y);self.classes_=self.model_.classes_
        return self
    def predict_proba(self,X: np.ndarray) -> np.ndarray:
        states=np.array([statevector(x,depth=max(2,self.depth),feature_map=True) for x in X])
        return self.model_.predict_proba(abs(states@self.states_.conj().T)**2)
    def predict(self,X: np.ndarray) -> np.ndarray:return np.argmax(self.predict_proba(X),axis=1)


class VQC(ClassifierMixin,BaseEstimator):
    """Variational rotations and entanglers optimized by binary cross-entropy."""
    def __init__(self,depth: int = 2,iterations: int = 120,seed: int = 42):self.depth,self.iterations,self.seed=depth,iterations,seed
    def probabilities(self,X: np.ndarray,weights: np.ndarray) -> np.ndarray:
        return np.clip([np.sum(abs(statevector(x,weights,self.depth)[1::2])**2) for x in X],1e-6,1-1e-6)
    def fit(self,X: np.ndarray,y: np.ndarray) -> VQC:
        self.classes_=np.array([0,1]);initial=np.random.default_rng(self.seed).normal(0,.3,X.shape[1]*self.depth)
        def loss(w: np.ndarray) -> float:
            p=self.probabilities(X,w);return float(-np.mean(y*np.log(p)+(1-y)*np.log(1-p)))
        result=minimize(loss,initial,method='COBYLA',options={'maxiter':self.iterations})
        self.weights_=result.x;self.loss_=float(result.fun);return self
    def predict_proba(self,X: np.ndarray) -> np.ndarray:
        p=self.probabilities(X,self.weights_);return np.column_stack([1-p,p])
    def predict(self,X: np.ndarray) -> np.ndarray:return (self.predict_proba(X)[:,1]>=.5).astype(int)


class SeededVQC(ClassifierMixin,BaseEstimator):
    """Average independent seeded VQCs and retain their optimization spread."""
    def __init__(self,depth: int = 2,iterations: int = 120,seed: int = 42,seeds: int = 3):self.depth,self.iterations,self.seed,self.seeds=depth,iterations,seed,seeds
    def fit(self,X: np.ndarray,y: np.ndarray) -> SeededVQC:
        self.members_=[VQC(self.depth,self.iterations,self.seed+i).fit(X,y) for i in range(self.seeds)]
        self.classes_=np.array([0,1]);self.losses_=[m.loss_ for m in self.members_];return self
    def predict_proba(self,X: np.ndarray) -> np.ndarray:return np.mean([m.predict_proba(X) for m in self.members_],axis=0)
    def predict(self,X: np.ndarray) -> np.ndarray:return np.argmax(self.predict_proba(X),axis=1)
