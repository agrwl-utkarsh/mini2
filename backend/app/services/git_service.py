import os
import shutil
import uuid
from git import Repo
from git.exc import GitCommandError
from app.config import settings


class GitService:
    def __init__(self):
        self.base_path = settings.REPO_BASE_PATH
        os.makedirs(self.base_path, exist_ok=True)

    def clone_repo(self, url: str, repo_id: str) -> str:
        """Clone a GitHub repo to the specified repo_id directory. Returns local_path."""
        local_path = os.path.join(self.base_path, repo_id)
        
        try:
            Repo.clone_from(url, local_path, depth=1)
            return local_path
        except GitCommandError as e:
            if os.path.exists(local_path):
                shutil.rmtree(local_path, ignore_errors=True)
            raise Exception(f"Failed to clone repository: {str(e)}")

    def cleanup_repo(self, repo_id: str) -> bool:
        """Delete cloned repository."""
        local_path = os.path.join(self.base_path, repo_id)
        if os.path.exists(local_path):
            shutil.rmtree(local_path, ignore_errors=True)
            return True
        return False

    def get_repo_path(self, repo_id: str) -> str:
        return os.path.join(self.base_path, repo_id)

    def repo_exists(self, repo_id: str) -> bool:
        return os.path.exists(os.path.join(self.base_path, repo_id))