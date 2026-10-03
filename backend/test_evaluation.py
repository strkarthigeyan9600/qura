"""Checks for leakage partitions, calibration summaries and the non-product kernel."""
import os
import numpy as np
from backend.quantum import statevector
from backend.evaluation import summarize
from backend.settings import storage_dir

def test_kernel_is_not_product_cosine():
    x=np.array([.4,1.1]);z=np.array([-.6,.8])
    overlap=abs(np.vdot(statevector(x,depth=2,feature_map=True),statevector(z,depth=2,feature_map=True)))**2
    trivial=np.prod(np.cos((x-z)/2)**2)
    assert not np.isclose(overlap,trivial)
    assert np.isclose(np.linalg.norm(statevector(x,depth=2,feature_map=True)),1)

def test_storage_is_isolated_and_cv_summary_is_bounded():
    assert str(storage_dir())==os.environ['QURA_STORAGE_DIR']
    summary=summarize([.8,.9,.85])
    assert .8<summary['mean']<.9
    assert 0<=summary['ci95'][0]<=summary['ci95'][1]<=1
