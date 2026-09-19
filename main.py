from datetime import date
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from agent1.agent1 import get_agent_status, run_agent1

from revenue_engine import (
    get_engine_status,
    get_opportunities,
    get_priority_opportunities,
    get_revenue_summary,
)
app = FastAPI(title="Human-Life AI Ecosystem")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


agents = []


class AgentCreate(BaseModel):
    name: str
    purpose: str = ""


@app.get("/")
def home():
    index_path = Path(__file__).parent / "index.html"

    if not index_path.exists():
        return {"message": "Human-Life AI Ecosystem is running"}

    return FileResponse(index_path)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "Human-Life AI Ecosystem",
    }


@app.get("/api/dashboard")
def dashboard():
    status = get_agent_status()

    return {
        "status": "online",
        "date": str(date.today()),
        "agents": len(status),
        "agent_status": status,
    }


@app.get("/api/agents")
def get_agents():
    return {
        "agents": agents,
        "managed_agents": get_agent_status(),
    }


@app.post("/api/agents")
def create_agent(item: AgentCreate):
    agent = {
        "id": len(agents) + 1,
        "name": item.name,
        "purpose": item.purpose,
    }

    agents.append(agent)
    return agent


@app.post("/api/agent1/start")
def start_agent1():
    return {
        "message": "Agent 1 must be started from the worker process.",
        "status": "ready",
    }
