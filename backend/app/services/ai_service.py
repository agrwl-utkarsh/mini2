import os
import re
from typing import List, Dict, Any
from app.config import settings
from app.models.schemas import FileReference, ChatResponse, FileContent


class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._model = None
        
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._model = genai.GenerativeModel(self.model_name)
            except Exception:
                self._model = None

    def is_available(self) -> bool:
        return self._model is not None

    def chat(self, question: str, repo_context: List[FileContent], repo_tree: str = "") -> ChatResponse:
        if self.is_available():
            return self._gemini_chat(question, repo_context, repo_tree)
        return self._fallback_chat(question, repo_context, repo_tree)

    def _gemini_chat(self, question: str, repo_context: List[FileContent], repo_tree: str) -> ChatResponse:
        try:
            context_parts = []
            if repo_tree:
                context_parts.append(f"Repository structure:\n{repo_tree}\n")
            
            for fc in repo_context[:5]:
                context_parts.append(f"--- File: {fc.path} ---\n{fc.content[:2000]}\n")
            
            context = "\n".join(context_parts)
            prompt = f"""You are a code assistant analyzing a GitHub repository.

{context}

Question: {question}

Answer concisely. Include file references in format [file:path] when relevant."""

            response = self._model.generate_content(prompt)
            answer = response.text or "No response generated"
            
            refs = self._extract_references(answer)
            return ChatResponse(answer=answer, references=refs, model="gemini")
        except Exception as e:
            return self._fallback_chat(question, repo_context, repo_tree)

    def _fallback_chat(self, question: str, repo_context: List[FileContent], repo_tree: str) -> ChatResponse:
        """Simple keyword-based fallback."""
        question_lower = question.lower()
        
        # Find relevant files by keyword matching
        relevant_files = []
        for fc in repo_context:
            score = 0
            content_lower = fc.content.lower()
            path_lower = fc.path.lower()
            
            for word in question_lower.split():
                if len(word) > 3:
                    if word in path_lower:
                        score += 3
                    if word in content_lower:
                        score += 1
            
            if score > 0:
                relevant_files.append((score, fc))
        
        relevant_files.sort(key=lambda x: -x[0])
        top_files = [fc for _, fc in relevant_files[:3]]
        
        if not top_files:
            answer = f"I couldn't find specific code related to '{question}'. The repository has {len(repo_context)} files analyzed. Try asking about specific files, functions, or concepts you see in the explorer."
        else:
            answer = f"Based on the repository analysis, here's what I found for '{question}':\n\n"
            for fc in top_files:
                answer += f"**{fc.path}** ({fc.language}, {fc.lines} lines)\n"
                # Show first few lines as preview
                preview = '\n'.join(fc.content.split('\n')[:10])
                answer += f"```{fc.language.lower()}\n{preview}\n```\n\n"
            answer += "\n*Note: This is a basic fallback response. Configure GEMINI_API_KEY for AI-powered answers.*"
        
        refs = [FileReference(path=fc.path) for fc in top_files]
        return ChatResponse(answer=answer, references=refs, model="fallback")

    def _extract_references(self, text: str) -> List[FileReference]:
        refs = []
        # Match [file:path] pattern
        for match in re.finditer(r'\[file:([^\]]+)\]', text):
            path = match.group(1)
            refs.append(FileReference(path=path))
        return refs


ai_service = AIService()