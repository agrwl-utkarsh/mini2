import os
from pathlib import Path
from typing import Dict, List, Set, Optional
from app.models.schemas import FileTreeNode, RepositoryStats


IGNORE_DIRS = {'.git', 'node_modules', 'venv', '__pycache__', 'dist', 'build', '.venv', 'env', '.env', '.next'}
IGNORE_FILES = {'.DS_Store', 'Thumbs.db', '.gitignore', '.env', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'}
MAX_SCAN_DEPTH = 8


LANGUAGE_EXTENSIONS = {
    '.py': 'Python', '.js': 'JavaScript', '.jsx': 'JavaScript', '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.java': 'Java', '.cpp': 'C++', '.cc': 'C++', '.cxx': 'C++', '.c': 'C', '.h': 'C',
    '.cs': 'C#', '.go': 'Go', '.rs': 'Rust', '.php': 'PHP', '.rb': 'Ruby',
    '.swift': 'Swift', '.kt': 'Kotlin', '.dart': 'Dart', '.html': 'HTML',
    '.css': 'CSS', '.scss': 'SCSS', '.vue': 'Vue', '.svelte': 'Svelte',
    '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML', '.md': 'Markdown',
    '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell', '.dockerfile': 'Dockerfile',
}


FRAMEWORK_INDICATORS = {
    'React': ['package.json', 'react'],
    'Vue': ['package.json', 'vue'],
    'Angular': ['package.json', '@angular'],
    'Next.js': ['package.json', 'next'],
    'Express': ['package.json', 'express'],
    'FastAPI': ['requirements.txt', 'fastapi'],
    'Django': ['requirements.txt', 'django'],
    'Flask': ['requirements.txt', 'flask'],
    'Spring': ['pom.xml', 'spring-boot'],
    'Rails': ['Gemfile', 'rails'],
    'Laravel': ['composer.json', 'laravel'],
    'TypeScript': ['tsconfig.json'],
    'ESLint': ['.eslintrc', 'eslint.config'],
    'Jest': ['jest.config', 'jest.config.js'],
    'Vite': ['vite.config'],
    'Webpack': ['webpack.config'],
    'Tailwind': ['tailwind.config'],
}


class Scanner:
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        self.file_count = 0
        self.folder_count = 0
        self.languages: Dict[str, int] = {}
        self.frameworks: Set[str] = set()

    def scan(self) -> tuple[FileTreeNode, RepositoryStats]:
        """Scan repository and return file tree + stats."""
        print(f"[DEBUG] Scanning {self.repo_path}")
        tree = self._build_tree(self.repo_path, relative_path="", depth=0)
        stats = self._compute_stats()
        print(f"[DEBUG] Scan complete: {stats.files} files, {len(stats.languages)} languages")
        return tree, stats

    def _build_tree(self, path: Path, relative_path: str = "", depth: int = 0) -> FileTreeNode:
        if depth > MAX_SCAN_DEPTH:
            return FileTreeNode(name=path.name or "root", path=relative_path or "", type="folder", language="Other", expanded=True, children=[])
        
        name = path.name if relative_path else path.name or "root"
        node = FileTreeNode(name=name, path=relative_path, type="folder", language="Other", expanded=True)
        
        try:
            entries = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
        except PermissionError:
            return node

        children = []
        for entry in entries:
            if entry.name in IGNORE_DIRS or entry.name in IGNORE_FILES:
                continue
            if entry.name.startswith('.'):
                continue
                
            rel = str(Path(relative_path) / entry.name) if relative_path else entry.name
            
            if entry.is_dir():
                if entry.name not in IGNORE_DIRS:
                    self.folder_count += 1
                    child = self._build_tree(entry, rel, depth + 1)
                    if child.children:
                        children.append(child)
            else:
                self.file_count += 1
                lang = self._detect_language(entry.name)
                size = entry.stat().st_size if entry.exists() else 0
                file_lang = lang or "Other"
                children.append(FileTreeNode(
                    name=entry.name,
                    path=rel,
                    type="file",
                    language=file_lang,
                    size=size
                ))
                if lang:
                    self.languages[lang] = self.languages.get(lang, 0) + 1

        node.children = children
        return node

    def _detect_language(self, filename: str) -> Optional[str]:
        for ext, lang in LANGUAGE_EXTENSIONS.items():
            if filename.endswith(ext):
                return lang
        return None

    def _compute_stats(self) -> RepositoryStats:
        self._detect_frameworks()
        return RepositoryStats(
            files=self.file_count,
            folders=self.folder_count,
            languages=self.languages,
            frameworks=sorted(self.frameworks)
        )

    def _detect_frameworks(self):
        # Check package.json
        pkg_json = self.repo_path / "package.json"
        if pkg_json.exists():
            try:
                import json
                data = json.loads(pkg_json.read_text())
                deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                for fw, indicator in FRAMEWORK_INDICATORS.items():
                    if indicator[0] == 'package.json' and indicator[1] in deps:
                        self.frameworks.add(fw)
            except:
                pass

        # Check requirements.txt
        req_txt = self.repo_path / "requirements.txt"
        if req_txt.exists():
            content = req_txt.read_text().lower()
            for fw, indicator in FRAMEWORK_INDICATORS.items():
                if indicator[0] == 'requirements.txt' and indicator[1] in content:
                    self.frameworks.add(fw)

        # Check config files
        config_files = ['tsconfig.json', '.eslintrc.js', 'jest.config.js', 'vite.config.js', 
                       'webpack.config.js', 'tailwind.config.js', 'pom.xml', 'Gemfile', 'composer.json']
        for cf in config_files:
            if (self.repo_path / cf).exists():
                for fw, indicator in FRAMEWORK_INDICATORS.items():
                    if indicator[0] == cf:
                        self.frameworks.add(fw)


def scan_repository(repo_path: str) -> tuple[FileTreeNode, RepositoryStats]:
    scanner = Scanner(repo_path)
    return scanner.scan()