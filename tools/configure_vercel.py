"""Generate Vercel routing after a persistent HTTPS backend is deployed."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit


def config_for(origin: str) -> dict:
    parsed = urlsplit(origin)
    if (parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password
            or parsed.path not in ('', '/') or parsed.query or parsed.fragment
            or parsed.hostname in ('localhost', '127.0.0.1', '::1')):
        raise ValueError('Use the public HTTPS backend origin only, without credentials or an /api path.')
    return {
        'buildCommand': 'npm run build',
        'outputDirectory': 'dist',
        'rewrites': [
            {'source': '/api/:path*', 'destination': origin.rstrip('/') + '/api/:path*'},
            {'source': '/(.*)', 'destination': '/index.html'},
        ],
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend', required=True)
    args = parser.parse_args()
    try:
        config = config_for(args.backend)
    except ValueError as error:
        parser.error(str(error))
    output = Path(__file__).resolve().parents[1] / 'vercel.json'
    output.write_text(json.dumps(config, indent=2) + '\n', encoding='utf-8')
    print('Created', output)
