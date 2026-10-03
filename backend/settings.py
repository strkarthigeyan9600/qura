"""Environment-backed settings; no browser-visible credentials."""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')

def storage_dir() -> Path:
    """Resolve the runtime directory (tests override QURA_STORAGE_DIR)."""
    directory = Path(os.getenv('QURA_STORAGE_DIR', str(Path(__file__).parent / 'storage'))).resolve()
    directory.mkdir(parents=True, exist_ok=True)
    return directory

def allowed_origins() -> list[str]:
    """Return an explicit origin allow-list, never a wildcard."""
    return os.getenv('QURA_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
