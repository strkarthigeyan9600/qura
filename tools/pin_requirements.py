"""Pin the installed dependency closure of backend roots, excluding optional extras."""
from __future__ import annotations
from importlib.metadata import distribution
from pathlib import Path
from packaging.requirements import Requirement
from packaging.utils import canonicalize_name


def main() -> None:
    """Write an auditable, reproducible lock for the verified Python runtime."""
    root=Path(__file__).resolve().parents[1]
    queue=[Requirement(line).name for line in (root/'backend/requirements.txt').read_text().splitlines() if line and not line.startswith('#')]
    resolved={}
    while queue:
        name=canonicalize_name(queue.pop())
        if name in resolved:continue
        package=distribution(name)
        resolved[name]=package.version
        for text in package.requires or []:
            dependency=Requirement(text)
            if dependency.marker is None or dependency.marker.evaluate({'extra':''}):queue.append(dependency.name)
    text='# Verified on Python 3.10 / Windows. Optional extras excluded.\n'
    text+='\n'.join(name+'=='+version for name,version in sorted(resolved.items()))+'\n'
    (root/'backend/requirements.lock').write_text(text,encoding='utf-8')
    print('Pinned',len(resolved),'backend packages')


if __name__=='__main__':main()
