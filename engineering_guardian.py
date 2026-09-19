"""
Engineering Guardian
AI Agent Ecosystem

Purpose:
- Inspect application configuration
- Detect obvious deployment/configuration problems
- Report issues truthfully
- Recommend repairs
- Never automatically perform destructive repairs
"""

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import os
from typing import Any


@dataclass
class EngineeringFinding:
    severity: str
    component: str
    message: str
    recommendation: str


class EngineeringGuardian:

    def __init__(self):
        self.started_at = datetime.now(
            timezone.utc
        ).isoformat()

    def inspect(self) -> dict[str, Any]:

        findings: list[EngineeringFinding] = []

        # ---------------------------------------------
        # DATABASE
        # ---------------------------------------------

        if not os.getenv("DATABASE_URL"):
            findings.append(
                EngineeringFinding(
                    severity="warning",
                    component="database",
                    message="DATABASE_URL is not configured.",
                    recommendation=(
                        "Configure the production PostgreSQL "
                        "DATABASE_URL before enabling persistent "
                        "production workloads."
                    ),
                )
            )

        # ---------------------------------------------
        # REDIS
        # ---------------------------------------------

        if not os.getenv("REDIS_URL"):
            findings.append(
                EngineeringFinding(
                    severity="warning",
                    component="redis",
                    message="REDIS_URL is not configured.",
                    recommendation=(
                        "Configure Redis before enabling "
                        "background worker workloads."
                    ),
                )
            )

        # ---------------------------------------------
        # PAPER TRADING
        # ---------------------------------------------

        paper_trading = (
            os.getenv(
                "PAPER_TRADING",
                "false",
            ).lower()
            == "true"
        )

        if not paper_trading:
            findings.append(
                EngineeringFinding(
                    severity="info",
                    component="football-agent",
                    message=(
                        "Football analysis is not enabled "
                        "for paper trading."
                    ),
                    recommendation=(
                        "Keep real-money betting disabled. "
                        "Enable PAPER_TRADING=true only when "
                        "simulation is intentionally being tested."
                    ),
                )
            )

        # ---------------------------------------------
        # DETERMINE STATUS
        # ---------------------------------------------

        critical = any(
            finding.severity == "critical"
            for finding in findings
        )

        warnings = any(
            finding.severity == "warning"
            for finding in findings
        )

        if critical:
            status = "critical"
        elif warnings:
            status = "warning"
        else:
            status = "healthy"

        return {
            "engineering_guardian": {
                "status": status,
                "safe_mode": True,
                "started_at": self.started_at,
            },
            "findings": [
                asdict(finding)
                for finding in findings
            ],
            "automatic_destructive_repairs": False,
        }


engineering_guardian = EngineeringGuardian()
