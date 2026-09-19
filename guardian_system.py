"""
Guardian Command Center
AI Agent Ecosystem - Foundation v1

Purpose:
- Monitor system configuration
- Track agent status
- Detect basic incidents
- Enforce human approval for protected actions
- Never pretend something is running when it is not
- Never perform destructive actions automatically
"""

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import os
from typing import Any


GUARDIAN_VERSION = "1.0.0"


@dataclass
class Check:
    name: str
    status: str
    message: str
    details: dict[str, Any] | None = None


@dataclass
class Incident:
    severity: str
    component: str
    message: str
    timestamp: str


class Guardian:
    """
    Safe-by-default command center.

    The Guardian observes and reports.
    It does NOT automatically perform destructive actions.
    """

    PROTECTED_ACTIONS = {
        "financial_transaction",
        "real_money_betting",
        "delete_production_data",
        "delete_account",
        "change_credentials",
        "publish_sensitive_content",
        "change_affiliate_account",
        "change_payment_settings",
        "destructive_deployment",
    }

    def __init__(self):
        self.started_at = datetime.now(timezone.utc).isoformat()
        self.incidents: list[Incident] = []

    # ---------------------------------------------------------
    # PERMISSION SYSTEM
    # ---------------------------------------------------------

    def permission(
        self,
        action: str,
        human_approved: bool = False,
    ) -> bool:
        """
        Determines whether an action is allowed.

        Protected actions require explicit human approval.
        """

        if action in self.PROTECTED_ACTIONS:
            return human_approved

        return True

    # ---------------------------------------------------------
    # INCIDENT HANDLING
    # ---------------------------------------------------------

    def process_check(self, check: Check) -> None:
        if check.status == "healthy":
            return

        severity = "warning"

        if check.status in {"critical", "failed"}:
            severity = "critical"

        self.incidents.append(
            Incident(
                severity=severity,
                component=check.name,
                message=check.message,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
        )

    # ---------------------------------------------------------
    # CONFIGURATION CHECK
    # ---------------------------------------------------------

    def configuration_check(self) -> Check:
        database_url = os.getenv("DATABASE_URL")
        redis_url = os.getenv("REDIS_URL")

        missing = []

        if not database_url:
            missing.append("DATABASE_URL")

        if not redis_url:
            missing.append("REDIS_URL")

        if missing:
            return Check(
                name="configuration",
                status="warning",
                message="Required production configuration is missing.",
                details={
                    "missing_variables": missing,
                },
            )

        return Check(
            name="configuration",
            status="healthy",
            message="Required database and Redis configuration is present.",
        )

    # ---------------------------------------------------------
    # DATABASE CHECK
    # ---------------------------------------------------------

    def database_check(self) -> Check:
        database_url = os.getenv("DATABASE_URL")

        if not database_url:
            return Check(
                name="database",
                status="warning",
                message="DATABASE_URL is not configured.",
            )

        return Check(
            name="database",
            status="healthy",
            message="DATABASE_URL is configured.",
            details={
                "connectivity_tested": False,
            },
        )

    # ---------------------------------------------------------
    # WORKER CHECK
    # ---------------------------------------------------------

    def worker_check(self) -> Check:
        worker_enabled = (
            os.getenv("WORKER_ENABLED", "false").lower()
            == "true"
        )

        if not worker_enabled:
            return Check(
                name="worker",
                status="warning",
                message=(
                    "Worker process is not confirmed as enabled. "
                    "Guardian will not pretend a worker is running."
                ),
                details={
                    "worker_enabled": False,
                    "heartbeat_verified": False,
                },
            )

        return Check(
            name="worker",
            status="healthy",
            message="Worker is configured as enabled.",
            details={
                "worker_enabled": True,
                "heartbeat_verified": False,
            },
        )

    # ---------------------------------------------------------
    # AGENT CHECK
    # ---------------------------------------------------------

    def agent_check(
        self,
        agents: list[dict[str, Any]] | None = None,
    ) -> Check:

        if not agents:
            return Check(
                name="agents",
                status="warning",
                message="No active agent status was reported.",
                details={
                    "agent_count": 0,
                },
            )

        active = 0
        paused = 0
        failed = 0

        for agent in agents:
            status = str(
                agent.get("status", "")
            ).lower()

            if status in {
                "running",
                "active",
                "ready",
            }:
                active += 1

            elif status in {
                "paused",
                "offline",
            }:
                paused += 1

            elif status in {
                "failed",
                "error",
                "critical",
            }:
                failed += 1

        if failed:
            return Check(
                name="agents",
                status="failed",
                message="One or more agents reported a failure.",
                details={
                    "total": len(agents),
                    "active": active,
                    "paused": paused,
                    "failed": failed,
                },
            )

        return Check(
            name="agents",
            status="healthy",
            message="Agent registry responded.",
            details={
                "total": len(agents),
                "active": active,
                "paused": paused,
                "failed": failed,
            },
        )

    # ---------------------------------------------------------
    # MAIN GUARDIAN RUN
    # ---------------------------------------------------------

    def run(
        self,
        agents: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:

        checks = [
            self.configuration_check(),
            self.database_check(),
            self.worker_check(),
            self.agent_check(agents),
        ]

        for check in checks:
            self.process_check(check)

        critical_count = sum(
            1
            for check in checks
            if check.status in {"critical", "failed"}
        )

        warning_count = sum(
            1
            for check in checks
            if check.status == "warning"
        )

        if critical_count:
            overall_status = "critical"
        elif warning_count:
            overall_status = "warning"
        else:
            overall_status = "healthy"

        return {
            "guardian": {
                "name": "Guardian Command Center",
                "version": GUARDIAN_VERSION,
                "status": overall_status,
                "safe_mode": True,
                "started_at": self.started_at,
            },
            "checks": [
                asdict(check)
                for check in checks
            ],
            "incidents": [
                asdict(incident)
                for incident in self.incidents[-50:]
            ],
            "policy": {
                "protected_actions": sorted(
                    self.PROTECTED_ACTIONS
                ),
                "destructive_actions_automatic": False,
                "human_approval_required": True,
            },
        }

    # ---------------------------------------------------------
    # SIMPLE STATUS
    # ---------------------------------------------------------

    def status(self) -> dict[str, Any]:
        return {
            "name": "Guardian Command Center",
            "version": GUARDIAN_VERSION,
            "status": "online",
            "safe_mode": True,
            "started_at": self.started_at,
            "incident_count": len(self.incidents),
        }


# Global Guardian instance
guardian = Guardian()
