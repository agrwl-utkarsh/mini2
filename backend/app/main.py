from flask import Flask, request, jsonify
from flask_cors import CORS
import httpx
import os
import re
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=os.getenv("CORS_ORIGINS_STR", "http://localhost:5173").split(","))

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def extract_owner_repo(url: str):
    parts = str(url).rstrip("/").split("/")
    return parts[-2], parts[-1]


async def fetch_readme(owner: str, repo: str):
    paths = ["README.md", "README.txt", "README.rst", "readme.md"]
    async with httpx.AsyncClient() as client:
        for branch in ["main", "master"]:
            for path in paths:
                url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
                try:
                    r = await client.get(url, timeout=10.0)
                    if r.status_code == 200:
                        return r.text
                except:
                    continue
    raise Exception("README not found in repo")


async def explain_readme(readme: str):
    if not GROQ_API_KEY:
        return "README content:\n\n" + readme[:3000] + "\n\n(No GROQ_API_KEY configured - showing raw README)"

    prompt = f"""Explain this GitHub repository's README in simple language for a beginner software engineer. 
Focus on:
1. What this project does (in plain English)
2. Key features
3. How to use/install it (if mentioned)
4. Any important concepts a beginner should know

Keep it clear, friendly, and educational. Use simple language.

README:
{readme}"""

    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You are a helpful teacher who explains code to beginners in simple language."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 2000,
            },
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


app = Flask(__name__)
CORS(app, origins=os.getenv("CORS_ORIGINS_STR", "http://localhost:5173").split(","))

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def extract_owner_repo(url: str):
    parts = str(url).rstrip("/").split("/")
    return parts[-2], parts[-1]


async def fetch_readme(owner: str, repo: str):
    paths = ["README.md", "README.txt", "README.rst", "readme.md"]
    async with httpx.AsyncClient() as client:
        for branch in ["main", "master"]:
            for path in paths:
                url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
                try:
                    r = await client.get(url, timeout=10.0)
                    if r.status_code == 200:
                        return r.text
                except:
                    continue
    raise Exception("README not found in repo")


async def explain_readme(readme: str):
    if not os.getenv("GROQ_API_KEY"):
        return "README content:\n\n" + readme[:3000] + "\n\n(No GROQ_API_KEY configured - showing raw README)"

    prompt = f"""Explain this GitHub repository's README in simple language for a beginner software engineer. 
Focus on:
1. What this project does (in plain English)
2. Key features
3. How to use/install it (if mentioned)
4. Any important concepts a beginner should know

Keep it clear, friendly, and educational. Use simple language.

README:
{readme}"""

    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You are a helpful teacher who explains code to beginners in simple language."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 2000,
            },
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    if not data or "url" not in data:
        return jsonify({"error": "url required"}), 400

    url = data["url"]
    try:
        owner, repo = url.rstrip("/").split("/")[-2:]
    except:
        return jsonify({"error": "Invalid GitHub URL"}), 400

    import asyncio
    try:
        readme = asyncio.run(fetch_readme(owner, repo))
        explanation = asyncio.run(explain_readme(readme))
        return jsonify({"readme": readme, "explanation": explanation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)