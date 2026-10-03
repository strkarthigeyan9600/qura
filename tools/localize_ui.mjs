import fs from 'node:fs';
import ts from 'typescript';
const files=['src/PortalApp.tsx','src/ResearchApp.tsx','src/research/ClinicalPanel.tsx','src/research/WhatIfPanel.tsx'];
const catalog={};
function remember(s){if(s.trim()){catalog[s]=s;return true;}return false;}
for(const file of files){
 const source=fs.readFileSync(file,'utf8');const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const changes=[];
 function visit(node){
  if(ts.isJsxText(node)){
   const s=node.text.replace(/\s+/g,' ').trim();if(s&&/[A-Za-z]/.test(s)){remember(s);changes.push([node.pos,node.end,'{tr('+JSON.stringify(s)+')}']);}
  }
  if(ts.isStringLiteral(node)&&!ts.isJsxAttribute(node.parent)){
   const s=node.text;
   // Translate display phrases. Single navigation identifiers stay stable internally.
   const display=(s.includes(' ')||s.includes('?'))&&/[A-Za-z]/.test(s)&&!s.startsWith('/')&&!s.includes('qura-')&&!s.includes('application/')&&!s.includes('Content-Type')&&!s.includes('grid')&&!s.includes('#')&&!s.includes('http')&&!s.includes('Research tools')&&!s.includes('My patients')&&!s.includes('My reports')&&!s.includes('Review queue')&&!s.includes('Consensus Lab')&&!s.includes('What-if lab')&&!s.includes('Users & assignments')&&!s.includes('Audit log')&&!s.includes('Model training')&&!s.includes('Quantum circuit')&&!s.includes('Support vector machine')&&!s.includes('Logistic regression')&&!s.includes('Random forest')&&!s.includes('Gradient boosting')&&!s.includes('Quantum kernel')&&!s.includes('Variational quantum classifier')&&!s.includes('Personal workspace')&&!s.includes('text/')&&!s.includes('model-probabilities')&&!s.includes('portal-hero')&&!s.includes('model-options')&&!s.includes('page-heading')&&!s.includes('form-row')&&!s.includes('form-stack')&&!s.includes('login')&&!s.includes('report-')&&!s.includes('dataset-');
   if(display){remember(s);changes.push([node.getStart(ast),node.end,'tr('+JSON.stringify(s)+')']);}
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);changes.sort((a,b)=>b[0]-a[0]);let output=source;for(const [start,end,text] of changes)output=output.slice(0,start)+text+output.slice(end);
 // Navigation/model display values are translated only at rendering boundaries.
 output=output.replace('{n}</span>','{tr(String(n))}</span>').replace('{String(label)}</span>','{tr(String(label))}</span>').replace('{page}</strong>','{tr(page)}</strong>').replace('{page}</h3>','{tr(page)}</h3>').replace("'Research overview':page}","tr('Research overview'):tr(page)}").replace('{String(n)}<Activity','{tr(String(n))}<Activity').replace('{String(n)}<','{tr(String(n))}<').replace('{n}<Activity','{tr(String(n))}<Activity').replace('{n}</strong>','{tr(String(n))}</strong>').replace('{d}</small>','{tr(d)}</small>').replace('{title}</','{tr(title)}</').replace('{n}</th>','{tr(n)}</th>').replace('{n}</option>','{tr(n)}</option>');
 output="import {tr} from './research/i18n';\n"+output;
 if(file.startsWith('src/research/'))output=output.replace("'./research/i18n'","'./i18n'");
 fs.writeFileSync(file,output);
}
for(const text of ['Overview','Dashboard','Datasets','Preprocessing','Model training','Quantum circuit','Evaluation','Explainability','Predictions','Experiments','Documentation','Research tools','My patients','My reports','Review queue','Consensus Lab','What-if lab','Users & assignments','Audit log','Measurements','Assistant','Consent','Name','Email','Role','Approval','Accuracy','Sensitivity','Specificity','Model','Probability','Language','English','Active','Submitted','Reviewed','Yes','No','Select','Close','Undefined','Research overview','Dataset samples','Input features','Trained models','Best ROC–AUC','Language','Loading'])remember(text);
fs.writeFileSync('src/research/locales/en.json',JSON.stringify(catalog,null,2));
console.log(Object.keys(catalog).length+' catalog entries');
