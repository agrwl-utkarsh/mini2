#!/usr/bin/env python
"""Quick test script to verify backend works."""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test that all modules import correctly."""
    try:
        from app.config import settings
        print("✓ config imported")
    except Exception as e:
        print(f"✗ config: {e}")
        return False

    try:
        from app.models.schemas import AnalyzeRequest, Repository, FileTreeNode
        print("✓ models imported")
    except Exception as e:
        print(f"✗ models: {e}")
        return False

    try:
        from app.services.git_service import GitService
        print("✓ git_service imported")
    except Exception as e:
        print(f"✗ git_service: {e}")
        return False

    try:
        from app.services.scanner import scan_repository
        print("✓ scanner imported")
    except Exception as e:
        print(f"✗ scanner: {e}")
        return False

    try:
        from app.services.analyzer import analyze_file
        print("✓ analyzer imported")
    except Exception as e:
        print(f"✗ analyzer: {e}")
        return False

    try:
        from app.services.ai_service import ai_service
        print("✓ ai_service imported")
    except Exception as e:
        print(f"✗ ai_service: {e}")
        return False

    try:
        from app.api.routes.repo import router
        print("✓ repo routes imported")
    except Exception as e:
        print(f"✗ repo routes: {e}")
        return False

    try:
        from app.main import app
        print("✓ main app imported")
    except Exception as e:
        print(f"✗ main app: {e}")
        return False

    return True


def test_scanner():
    """Test scanner with a temp directory."""
    import tempfile
    from pathlib import Path
    from app.services.scanner import scan_repository
    from app.models.schemas import FileTreeNode, RepositoryStats

    with tempfile.TemporaryDirectory() as tmpdir:
        # Create test files
        (Path(tmpdir) / "main.py").write_text("def hello():\n    print('hello')\n\nclass MyClass:\n    pass\n")
        (Path(tmpdir) / "utils.js").write_text("export function add(a, b) {\n    return a + b;\n}\n")
        (Path(tmpdir) / "README.md").write_text("# Test\n\nThis is a test.")

        tree, stats = scan_repository(tmpdir)

        assert isinstance(tree, FileTreeNode)
        assert isinstance(stats, RepositoryStats)
        assert stats.files >= 3
        assert 'Python' in stats.languages
        assert 'JavaScript' in stats.languages

        print(f"✓ scanner works: {stats.files} files, {len(stats.languages)} languages")
        return True


if __name__ == "__main__":
    print("Testing RepoSense Backend...")
    print("=" * 40)

    if not test_imports():
        print("\n❌ Import tests failed")
        sys.exit(1)

    print("\nTesting scanner...")
    if not test_scanner():
        print("\n❌ Scanner test failed")
        sys.exit(1)

    print("\n" + "=" * 40)
    print("✅ All tests passed!")
    print("Backend is ready to run:")
    print("  cd backend && uvicorn app.main:app --reload --port 8000")