"""Start the persistent, single-process deployment without exposing secrets."""
import os
import secrets
from pathlib import Path
from urllib.parse import urlsplit


def main():
    port = int(os.getenv('PORT', '5000'))
    if not 1 <= port <= 65535:
        raise ValueError('PORT must be between 1 and 65535')
    origin = os.getenv('RENDER_EXTERNAL_URL', '').rstrip('/')
    if origin:
        parsed = urlsplit(origin)
        if parsed.scheme != 'https' or not parsed.netloc or parsed.path:
            raise ValueError('RENDER_EXTERNAL_URL must be an HTTPS origin')
        allowed = [s.strip() for s in os.getenv('QURA_ALLOWED_ORIGINS', '').split(',') if s.strip()]
        if origin not in allowed:
            allowed.append(origin)
        os.environ['QURA_ALLOWED_ORIGINS'] = ','.join(allowed)
    if os.getenv('QURA_PUBLIC_DEMO') == 'true':
        os.environ['QURA_SEED_DEMO'] = 'true'
        os.environ['QURA_DEMO_PASSWORD'] = secrets.token_urlsafe(32) + 'Aa9!'
    if os.getenv('QURA_SEED_DEMO', 'false').lower() == 'true':
        from backend.seed_demo import seed_accounts
        from backend.settings import storage_dir
        marker = storage_dir() / '.hosted_demo_seeded'
        if not marker.exists():
            seed_accounts()
            marker.write_text('Fictional demo seeded. Existing consent is preserved on restart.\n', encoding='utf-8')
    os.execvp('python', ['python', '-m', 'uvicorn', 'backend.main:app', '--host', '0.0.0.0', '--port', str(port), '--workers', '1'])


if __name__ == '__main__':
    main()
