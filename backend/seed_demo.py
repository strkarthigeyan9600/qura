"""Idempotent synthetic demo accounts; public benchmark training is opt-in."""
from __future__ import annotations
import argparse
import asyncio
import os
import time
import uuid
from typing import Any
import numpy as np
import pandas as pd
from backend.main import Config, MODELS, train
from backend.auth import create_user, connection, public_user, audit
from backend.repository import save, listing
from backend.settings import storage_dir


def seed_accounts() -> dict[str, dict[str, Any]]:
    """Create six fictional profiles without printing or embedding passwords."""
    password=os.getenv('QURA_DEMO_PASSWORD')
    if not password:
        raise RuntimeError('Set QURA_DEMO_PASSWORD in .env before seeding')
    users={}
    profiles=[('admin','Demo Administrator','admin@qura.demo'),
              ('doctor','Demo Doctor One','doctor1@qura.demo'),
              ('doctor','Demo Doctor Two','doctor2@qura.demo'),
              ('patient','Synthetic Participant One','patient1@qura.demo'),
              ('patient','Synthetic Participant Two','patient2@qura.demo'),
              ('patient','Synthetic Participant Three','patient3@qura.demo')]
    for role,name,email in profiles:
        with connection() as c: row=c.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
        users[email]=public_user(row) if row else create_user(name,email,password,role,True)
    with connection() as c:
        for doctor,patient in [('doctor1','patient1'),('doctor1','patient2'),('doctor2','patient3')]:
            c.execute('INSERT OR IGNORE INTO assignments VALUES(?,?)',(users[doctor+'@qura.demo']['id'],users[patient+'@qura.demo']['id']))
        for name in ['patient1','patient2','patient3']:
            # This consent applies only to explicitly fictional demo participants.
            c.execute('INSERT OR REPLACE INTO consents VALUES(?,1,?)',(users[name+'@qura.demo']['id'],time.time()))
    audit(users['admin@qura.demo']['id'],'seed_synthetic_demo','six-fictional-profiles')
    return users


def train_demo(quick: bool = False) -> None:
    """Train a matched public-data experiment, preserving honest run configuration."""
    config=Config(dataset_id='heart',models=MODELS if not quick else [MODELS[0],MODELS[4]],
                  qubits=2,depth=2,cv_folds=2 if quick else 5,cv_repeats=1 if quick else 2,
                  iterations=20 if quick else 120,vqc_seeds=1 if quick else 3)
    experiment={'id':uuid.uuid4().hex,'dataset_id':'heart','models':config.models,'status':'running',
                'completed':0,'total':len(config.models),'created_at':time.time(),'config':config.model_dump(),'owner_id':None}
    save('experiment',experiment)
    train(config,experiment)
    if experiment['status']!='completed':raise RuntimeError('Demo training failed; inspect experiment records')
    print('Public benchmark experiment completed:',experiment['id'])


async def seed_reports(users: dict[str,dict[str,Any]]) -> None:
    """Generate random schema-compatible fictional measurements, never copied patient rows."""
    from backend.reports import Measurements,submit
    frame=pd.read_csv(storage_dir()/'heart.csv').drop(columns='target')
    rng=np.random.default_rng(907)
    for name in ['patient1','patient2','patient3']:
        user=users[name+'@qura.demo']
        if any(r['patient_id']==user['id'] for r in listing('report')):continue
        sample={}
        for column in frame:
            values=frame[column].dropna().unique()
            sample[column]=float(rng.choice(values)) if len(values)<10 else round(float(rng.uniform(frame[column].min(),frame[column].max())),2)
        result=await submit(Measurements(dataset_id='heart',sample=sample),user)
        print('Synthetic report created:',result['id'])


def main() -> None:
    """CLI: account setup, optional repeated-CV training and optional synthetic reports."""
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--train',action='store_true')
    parser.add_argument('--reports',action='store_true')
    parser.add_argument('--quick',action='store_true',help='Two-fold smoke configuration; not the published demo results')
    args=parser.parse_args()
    users=seed_accounts()
    if args.train:train_demo(args.quick)
    if args.reports:asyncio.run(seed_reports(users))
    print('Six fictional accounts ready; password comes from QURA_DEMO_PASSWORD in your private .env.')


if __name__=='__main__':main()
