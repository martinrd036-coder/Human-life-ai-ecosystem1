from guardian_system import guardian
from engineering_guardian import engineering_guardian # Railway sync
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

@app.get("/api/revenue")
def revenue_dashboard():
    """
    Revenue Command Center data.

    Keeps opportunities separate from verified revenue.
    """
    return {
        "engine": get_engine_status(),
        "opportunities": get_opportunities(),
        "priority_opportunities": get_priority_opportunities(5),
        "revenue": get_revenue_summary(),
    }


@app.get("/api/revenue/opportunities")
def revenue_opportunities():
    """Return all known revenue opportunities."""
    return {
        "count": len(get_opportunities()),
        "opportunities": get_opportunities(),
    }


@app.get("/api/revenue/top")
def revenue_top_opportunities():
    """Return the highest-priority revenue opportunities."""
    return {
        "opportunities": get_priority_opportunities(5),
    }


@app.get("/api/revenue/status")
def revenue_status():
    """Return truthful revenue-engine status."""
    return get_engine_status()
@app.post("/api/agent1/start")
def start_agent1():
    return {
        "message": "Agent 1 must be started from the worker process.",
        "status": "ready",
    }@app.get("/api/guardian")
def guardian_dashboard():
    agents = get_agent_status()
    return guardian.run(agents)


@app.get("/api/guardian/status")
def guardian_status():
    return guardian.status()


@app.get("/api/engineering")
def engineering_status():
    return engineering_guardian.inspect()


@app.get("/api/guardian/permission/{action}")
def guardian_permission(action: str):
    return {
        "action": action,
        "allowed_without_human_approval": guardian.permission(
            action,
            False
        ),
        "requires_human_approval": (
            action in guardian.PROTECTED_ACTIONS
        ),
    }
