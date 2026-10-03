"""Exact statevector simulator: angle encoding, ring entanglement, variational rotations."""
import numpy as np
from scipy.optimize import minimize
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.svm import SVC

def statevector(x, weights=None, depth=1):
    n = len(x)
    state = np.zeros(2 ** n, dtype=complex)
    state[0] = 1
    def ry(angle, wire):
        nonlocal state
        c, s = np.cos(angle / 2), np.sin(angle / 2)
        for i in range(len(state)):
            if not (i >> wire) & 1:
                j = i | (1 << wire)
                a, b = state[i], state[j]
                state[i], state[j] = c*a-s*b, s*a+c*b
    for wire, angle in enumerate(x):
        ry(angle, wire)
    for layer in range(depth):
        if weights is not None:
            for wire in range(n):
                ry(weights[layer*n+wire], wire)
        if n > 1:
            for control in range(n):
                target = (control+1) % n
                for i in range(len(state)):
                    if ((i >> control) & 1) and not ((i >> target) & 1):
                        j = i | (1 << target)
                        state[i], state[j] = state[j], state[i]
    return state

class QuantumKernel(ClassifierMixin, BaseEstimator):
    def __init__(self, depth=2, seed=42):
        self.depth, self.seed = depth, seed
    def fit(self, X, y):
        self.states_ = np.array([statevector(x, depth=self.depth) for x in X])
        self.model_ = SVC(kernel='precomputed', probability=True, random_state=self.seed)
        self.model_.fit(abs(self.states_ @ self.states_.conj().T)**2, y)
        self.classes_ = self.model_.classes_
        return self
    def predict_proba(self, X):
        states = np.array([statevector(x, depth=self.depth) for x in X])
        return self.model_.predict_proba(abs(states @ self.states_.conj().T)**2)
    def predict(self, X):
        return np.argmax(self.predict_proba(X), axis=1)

class VQC(ClassifierMixin, BaseEstimator):
    def __init__(self, depth=2, iterations=20, seed=42):
        self.depth, self.iterations, self.seed = depth, iterations, seed
    def probabilities(self, X, weights):
        return np.clip(np.array([np.sum(abs(statevector(x, weights, self.depth)[1::2])**2) for x in X]), 1e-6, 1-1e-6)
    def fit(self, X, y):
        self.classes_ = np.array([0, 1])
        initial = np.random.default_rng(self.seed).normal(0, .3, X.shape[1]*self.depth)
        def loss(w):
            p = self.probabilities(X, w)
            return -np.mean(y*np.log(p)+(1-y)*np.log(1-p))
        result = minimize(loss, initial, method='COBYLA', options={'maxiter': self.iterations})
        self.weights_ = result.x
        self.loss_ = float(result.fun)
        return self
    def predict_proba(self, X):
        p = self.probabilities(X, self.weights_)
        return np.column_stack([1-p, p])
    def predict(self, X):
        return (self.predict_proba(X)[:, 1] >= .5).astype(int)
