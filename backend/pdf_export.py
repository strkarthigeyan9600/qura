"""On-demand authorized audience reports; patient data are never written to disk."""
from __future__ import annotations
from typing import Any
from io import BytesIO
import os
from pathlib import Path
from xml.sax.saxutils import escape
from fastapi import APIRouter,Depends,HTTPException
from fastapi.responses import Response
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from backend.auth import current_user,audit
from backend.reports import report_access

router=APIRouter(prefix='/api',tags=['PDF reports'])

def create_pdf(report: dict[str,Any],audience: str,language: str) -> bytes:
    """Render stored facts with a Unicode font, never manufactured model results."""
    stream=BytesIO();font=os.getenv('QURA_PDF_FONT','')
    candidates=[Path(font)] if font else [Path('C:/Windows/Fonts/arial.ttf'),Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')]
    fontname='Helvetica'
    for candidate in candidates:
        if candidate.is_file():
            pdfmetrics.registerFont(TTFont('QuraUnicode',str(candidate)));fontname='QuraUnicode';break
    styles=getSampleStyleSheet()
    styles.add(ParagraphStyle(name='QuraBody',fontName=fontname,fontSize=10,leading=15,spaceAfter=10))
    story=[]
    def paragraph(text: str) -> None:story.append(Paragraph(escape(text),styles['QuraBody']))
    story.append(Paragraph('QURA | RESEARCH REPORT',styles['Title']))
    paragraph('Research prototype. Not for diagnosis or treatment.')
    paragraph('Report '+report['id']+' | '+report['dataset_name'])
    paragraph('Audience: '+audience+' | Language: '+language)
    paragraph(report['patient_view']['summary']);paragraph(report['patient_view']['next_step'])
    data=[['Model','Positive probability'],[report['classical']['name'],f'{report["classical"]["probability"]*100:.1f}%'],[report['quantum']['name'],f'{report["quantum"]["probability"]*100:.1f}%']]
    table=Table(data,colWidths=[330,130]);table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dcefed')),('FONTNAME',(0,0),(-1,-1),fontname),('FONTSIZE',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]));story.append(table);story.append(Spacer(1,20))
    for item in report['patient_view'].get('top_features',[]):paragraph(item['feature']+': '+item['description'])
    for warning in report['warnings']:paragraph('Data quality: '+warning)
    if audience=='doctor':
        paragraph('Consensus: '+str(report['consensus']))
        paragraph('Model versions: '+report['classical'].get('version','unknown')+' / '+report['quantum'].get('version','unknown'))
        paragraph('Calibration is not clinical validation. Class sets are not probability confidence intervals.')
        for item in report.get('explanation',{}).get('features',[]):paragraph(f'{item["feature"]}: {item["value"]:+.5f}')
    for review in report['reviews']:paragraph('Researcher review: '+review['note'])
    def footer(canvas: Any,doc: Any) -> None:
        canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#647b86'));canvas.drawString(45,28,'Qura research prototype | No clinical or quantum-advantage claim');canvas.drawRightString(550,28,str(doc.page))
    SimpleDocTemplate(stream,leftMargin=45,rightMargin=45,topMargin=45,bottomMargin=50,title='Qura research report').build(story,onFirstPage=footer,onLaterPages=footer)
    return stream.getvalue()

@router.get('/reports/{identifier}/pdf')
def pdf(identifier: str,audience: str = 'patient',language: str = 'en',user: dict[str,Any] = Depends(current_user)) -> Response:
    """Scope PDF access exactly like report access and disallow patient clinician views."""
    if audience not in ['patient','doctor'] or language not in ['en','ta','hi','te','ml','kn','es','fr','ar']:raise HTTPException(422,'Unsupported audience or language')
    if user['role']=='patient' and audience!='patient':raise HTTPException(403,'Clinician exports require doctor access')
    report=report_access(identifier,user)
    audit(user['id'],'export_pdf','report:'+identifier)
    return Response(create_pdf(report,audience,language),media_type='application/pdf',headers={'Content-Disposition':f'attachment; filename="qura-{identifier[:8]}-{audience}.pdf"'})
