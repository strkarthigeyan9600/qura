"""Rebuild the project PDF from source scope and persisted repeated-CV evidence."""
from __future__ import annotations
import json
import sqlite3
import sys
from pathlib import Path
from typing import Any
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak,Flowable

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
INK=colors.HexColor('#122c3a');TEAL=colors.HexColor('#087f82');LIGHT=colors.HexColor('#edf7f5')


class AucChart(Flowable):
    """Measured development AUC bars and descriptive interval whiskers."""
    def __init__(self,models: list[dict[str,Any]]) -> None:
        super().__init__();self.models=models;self.width=490;self.height=220
    def draw(self) -> None:
        c=self.canv
        for i,m in enumerate(self.models):
            y=190-i*30;metric=m['cv']['auc'];x=165;scale=275
            c.setFillColor(INK);c.setFont('QuraReport',9)
            name={'Variational quantum classifier':'VQC','Support vector machine':'SVM'}.get(m['name'],m['name'])
            c.drawString(0,y,name);c.setFillColor(LIGHT);c.rect(x,y,scale,10,fill=1,stroke=0)
            c.setFillColor(TEAL);c.rect(x,y,scale*metric['mean'],10,fill=1,stroke=0)
            lo,hi=metric['ci95'];c.setStrokeColor(INK);c.line(x+lo*scale,y+5,x+hi*scale,y+5)
            for value in [lo,hi]:c.line(x+value*scale,y+1,x+value*scale,y+9)
            c.setFillColor(INK);c.drawRightString(490,y,f"{metric['mean']:.3f}")
        c.drawString(165,0,'CV mean ROC-AUC; whiskers: descriptive 95% interval')


