from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import uuid
import threading
import urllib.parse
from app.models.schemas import (
    AnalyzeRequest, AnalyzeResponse, RepoStatusResponse, 
    Repository, RepositoryStats, FileTreeNode, FileContent,
    CodeExplanation, ChatRequest, ChatResponse
)
from app.services.git_service import GitService
from app.services.scanner import scan_repository
from app.services.analyzer import analyze_file
from app.services.ai_service import ai_service
from app.config import settings

router = APIRouter(prefix="/repo", tags=["repository"])

# In-memory storage for demo (use Redis in production)
repos: dict[str, Repository] = {}
repo_locks: dict[str, threading.Lock] = {}


def get_lock(repo_id: str) -> threading.Lock:
    if repo_id not in repo_locks:
        repo_locks[repo_id] = threading.Lock()
    return repo_locks[repo_id]


def process_repository_sync(repo_id: str, url: str):
    """Synchronous repository processing."""
    lock = get_lock(repo_id)
    git_service = GitService()
    
    try:
        with lock:
            repo = repos.get(repo_id)
            if not repo:
                return
            
            # Clone
            repo.status = "cloning"
            repo.updated_at = __import__('datetime').datetime.now()
            local_path = git_service.clone_repo(url, repo_id)
            
            # Scan
            repo.status = "scanning"
            repo.updated_at = __import__('datetime').datetime.now()
            tree, stats = scan_repository(local_path)
            repo.tree = tree
            repo.stats = stats
            
            # Complete
            repo.status = "complete"
            repo.updated_at = __import__('datetime').datetime.now()
            
    except Exception as e:
        with lock:
            repo = repos.get(repo_id)
            if repo:
                repo.status = "error"
                repo.error = str(e)
                repo.updated_at = __import__('datetime').datetime.now()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repo(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    """Start analyzing a GitHub repository in the background."""
    url = str(request.url)
    
    # Validate GitHub URL
    if "github.com" not in url:
        raise HTTPException(status_code=400, detail="Only GitHub URLs are supported")
    
    repo_id = str(uuid.uuid4())[:8]
    
    # Create initial repo record
    repo = Repository(
        id=repo_id,
        name=url.split("/")[-1].replace(".git", ""),
        url=url,
        status="cloning",
        created_at=__import__('datetime').datetime.now(),
        updated_at=__import__('datetime').datetime.now()
    )
    repos[repo_id] = repo
    
    # Process asynchronously in background
    background_tasks.add_task(process_repository_sync, repo_id, url)
    
    return AnalyzeResponse(repo_id=repo_id, status="cloning")


@router.get("/{repo_id}/status", response_model=RepoStatusResponse)
async def get_repo_status(repo_id: str):
    """Get repository analysis status."""
    repo = repos.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return RepoStatusResponse(status=repo.status, error=repo.error)


@router.get("/{repo_id}/structure", response_model=FileTreeNode)
async def get_repo_structure(repo_id: str):
    """Get repository file tree."""
    repo = repos.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    if not repo.tree:
        raise HTTPException(status_code=400, detail="Repository not fully analyzed")
    return repo.tree


@router.get("/{repo_id}/stats", response_model=RepositoryStats)
async def get_repo_stats(repo_id: str):
    """Get repository statistics."""
    repo = repos.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    if not repo.stats:
        raise HTTPException(status_code=400, detail="Repository not fully analyzed")
    return repo.stats


@router.get("/{repo_id}/files/{file_path:path}", response_model=FileContent)
async def get_file_content(repo_id: str, file_path: str):
    """Get file content."""
    repo = repos.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    file_path = urllib.parse.unquote(file_path).lstrip("/\\")
    git_service = GitService()
    local_path = git_service.get_repo_path(repo_id)
    full_path = os.path.join(local_path, file_path)
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Security: ensure path is within repo
    if not os.path.abspath(full_path).startswith(os.path.abspath(local_path)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        content = open(full_path, 'r', encoding='utf-8', errors='ignore').read()
    except Exception:
        content = ""
    
    # Detect language
    ext = os.path.splitext(file_path)[1]
    from app.services.scanner import LANGUAGE_EXTENSIONS
    language = LANGUAGE_EXTENSIONS.get(ext, "Other")
    
    return FileContent(
        path=file_path,
        content=content,
        language=language,
        size=os.path.getsize(full_path),
        lines=content.count('\n') + 1
    )


@router.post("/{repo_id}/explain", response_model=CodeExplanation)
async def explain_file(repo_id: str, request: dict):
    """Explain a file."""
    repo = repos.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    file_path = request.get("file_path")
    if not file_path:
        raise HTTPException(status_code=400, detail="file_path required")
    
    file_path = urllib.parse.unquote(file_path).lstrip("/\\")
    git_service = GitService()
    local_path = git_service.get_repo_path(repo_id)
    full_path = os.path.join(local_path, file_path)
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    content = open(full_path, 'r', encoding='utf-8', errors='ignore').read()
    ext = os.path.splitext(file_path)[1]
    from app.services.scanner import LANGUAGE_EXTENSIONS
    language = LANGUAGE_EXTENSIONS.get(ext, "Other")
    
    file_content = FileContent(
        path=file_path,
        content=content,
        language=language,
        size=os.path.getsize(full_path),
        lines=content.count('\n') + 1
    )
    
    explanation = analyze_file(local_path, file_content)
    return explanation


@router.post("/{repo_id}/chat", response_model=ChatResponse)
async def chat_with_repo(repo_id: str, request: ChatRequest):
    """Chat with repository assistant."""
    repo = repos.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    if repo.status != "complete":
        raise HTTPException(status_code=400, detail="Repository analysis not complete")
    
    # Get relevant file contents for context
    git_service = GitService()
    local_path = git_service.get_repo_path(repo_id)
    
    context_files = []
    if repo.tree:
        # Flatten tree to get file paths
        def collect_files(node):
            files = []
            if node.type == "file":
                files.append(node.path)
            if node.children:
                for child in node.children:
                    files.extend(collect_files(child))
            return files
        
        all_paths = collect_files(repo.tree)
        for p in all_paths[:10]:  # Limit context
            fp = os.path.join(local_path, p)
            if os.path.exists(fp):
                try:
                    content = open(fp, 'r', encoding='utf-8', errors='ignore').read()
                    from app.services.scanner import LANGUAGE_EXTENSIONS
                    ext = os.path.splitext(p)[1]
                    lang = LANGUAGE_EXTENSIONS.get(ext, "Other")
                    context_files.append(FileContent(
                        path=p, content=content, language=lang,
                        size=os.path.getsize(fp), lines=content.count('\n') + 1
                    ))
                except:
                    pass
    
    # Generate tree string for context
    def tree_to_string(node, indent=0):
        result = "  " * indent + f"{'📁' if node.type == 'folder' else '📄'} {node.name}\n"
        if node.children:
            for child in node.children:
                result += tree_to_string(child, indent + 1)
        return result
    
    tree_str = tree_to_string(repo.tree) if repo.tree else ""
    
    response = ai_service.chat(request.question, context_files, tree_str)
    return response


@router.delete("/{repo_id}")
async def delete_repo(repo_id: str):
    """Delete repository and cleanup."""
    repo = repos.get(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    git_service = GitService()
    git_service.cleanup_repo(repo_id)
    del repos[repo_id]
    if repo_id in repo_locks:
        del repo_locks[repo_id]
    
    return {"message": "Repository deleted"}
