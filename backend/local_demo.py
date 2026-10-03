"""Run credential-free fictional demo locally with separate persistent data."""
import os
import secrets
from pathlib import Path


def main():
    root = Path(__file__).resolve().parent / 'storage-local-demo'
    root.mkdir(exist_ok=True)
    secret_file = root / '.session-secret'
    if not secret_file.exists():
        secret_file.write_text(secrets.token_urlsafe(48), encoding='utf-8')
    os.environ.update(QURA_LOCAL_DEMO='true', QURA_STORAGE_DIR=str(root),
        QURA_JWT_SECRET=secret_file.read_text(encoding='utf-8'),
        QURA_DEMO_PASSWORD=secrets.token_urlsafe(32)+'Aa9!', QURA_COOKIE_SECURE='false',
        QURA_ALLOWED_ORIGINS='http://localhost:3030,http://127.0.0.1:3030')
    from backend.seed_demo import seed_accounts
    marker = root / '.seeded'
    if not marker.exists():
        seed_accounts()
        marker.write_text('Fictional local demo initialized', encoding='utf-8')
    import uvicorn
    uvicorn.run('backend.main:app', host='127.0.0.1', port=5030)


if __name__ == '__main__':
    main()
