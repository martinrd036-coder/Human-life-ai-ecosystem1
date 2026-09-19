"""Agent 1: football intelligence and paper-trading coordinator."""

import os
from datetime import datetime, timezone
from typing import Any

AGENT_CONFIG = {
    "name": "football-intelligence",
    "purpose": "Football statistics, schedules, injuries, and odds research.",
    "mode": "paper",
    "real_money_betting": False,
}


def get_agent_status() -> list[dict[str, Any]]:
    paper_trading = os.getenv("PAPER_TRADING", "false").lower() == "true"

    return [
        {
            "id": "agent1",
            "name": AGENT_CONFIG["name"],
            "purpose": AGENT_CONFIG["purpose"],
            "mode": AGENT_CONFIG["mode"],
            "paper_trading_enabled": paper_trading,
            "real_money_betting": False,
            "status": "ready" if paper_trading else "paused",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ]


def run_agent1(task: str | None = None) -> dict[str, Any]:
    paper_trading = os.getenv("PAPER_TRADING", "false").lower() == "true"

    return {
        "agent": "agent1",
        "task": task or "football research",
        "status": "ready" if paper_trading else "paused",
        "mode": "paper",
        "real_money_betting": False,
        "message": (
            "Agent 1 is ready for football research and simulated/paper analysis."
            if paper_trading
            else "Agent 1 is paused. Set PAPER_TRADING=true to enable simulation."
        ),
    }
