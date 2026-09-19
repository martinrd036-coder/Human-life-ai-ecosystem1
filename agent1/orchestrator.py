from datetime import datetime, timezone
from typing import Any

AGENT_REGISTRY = {
    "research": {
        "name": "Market Research",
        "purpose": "Find legitimate jobs, products, and content opportunities.",
    },
    "affiliate": {
        "name": "Affiliate Scout",
        "purpose": "Evaluate products and prepare affiliate content briefs.",
    },
    "creative": {
        "name": "Creative Studio",
        "purpose": "Create video concepts, scripts, captions, and shot lists.",
    },
    "publishing": {
        "name": "Publishing",
        "purpose": "Prepare approved content for authorized publishing.",
    },
    "analytics": {
        "name": "Analytics",
        "purpose": "Track views, clicks, conversions, and revenue.",
    },
    "safety": {
        "name": "Safety Review",
        "purpose": "Check scams, unsafe claims, copyright issues, and disclosures.",
    },
}

TASKS: list[dict[str, Any]] = []


def get_registry():
    return [
        {
            "id": agent_id,
            **details,
            "status": "ready",
        }
        for agent_id, details in AGENT_REGISTRY.items()
    ]


def create_task(title, agent_id, details=""):
    if agent_id not in AGENT_REGISTRY:
        raise ValueError(f"Unknown agent: {agent_id}")

    task = {
        "id": len(TASKS) + 1,
        "title": title,
        "agent_id": agent_id,
        "details": details,
        "status": "queued",
        "approval_required": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    TASKS.append(task)
    return task


def get_tasks():
    return TASKS


def approve_task(task_id):
    for task in TASKS:
        if task["id"] == task_id:
            task["approval_required"] = False
            task["status"] = "approved"
            return task

    raise KeyError("Task not found")


def run_next_task():
    for task in TASKS:
        if task["status"] == "approved":
            task["status"] = "running"
            return task

    return None
