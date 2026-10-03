"""Synthetic image validation, consent, assignment isolation and human review lifecycle."""
import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from fastapi import HTTPException
from backend.main import app
from backend.auth import create_user,connection
from backend.photos import normalize_image
from backend.settings import storage_dir


def picture() -> bytes:
    """A synthetic solid-color PNG; never a medical or identifying photo."""
    output=io.BytesIO();Image.new('RGB',(80,60),'teal').save(output,format='PNG');return output.getvalue()


def login(email: str) -> TestClient:
    client=TestClient(app)
    assert client.post('/api/auth/login',json={'email':email,'password':'TestingPass123!'}).status_code==200
    return client


def test_private_photo_review_and_assignment_revocation():
    patient=create_user('Photo Participant','photo-patient@test.local','TestingPass123!')
    other=create_user('Other Participant','photo-other@test.local','TestingPass123!')
    doctor=create_user('Photo Doctor','photo-doctor@test.local','TestingPass123!','doctor',True)
    unrelated=create_user('Unassigned Doctor','photo-unassigned@test.local','TestingPass123!','doctor',True)
    administrator=create_user('Photo Administrator','photo-admin@test.local','TestingPass123!','admin',True)
    client=login(patient['email']);files={'file':('synthetic.png',picture(),'image/png')}
    assert client.post('/api/photos',files=files,data={'photo_consent':'true'}).status_code==403
    client.put('/api/consent',json={'granted':True})
    assert client.post('/api/photos',files=files,data={'photo_consent':'true'}).status_code==409
    with connection() as c:c.execute('INSERT INTO assignments VALUES(?,?)',(doctor['id'],patient['id']))
    assert client.post('/api/photos',files=files,data={'photo_consent':'false'}).status_code==403
    result=client.post('/api/photos',files=files,data={'photo_consent':'true','description':'Synthetic test image'})
    assert result.status_code==200
    record=result.json();identifier=record['id'];url=record['image_url']
    assert 'path' not in record and 'filename' not in record
    assert client.get(url).headers['content-type']=='image/jpeg'
    assert TestClient(app).get(url).status_code==401
    stranger=login(other['email']);assert stranger.get('/api/photos').json()==[]
    assert stranger.get(url).status_code==404
    unassigned=login(unrelated['email']);assert unassigned.get(url).status_code==404
    reviewer=login(doctor['email'])
    admin=login(administrator['email'])
    assert admin.get(url).status_code==200
    assert admin.post('/api/photos/'+identifier+'/review',json={'note':'Admin is not an assigned doctor'}).status_code==403
    assert reviewer.get('/api/photos').json()[0]['id']==identifier
    assert reviewer.get(url).status_code==200
    assert reviewer.delete('/api/photos/'+identifier).status_code==403
    assert client.post('/api/photos/'+identifier+'/review',json={'note':'Not a doctor'}).status_code==403
    assert reviewer.post('/api/photos/'+identifier+'/review',json={'note':'   '}).status_code==422
    response=reviewer.post('/api/photos/'+identifier+'/review',json={'note':'Synthetic image reviewed by a human.'})
    assert response.json()['status']=='reviewed'
    assert client.get('/api/photos').json()[0]['reviews'][0]['note']=='Synthetic image reviewed by a human.'
    with connection() as c:c.execute('DELETE FROM assignments WHERE doctor_id=? AND patient_id=?',(doctor['id'],patient['id']))
    assert reviewer.get(url).status_code==404
    assert client.delete('/api/photos/'+identifier).status_code==200
    assert not (storage_dir()/'private_photos'/(identifier+'.jpg')).exists()
    assert client.get(url).status_code==404


def test_image_decoder_strips_metadata_and_rejects_other_formats():
    output=io.BytesIO();source=Image.new('RGB',(20,20),'white');exif=Image.Exif();exif[270]='Identifying metadata must disappear'
    source.save(output,format='JPEG',exif=exif)
    cleaned,width,height=normalize_image(output.getvalue())
    with Image.open(io.BytesIO(cleaned)) as result:assert not result.getexif()
    assert (width,height)==(20,20)
    for bad in [b'<svg><script>alert(1)</script></svg>',b'not an image']:
        with pytest.raises(HTTPException) as rejected:normalize_image(bad)
        assert rejected.value.status_code==422
    output=io.BytesIO();Image.new('RGB',(10001,1),'white').save(output,format='PNG')
    with pytest.raises(HTTPException) as rejected:normalize_image(output.getvalue())
    assert rejected.value.status_code==422


def test_photo_size_limit(monkeypatch):
    patient=create_user('Size Participant','photo-size@test.local','TestingPass123!')
    doctor=create_user('Size Doctor','photo-size-doctor@test.local','TestingPass123!','doctor',True)
    with connection() as c:
        c.execute('INSERT INTO assignments VALUES(?,?)',(doctor['id'],patient['id']))
        c.execute('UPDATE consents SET granted=1 WHERE user_id=?',(patient['id'],))
    monkeypatch.setattr('backend.photos.MAX_BYTES',32)
    client=login(patient['email'])
    assert client.post('/api/photos',files={'file':('oversize.png',picture(),'image/png')},data={'photo_consent':'true'}).status_code==413
