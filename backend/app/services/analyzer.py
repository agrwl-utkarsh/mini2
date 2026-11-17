import re
from pathlib import Path
from typing import List, Dict, Any
from app.models.schemas import CodeExplanation, FileContent


class CodeAnalyzer:
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)

    def explain_file(self, file_content: FileContent) -> CodeExplanation:
        """Generate explanation for a file."""
        content = file_content.content
        language = file_content.language
        
        functions = self._extract_functions(content, language)
        classes = self._extract_classes(content, language)
        imports = self._extract_imports(content, language)
        summary = self._generate_summary(content, language, functions, classes)
        
        return CodeExplanation(
            file_path=file_content.path,
            summary=summary,
            functions=functions,
            classes=classes,
            imports=imports
        )

    def _extract_functions(self, content: str, language: str) -> List[Dict[str, Any]]:
        functions = []
        lines = content.split('\n')
        
        if language == 'Python':
            pattern = r'^\s*(async\s+)?def\s+(\w+)\s*\(([^)]*)\):'
            for i, line in enumerate(lines):
                match = re.match(pattern, line)
                if match:
                    is_async = bool(match.group(1))
                    name = match.group(2)
                    params = [p.strip() for p in match.group(3).split(',') if p.strip()]
                    functions.append({
                        "name": name,
                        "line_start": i + 1,
                        "line_end": self._find_block_end(lines, i),
                        "params": params,
                        "is_async": is_async,
                        "is_export": True
                    })
        
        elif language in ['JavaScript', 'TypeScript']:
            patterns = [
                r'^\s*(async\s+)?function\s+(\w+)\s*\(([^)]*)\)',
                r'^\s*const\s+(\w+)\s*=\s*(async\s+)?\(([^)]*)\)\s*=>',
                r'^\s*export\s+(async\s+)?function\s+(\w+)\s*\(([^)]*)\)',
            ]
            for i, line in enumerate(lines):
                for pattern in patterns:
                    match = re.match(pattern, line)
                    if match:
                        groups = match.groups()
                        if 'function' in pattern:
                            is_async = bool(groups[0])
                            name = groups[1]
                            params = [p.strip() for p in groups[2].split(',') if p.strip()]
                        else:
                            is_async = bool(groups[1])
                            name = groups[0]
                            params = [p.strip() for p in groups[2].split(',') if p.strip()]
                        functions.append({
                            "name": name,
                            "line_start": i + 1,
                            "line_end": self._find_block_end(lines, i),
                            "params": params,
                            "is_async": is_async,
                            "is_export": 'export' in line
                        })
                        break
        
        return functions[:20]  # Limit for demo

    def _extract_classes(self, content: str, language: str) -> List[Dict[str, Any]]:
        classes = []
        lines = content.split('\n')
        
        if language == 'Python':
            pattern = r'^\s*class\s+(\w+)\s*\(([^)]*)\):'
            for i, line in enumerate(lines):
                match = re.match(pattern, line)
                if match:
                    name = match.group(1)
                    extends = match.group(2).strip() if match.group(2).strip() else None
                    classes.append({
                        "name": name,
                        "line_start": i + 1,
                        "line_end": self._find_block_end(lines, i),
                        "extends": extends,
                        "methods": [],
                        "is_export": True
                    })
        
        elif language in ['JavaScript', 'TypeScript']:
            pattern = r'^\s*(export\s+)?class\s+(\w+)'
            for i, line in enumerate(lines):
                match = re.match(pattern, line)
                if match:
                    name = match.group(2)
                    classes.append({
                        "name": name,
                        "line_start": i + 1,
                        "line_end": self._find_block_end(lines, i),
                        "methods": [],
                        "is_export": bool(match.group(1))
                    })
        
        return classes[:10]

    def _extract_imports(self, content: str, language: str) -> List[Dict[str, Any]]:
        imports = []
        lines = content.split('\n')
        
        if language == 'Python':
            patterns = [
                r'^\s*import\s+([\w\s,]+)',
                r'^\s*from\s+(\S+)\s+import\s+([\w\s,]+)'
            ]
            for i, line in enumerate(lines):
                for pattern in patterns:
                    match = re.match(pattern, line)
                    if match:
                        groups = match.groups()
                        if 'from' in pattern:
                            imports.append({
                                "source": groups[0],
                                "specifiers": [s.strip() for s in groups[1].split(',')],
                                "is_default": False,
                                "line": i + 1
                            })
                        else:
                            imports.append({
                                "source": groups[0],
                                "specifiers": [s.strip() for s in groups[0].split(',')],
                                "is_default": True,
                                "line": i + 1
                            })
                        break
        
        elif language in ['JavaScript', 'TypeScript']:
            patterns = [
                r'^\s*import\s+(\w+)\s+from\s+[\'"]([^\'"]+)[\'"]',
                r'^\s*import\s+\{([^}]+)\}\s+from\s+[\'"]([^\'"]+)[\'"]',
                r'^\s*import\s+[\'"]([^\'"]+)[\'"]',
                r'^\s*const\s+\{([^}]+)\}\s+=\s+require\([\'"]([^\'"]+)[\'"]\)'
            ]
            for i, line in enumerate(lines):
                for pattern in patterns:
                    match = re.match(pattern, line)
                    if match:
                        groups = match.groups()
                        if len(groups) == 2 and '{' in pattern:
                            imports.append({
                                "source": groups[1],
                                "specifiers": [s.strip() for s in groups[0].split(',')],
                                "is_default": False,
                                "line": i + 1
                            })
                        elif len(groups) == 2:
                            imports.append({
                                "source": groups[1],
                                "specifiers": [groups[0]],
                                "is_default": True,
                                "line": i + 1
                            })
                        else:
                            imports.append({
                                "source": groups[0],
                                "specifiers": [],
                                "is_default": False,
                                "line": i + 1
                            })
                        break
        
        return imports[:30]

    def _find_block_end(self, lines: List[str], start: int) -> int:
        """Find end of code block by indentation."""
        if start >= len(lines):
            return start
        
        base_indent = len(lines[start]) - len(lines[start].lstrip())
        for i in range(start + 1, min(start + 100, len(lines))):
            if lines[i].strip() == '':
                continue
            indent = len(lines[i]) - len(lines[i].lstrip())
            if indent <= base_indent and lines[i].strip():
                return i
        return min(start + 50, len(lines))

    def _generate_summary(self, content: str, language: str, functions: List, classes: List) -> str:
        lines = content.split('\n')
        non_empty = [l for l in lines if l.strip()]
        
        parts = [f"This {language} file has {len(non_empty)} lines of code."]
        
        if functions:
            parts.append(f"It defines {len(functions)} function{'s' if len(functions) > 1 else ''} "
                        f"({', '.join([f['name'] for f in functions[:5]])}"
                        f"{'...' if len(functions) > 5 else ''}).")
        
        if classes:
            parts.append(f"It contains {len(classes)} class{'es' if len(classes) > 1 else ''} "
                        f"({', '.join([c['name'] for c in classes[:3]])}).")
        
        if language == 'Python' and '__main__' in content:
            parts.append("It can be run as a script.")
        
        return ' '.join(parts)


def analyze_file(repo_path: str, file_content: FileContent) -> CodeExplanation:
    analyzer = CodeAnalyzer(repo_path)
    return analyzer.explain_file(file_content)