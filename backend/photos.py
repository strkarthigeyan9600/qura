"""Private, consented image submissions for assigned human review; no image diagnosis."""
from __future__ import annotations
import io
import time
import uuid
import warnings
from typing import Any
from fastapi import APIRouter,Depends,File,Form,HTTPException,UploadFile
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool
from PIL import Image,ImageOps,UnidentifiedImageError
from pydantic import BaseModel,Field
from backend.auth import current_user,roles,connection,can_access_patient,audit,rate_limit
from backend.repository import get,listing,save
from backend.settings import storage_dir

router=APIRouter(prefix='/api/photos',tags=['Private photo review'])
MAX_BYTES=10*1024*1024


def normalize_image(data: bytes) -> tuple[bytes,int,int]:
    """Decode actual JPEG/PNG/WebP, bound pixels and re-encode without EXIF metadata."""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error',Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as probe:
                if probe.format not in ['JPEG','PNG','WEBP'] or probe.width*probe.height>20_000_000 or max(probe.size)>10000:
                    raise HTTPException(422,'Use a JPEG, PNG or WebP image with at most 20 megapixels')
                if getattr(probe,'n_frames',1)!=1:raise HTTPException(422,'Animated images are not supported')
                probe.verify()
            with Image.open(io.BytesIO(data)) as original:
                image=ImageOps.exif_transpose(original).convert('RGBA')
                image.thumbnail((2400,2400),Image.Resampling.LANCZOS)
                background=Image.new('RGB',image.size,'white');background.paste(image,mask=image.getchannel('A'))
                output=io.BytesIO();background.save(output,format='JPEG',quality=90)
                return output.getvalue(),background.width,background.height
    except HTTPException:raise
    except (UnidentifiedImageError,OSError,ValueError,Image.DecompressionBombError,Image.DecompressionBombWarning):
        raise HTTPException(422,'The file is not a valid supported image')


def access(identifier: str,user: dict[str,Any]) -> dict[str,Any]:
    """Hide both metadata and image bytes outside current own/assigned access."""
    record=get(identifier,'photo')
    if not can_access_patient(user,record['patient_id']):raise HTTPException(404,'Photo not found')
    return record


@router.post('')
async def upload(file: UploadFile = File(...),description: str = Form('',max_length=2000),
                 photo_consent: bool = Form(...),user: dict[str,Any] = Depends(roles('patient'))) -> dict[str,Any]:
    """Accept explicit own-patient consent and persist only a normalized private image."""
    rate_limit('photo-upload:'+user['id'],10,3600)
    if not photo_consent:raise HTTPException(403,'Explicit photo-storage consent is required')
    with connection() as c:
        consent=c.execute('SELECT granted FROM consents WHERE user_id=?',(user['id'],)).fetchone()
        assigned=c.execute('SELECT 1 FROM assignments a JOIN users u ON u.id=a.doctor_id WHERE a.patient_id=? AND u.approved=1',(user['id'],)).fetchone()
    if not consent or not consent['granted']:raise HTTPException(403,'Give research consent in Consent settings first')
    if not assigned:raise HTTPException(409,'An administrator must assign a doctor before photo submission')
    data=await file.read(MAX_BYTES+1)
    if len(data)>MAX_BYTES:raise HTTPException(413,'Maximum photo size is 10 MB')
    normalized,width,height=await run_in_threadpool(normalize_image,data)
    identifier=uuid.uuid4().hex;directory=storage_dir()/'private_photos';directory.mkdir(exist_ok=True)
    path=directory/(identifier+'.jpg');path.write_bytes(normalized)
    record={'id':identifier,'patient_id':user['id'],'description':description.strip(),'created_at':time.time(),
            'width':width,'height':height,'status':'awaiting_review','reviews':[],'photo_consent_at':time.time(),
            'image_url':'/api/photos/'+identifier+'/image','note':'Human review only; no automated image analysis or diagnosis.'}
    try:save('photo',record)
    except Exception:path.unlink(missing_ok=True);raise
    audit(user['id'],'upload_photo','photo:'+identifier)
    return record


@router.get('')
def photos(user: dict[str,Any] = Depends(current_user)) -> list[dict[str,Any]]:
    """Show only own or currently assigned submissions, prioritizing pending review."""
    records=[r for r in listing('photo') if can_access_patient(user,r['patient_id'])]
    return sorted(records,key=lambda r:(r['status']!='awaiting_review',-r['created_at']))


@router.get('/{identifier}/image')
def image(identifier: str,user: dict[str,Any] = Depends(current_user)) -> FileResponse:
    """Stream privately after authorization; never mount the upload directory as static."""
    record=access(identifier,user)
    path=storage_dir()/'private_photos'/(record['id']+'.jpg')
    if not path.is_file():raise HTTPException(404,'Photo not found')
    return FileResponse(path,media_type='image/jpeg',headers={'Cache-Control':'no-store','Content-Disposition':'inline; filename="review-photo.jpg"'})


class PhotoReview(BaseModel):
    """A human note with an explicit status; preserves the original submission."""
    note: str = Field(min_length=1,max_length=2000)


@router.post('/{identifier}/review')
def review(identifier: str,payload: PhotoReview,user: dict[str,Any] = Depends(roles('doctor'))) -> dict[str,Any]:
    """Append an assigned review visible to the participant, without model inference."""
    if not payload.note.strip():raise HTTPException(422,'Enter a review note')
    record=access(identifier,user)
    record['reviews'].append({'doctor_id':user['id'],'doctor_name':user['name'],'note':payload.note.strip(),'created_at':time.time()})
    record['status']='reviewed';save('photo',record);audit(user['id'],'review_photo','photo:'+identifier)
    return record


@router.delete('/{identifier}')
def remove(identifier: str,user: dict[str,Any] = Depends(roles('patient'))) -> dict[str,bool]:
    """Allow the owner to remove image bytes and notes; retain content-free audit events."""
    record=access(identifier,user)
    (storage_dir()/'private_photos'/(record['id']+'.jpg')).unlink(missing_ok=True)
    with connection() as c:c.execute("DELETE FROM records WHERE id=? AND kind='photo'",(identifier,))
    audit(user['id'],'delete_photo','photo:'+identifier);return {'deleted':True}
