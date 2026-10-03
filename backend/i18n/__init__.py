"""Safe fixed narratives in the nine supported languages."""
from __future__ import annotations
import json
from pathlib import Path

LANGUAGES=['en','ta','hi','te','ml','kn','es','fr','ar']
CATALOG=json.loads((Path(__file__).parent/'messages.json').read_text(encoding='utf-8'))

def message(key: str,language: str = 'en') -> str:
    """Resolve a localized safety template, falling back to English explicitly."""
    return CATALOG.get(language,CATALOG['en']).get(key,CATALOG['en'][key])

def detect_language(text: str,preferred: str = 'en') -> str:
    """Script routing plus conservative Latin-language cues; preference wins ambiguity."""
    scripts=[('ta',0x0B80,0x0BFF),('hi',0x0900,0x097F),('te',0x0C00,0x0C7F),('ml',0x0D00,0x0D7F),('kn',0x0C80,0x0CFF),('ar',0x0600,0x06FF)]
    for language,low,high in scripts:
        if any(low<=ord(char)<=high for char in text):return language
    lower=text.casefold()
    if any(word in lower for word in ['bonjour','résultat','médecin','mon résultat','confiance']):return 'fr'
    if any(word in lower for word in ['hola','resultado','médico','confianza','explícame']):return 'es'
    return preferred if preferred in LANGUAGES else 'en'
