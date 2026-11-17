from app.services.scanner import scan_repository
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as tmpdir:
    (Path(tmpdir) / 'main.py').write_text('print("hello")')
    tree, stats = scan_repository(tmpdir)
    print('Tree:', tree)
    print('Stats:', stats)