def main() -> None:
    """Read public experiment evidence; never infer results from UI artwork."""
    with sqlite3.connect(f'file:{(ROOT/"backend/storage/research.db").as_posix()}?mode=ro',uri=True) as db:
        records={kind:[json.loads(r[0]) for r in db.execute('SELECT body FROM records WHERE kind=? ORDER BY rowid DESC',(kind,))] for kind in ['dataset','model','experiment']}
    experiment=next(e for e in records['experiment'] if e['status']=='completed' and e['completed']==6 and e.get('config',{}).get('cv_folds')==5)
    models=[m for m in records['model'] if m['experiment_id']==experiment['id']]
    order=['Logistic regression','Support vector machine','Random forest','Gradient boosting','Quantum kernel','Variational quantum classifier']
    models.sort(key=lambda m:order.index(m['name']))
    dataset=next(d for d in records['dataset'] if d['id']==experiment['config']['dataset_id'])
    font=Path('C:/Windows/Fonts/arial.ttf')
    if not font.exists():font=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
    pdfmetrics.registerFont(TTFont('QuraReport',str(font)))
    styles=getSampleStyleSheet()
    for name,size,leading,color in [('BodyQ',10,15,INK),('HeadingQ',24,30,INK),('SubQ',13,18,TEAL),('CellQ',8,11,INK),('SmallQ',8,12,INK)]:
        styles.add(ParagraphStyle(name=name,fontName='QuraReport',fontSize=size,leading=leading,spaceAfter=12,textColor=color))
    story=[]
    def p(text: str,style: str = 'BodyQ') -> None:story.append(Paragraph(escape(text),styles[style]))
    def table(headers: list[str],rows: list[list[Any]],widths: list[int] | None = None) -> None:
        cells=[[Paragraph(escape(str(v)),styles['CellQ']) for v in row] for row in [headers,*rows]]
        t=Table(cells,colWidths=widths or [490/len(headers)]*len(headers),repeatRows=1)
        t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#d4eeeb')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,LIGHT]),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,0),.5,TEAL)]))
        story.append(t);story.append(Spacer(1,12))
    def section(title: str) -> None:story.append(PageBreak());p(title,'HeadingQ')
    p('QURA / PROJECT REPORT / VERSION 2','SubQ');story.append(Spacer(1,32))
    p('Hybrid Quantum-Classical Research Platform','HeadingQ')
    p('Role-based portals, calibrated comparisons, explainable reports and multilingual assistance','SubQ')
    p('Updated 3 October 2026. Navy and teal design. Workspace: C:/Users/strka/Downloads/mlp.')
    table(['Evidence source','Scope'],[['Implementation','React/TypeScript + modular FastAPI services'],['Saved experiment',experiment['id']],['Public dataset',dataset['name']],['Method','5 folds repeated twice; separate final test'],['Use boundary','Research prototype; public/anonymized/synthetic data']],[150,340])
    p('No diagnosis, treatment benefit, clinical validity or quantum advantage is claimed. All numerical results below are read from the local database.','SmallQ')
    section('1. System difference and scope')
    p('The earlier shared dashboard offered single-holdout experiments. The upgraded system adds authenticated patient, doctor and administrator portals; ownership, assignments, consent, report review and content-free audit metadata. The navy and teal interface retains the research workflow while presenting participant results in plain language.')
    table(['Earlier system','Implemented upgrade'],[['Shared local dashboard','Revocable sessions, three roles and scoped data'],['Single held-out split','Repeated development CV plus separate final testing'],['Uncalibrated probabilities','Sigmoid/isotonic calibration, Brier score and reliability curve'],['Single-model reports','Classical/quantum consensus and conformal class sets'],['Global importance','Bounded calibrated SHAP with explicit global fallback'],['Research results only','Participant reports, doctor notes, what-if and PDF'],['English interface','Nine catalogs, core translations and Arabic RTL']],[175,315])
    p('Simulation remains classical. Hardware execution, prospective clinical validation and production governance are outside the verified scope. Specialized language copy retains English fallback and requires professional review.')
    section('2. Architecture and role permissions')
    p('React portal -> same-origin /api -> session/role middleware -> ownership-scoped services -> SQLite records, validated CSV datasets and trusted joblib checkpoints. Training uses a single worker; report explanation uses a bounded separate process.')
    table(['Role','Allowed workflow'],[['Patient','Own profile, consent, measurements, reports/PDF, what-if and own chat history'],['Doctor','Assigned participants/reports; notes, approvals and explicit overrides; owned experiments and consensus lab'],['Administrator','Approve doctors, assign participants, inspect audit and research records']],[100,390])
    p('Argon2 hashes protect passwords. HttpOnly SameSite access cookies last 15 minutes; refresh cookies rotate and expire after seven days. Persisted sessions permit logout revocation. JavaScript does not read credentials.')
    p('Modules: auth.py, clinical.py, evaluation.py, quantum.py, consensus.py, reports.py, explain.py, whatif.py, chatbot.py, pdf_export.py, repository.py and i18n/. The legacy campus source remains preserved.')
    section('3. Datasets and evaluation design')
    table(['Public benchmark','Rows','Features','Caution'],[[d['name'],d['samples'],len(d['features']),'Repeated subject recordings: grouped validation required' if d['id']=='parkinsons' else 'Benchmark evidence only'] for d in records['dataset'] if d['id'] in ['wisconsin','heart','parkinsons']],[175,45,55,215])
    p('Uploads are bounded binary-label CSVs. Target mapping is stored explicitly. Exact duplicate rows are removed before splitting. Imputation, standardization, categorical encoding, feature reduction and angle scaling fit inside proper training partitions.')
    p('The complete demo uses Cleveland Heart, seed 42, 25% final holdout, two PCA components, equal row/feature budgets, sigmoid calibration, 5 folds repeated twice and three VQC seeds with 120 optimizer evaluations each.')
    p('Development is separated from conformal calibration. Within each fold, separate training-side rows fit probability calibration. Model-pair selection uses development CV AUC. The final test is reserved for evaluation.')
    p('CV intervals are descriptive t intervals over correlated folds, not independent-sample guarantees. Conformal outputs are label sets, not probability confidence intervals. Independent and grouped validation remains necessary.')
    section('4. Measured repeated-CV results')
    p('Ten development folds. Each cell shows mean ± standard deviation and descriptive 95% interval. Values are proportions.','SmallQ')
    rows=[]
    for m in models:
        def fmt(key: str) -> str:
            s=m['cv'][key];return f"{s['mean']:.3f} ± {s['std']:.3f} [{s['ci95'][0]:.3f}, {s['ci95'][1]:.3f}]"
        rows.append([m['name'],fmt('accuracy'),fmt('sensitivity'),fmt('specificity'),fmt('auc')])
    table(['Model','Accuracy','Sensitivity','Specificity','ROC-AUC'],rows,[130,90,90,90,90])
    story.append(AucChart(models))
    p('The quantum kernel does not outperform classical models in this run. These observed scores are not evidence of clinical validity or a general quantum advantage.','SmallQ')
    section('5. Final test, consensus and seed spread')
    table(['Model','Accuracy','ROC-AUC','Brier','Base / test rows'],[[m['name'],f"{m['accuracy']:.4f}",f"{m['auc']:.4f}",f"{m['brier']:.4f}",f"{m['train_samples']} / {m['test_samples']}"] for m in models],[160,75,75,70,110])
    from backend.consensus import heldout_analysis
    lab=heldout_analysis(dataset['id'],{'role':'admin','id':'report-builder'})
    table(['Matched-holdout diagnostic','Measured value'],[['Agreement rate',lab['agreement_rate']],['Disagreement cases',lab['disagreement_count']],['Error rate when agreeing',lab['error_rate_when_agree']],['Error rate when disagreeing',lab['error_rate_when_disagree']],['Disagreement/error correlation',lab['disagreement_error_correlation']]],[245,245])
    p('These are exploratory associations. Review routing is not validated clinical triage. Ambiguous or empty conformal sets prompt research review rather than invented probability certainty.')
    spread=next(m for m in models if m['name']==order[-1])['seed_spread']
    p('Measured VQC member training losses: '+', '.join(f'{x:.5f}' for x in spread['training_losses'])+'. Loss standard deviation: '+f"{spread['loss_std']:.5f}"+'. These are optimization losses, not performance confidence intervals.')
    section('6. Quantum and explainable reports')
    p('The input-dependent feature map applies RY rotations, neighboring ZZ phases based on feature products and repeated encoding. Squared state overlaps form an SVM kernel. A unit test confirms that it differs from the product-of-cosine-squared kernel. Exact simulation remains a classical calculation.')
    p('VQC uses trainable RY rotations and ring CNOT gates, binary cross-entropy and seeded COBYLA optimization. Independent members are averaged, with measured member losses retained. Circuits are bounded to 2-6 qubits and 1-4 configured layers.')
    p('Consent-gated measurements must match the chosen schema and contain finite numerical values. Observed-data range warnings are informational. The report preserves both calibrated outputs, model versions and consensus facts. Doctor notes, approvals and overrides append review events without changing model probabilities.')
    p('Kernel SHAP explains the actual calibrated pipeline with a small background and an eight-second worker budget. Tree SHAP is a separate uncalibrated-component diagnostic where supported. Timeouts produce an explicitly labeled global permutation fallback.')
    p('Patient summaries use localized simple safety templates and top-feature descriptions. Optional AI narrative is accepted only after number checks. What-if sliders recompute both models without rewriting the report. Counterfactuals are bounded one-feature grid candidates, not guaranteed global minima or medical advice.')
    section('7. Languages, assistant and privacy')
    p('Nine locale catalogs support English, Tamil, Hindi, Telugu, Malayalam, Kannada, Spanish, French and Arabic. Core portal labels and patient safety templates are translated. Specialized research descriptions retain English fallback. Arabic switches direction and layout. Professional language review remains necessary.')
    p('The server-side Anthropic adapter requires an environment API key, model name and explicit external-AI enable flag. The default returns labeled local guidance. Only authorized report facts and fixed platform guidance enter provider context; identities and review notes are omitted.')
    p('Language routing, emergency/medication/injection phrase guards, input bounds and rate limits apply before generation. Provider output is buffered and checked before SSE chunks are shown. These guardrails are prototype controls, not a medical safety guarantee.')
    p('Chat history is owner-scoped and deletable. Audit entries retain action/resource metadata rather than conversation content. Browser voice input/output is optional and permission-dependent; voice recognition and installed-language voices remain unverified.')
    p('Audience PDF exports enforce report ownership, use Unicode/shaping support and reject unsupported script fonts rather than silently rendering missing glyphs. Some technical headings remain English.')
    section('8. API and security')
    table(['Endpoint group','Operations'],[['/api/auth/*','Register, login, refresh, logout, GET/PATCH me'],['/api/patients; /api/consent','Scoped profiles; GET/PUT consent'],['/api/admin/*','Users, doctor approval, assignments, audit'],['/api/datasets; /api/preprocess','Owned research datasets, CSV upload and settings'],['/api/models/*; /api/experiments/*','Training, metrics, prediction, importance and run status'],['/api/reports/*','Create, scoped list/detail, review and audience PDF'],['/api/consensus/lab/{dataset_id}','Measured holdout agreement/error analysis'],['/api/what-if; /api/what-if/counterfactual','Bounded model exploration'],['/api/chat; /api/chat/history','Authenticated responses; own GET/DELETE history']],[190,300])
    p('Controls include an explicit CORS allow-list, allowed-Origin checks for cookie mutations, HttpOnly cookies, Argon2, rate limits, security headers, bounded inputs and trusted server-generated artifact paths. Secrets and runtime data are excluded from Git and Docker build context.')
    p('Use HTTPS and secure cookies outside localhost. SQLite audit triggers are append-only application controls, not tamperproof protection against filesystem administrators. Encryption, retention governance, backups and independent security review remain deployment work.')
    section('9. Setup, demo and verification')
    p('Requirements: Python 3.10 and Node 22.12+. Run npm ci and python -m pip install -r backend/requirements.lock. Copy .env.example to .env and supply a random JWT secret plus a unique strong demo password. Seed with python -m backend.seed_demo --train --reports, then run npm run dev.')
    p('Fictional demo emails: admin@qura.demo, doctor1@qura.demo, doctor2@qura.demo, patient1@qura.demo, patient2@qura.demo and patient3@qura.demo. The password comes only from local QURA_DEMO_PASSWORD. Synthetic report measurements are generated; they are not copied patient records.')
    evidence=ROOT/'docs/verification.json'
    if evidence.exists():table(['Check','Recorded outcome'],[[k,str(v)] for k,v in json.loads(evidence.read_text(encoding='utf-8')).items()],[190,300])
    else:p('Final verification results are documented in docs/VERIFICATION.md; this generator does not assume test counts.')
    p('Backend tests isolate SQLite and artifacts in temporary storage. Playwright uses a fresh random temporary directory and a reduced two-model smoke configuration. Those scores are not the six-model results reported here.')
    section('10. Limitations and recommended next steps')
    for text in ['No prospective clinical validation, treatment benefit or quantum advantage is established. Exact simulation uses classical hardware; no hardware adapter is configured.','CV folds overlap. Intervals and conformal sets require careful interpretation and distributional assumptions. Parkinsons repeated recordings require subject-grouped validation.','SHAP can fall back to global importance. Counterfactuals are bounded and not guaranteed minimal.','Core translations need professional review; specialized UI/PDF copy may remain English.','Live Anthropic, Docker, browser voice recognition, mobile browsers and external deployment are unverified. Phrase guards cannot guarantee clinical safety.','The retained Tailwind 3 toolchain has five high-severity transitive npm audit findings. Vite/Vitest were upgraded; a compatible styling-toolchain migration remains necessary.','SQLite and append-only triggers are local prototype controls. Encryption, retention policy, production monitoring and an independent security review remain necessary.']:
        p('• '+text)
    p('Next steps: review remaining translations; migrate the legacy styling toolchain; run grouped and independent external validation; test an explicitly configured provider; and assess governance before shared deployment.')
    section('11. References and reproducibility')
    for text in ['UCI Cleveland Heart Disease: https://archive.ics.uci.edu/dataset/45/heart+disease','UCI Parkinsons Voice: https://archive.ics.uci.edu/dataset/174/parkinsons','Wisconsin: scikit-learn load_breast_cancer and its bundled DESCR metadata.','Implementation evidence: README.md, docs/UPGRADE_PLAN.md, backend modules and src/PortalApp.tsx / src/research/.','Results: backend/storage/research.db; experiment '+experiment['id']+'. Joblib checkpoints contain the trusted fitted pipelines.','Rebuild: python tools/build_upgrade_report.py after a completed six-model repeated-CV run.']:
        p(text,'SmallQ')
    out=ROOT/'output/pdf/Qura_Complete_Project_Report.pdf';out.parent.mkdir(parents=True,exist_ok=True)
    def footer(canvas: Any,doc: Any) -> None:
        w,h=A4;canvas.setStrokeColor(colors.HexColor('#c9dcdf'));canvas.line(52,42,w-52,42)
        canvas.setFont('QuraReport',8);canvas.setFillColor(INK);canvas.drawString(52,28,'Qura / Research prototype / 03 October 2026');canvas.drawRightString(w-52,28,str(doc.page))
    SimpleDocTemplate(str(out),pagesize=A4,leftMargin=52,rightMargin=52,topMargin=52,bottomMargin=58,title='Qura Complete Project Report - Upgraded Research Platform').build(story,onFirstPage=footer,onLaterPages=footer)
    print(str(out))


if __name__=='__main__':main()
