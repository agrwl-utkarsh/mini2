from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Any, Literal
from datetime import datetime
from enum import Enum


class RepoStatus(str, Enum):
    PENDING = "pending"
    CLONING = "cloning"
    SCANNING = "scanning"
    COMPLETE = "complete"
    ERROR = "error"


class AnalyzeRequest(BaseModel):
    url: HttpUrl


class AnalyzeResponse(BaseModel):
    repo_id: str
    status: RepoStatus


class RepoStatusResponse(BaseModel):
    status: RepoStatus
    error: str = ""


class RepositoryStats(BaseModel):
    files: int
    folders: int
    languages: Dict[str, int]
    frameworks: List[str]


class FileTreeNode(BaseModel):
    name: str
    path: str
    type: Literal["file", "folder"]
    language: str = "Other"
    size: int = 0
    children: List[Any] = []
    expanded: bool = False


class FileContent(BaseModel):
    path: str
    content: str
    language: str
    size: int
    lines: int


class CodeExplanation(BaseModel):
    file_path: str
    summary: str
    functions: List[Dict[str, Any]] = []
    classes: List[Dict[str, Any]] = []
    imports: List[Dict[str, Any]] = []


class FileReference(BaseModel):
    path: str
    line_start: int = 0
    line_end: int = 0


class ChatRequest(BaseModel):
    question: str
    repo_id: str


class ChatResponse(BaseModel):
    answer: str
    references: List[FileReference] = []
    model: Literal["gemini", "groq", "fallback"] = "groq"


# Use plain class for Repository to avoid pydantic v1 issues
class Repository:
    def __init__(
        self,
        id: str,
        name: str,
        url: str,
        status: RepoStatus,
        error: str = "",
        stats: RepositoryStats = None,
        tree: FileTreeNode = None,
        created_at: datetime = None,
        updated_at: datetime = None,
    ):
        self.id = id
        self.name = name
        self.url = url
        self.status = status
        self.error = error
        self.stats = stats
        self.tree = tree
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()