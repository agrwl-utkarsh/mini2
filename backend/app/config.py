import os
from typing import List, Optional
from pydantic import BaseSettings


class Settings(BaseSettings):
    # API
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "RepoSense"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Repository storage
    REPO_BASE_PATH: str = "/tmp/reposense"
    MAX_REPO_SIZE_MB: int = 500
    MAX_FILES: int = 5000
    
    # Groq AI
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    # Analysis
    ANALYSIS_TIMEOUT: int = 300
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Load .env manually
from dotenv import load_dotenv
load_dotenv()

settings = Settings()

# Ensure repo base path exists
os.makedirs(settings.REPO_BASE_PATH, exist_ok=True)