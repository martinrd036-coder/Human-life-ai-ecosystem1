from datetime import datetime, timezone

AGENT1 = {
    "id": "agent1",
    "name": "Agent 1 - Central Controller",
    "status": "ready",
    "mission": "Coordinate the ecosystem and identify legitimate income opportunities.",
    "managed_agents": [
        "research-agent",
        "content-agent",
        "affiliate-agent",
        "analytics-agent",
    ],
}

TASKS = []


def get_agent_status():
    return {
        "agent": AGENT1,
        "tasks": TASKS,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def run_agent1(task=None):
    if task:
        TASKS.append({
            "task": task,
            "status": "queued",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return {
        "status": "running",
        "message": "Agent 1 is coordinating the ecosystem.",
        "tasks": TASKS,
    }
