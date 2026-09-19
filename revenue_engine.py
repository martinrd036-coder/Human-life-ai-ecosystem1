"""
Human Life AI Ecosystem
Revenue Opportunity Engine

Purpose:
- Maintain a structured list of legitimate revenue opportunities.
- Track eligibility and application status.
- Provide opportunities to the dashboard/API.
- Keep research separate from verified revenue.
- Never claim revenue without evidence.

This module is intentionally dependency-light so it can run
with the current Railway deployment.
"""

from datetime import datetime, timezone
from typing import Any


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


OPPORTUNITIES: list[dict[str, Any]] = [
    {
        "id": "amazon_associates",
        "name": "Amazon Associates",
        "category": "affiliate",
        "status": "ACTIVE",
        "user_status": "ACCOUNT_ESTABLISHED",
        "priority": "HIGH",
        "description": "Affiliate product content and product recommendations.",
        "revenue_type": "commission",
        "next_action": "Build and track product-content experiments.",
        "requires_human_approval": True,
        "verified_revenue": False,
        "last_checked": now_utc(),
    },
    {
        "id": "tiktok_shop",
        "name": "TikTok Shop Affiliate",
        "category": "affiliate",
        "status": "RESEARCHING",
        "user_status": "CHECK_ELIGIBILITY",
        "priority": "HIGH",
        "description": "Promote eligible TikTok Shop products through creator content.",
        "revenue_type": "commission",
        "next_action": "Check current creator eligibility and application status.",
        "requires_human_approval": True,
        "verified_revenue": False,
        "last_checked": now_utc(),
    },
    {
        "id": "youtube",
        "name": "YouTube Monetization",
        "category": "creator",
        "status": "BUILDING",
        "user_status": "GROWING_CHANNEL",
        "priority": "HIGH",
        "description": "Short-form and long-form content with future monetization opportunities.",
        "revenue_type": "ads_affiliate_shopping",
        "next_action": "Publish consistent Shorts and build the channel.",
        "requires_human_approval": True,
        "verified_revenue": False,
        "last_checked": now_utc(),
    },
    {
        "id": "ebay",
        "name": "eBay Partner Network",
        "category": "affiliate",
        "status": "RESEARCHING",
        "user_status": "NOT_CONNECTED",
        "priority": "MEDIUM",
        "description": "Affiliate opportunities across eBay products.",
        "revenue_type": "commission",
        "next_action": "Review current eligibility and application requirements.",
        "requires_human_approval": True,
        "verified_revenue": False,
        "last_checked": now_utc(),
    },
    {
        "id": "etsy",
        "name": "Etsy Creator Collective",
        "category": "affiliate",
        "status": "RESEARCHING",
        "user_status": "NOT_CONNECTED",
        "priority": "MEDIUM",
        "description": "Social creator affiliate opportunities for Etsy products.",
        "revenue_type": "commission",
        "next_action": "Check current creator eligibility.",
        "requires_human_approval": True,
        "verified_revenue": False,
        "last_checked": now_utc(),
    },
    {
        "id": "walmart_creator",
        "name": "Walmart Creator",
        "category": "affiliate",
        "status": "RESEARCHING",
        "user_status": "CHECK_ELIGIBILITY",
        "priority": "MEDIUM",
        "description": "Creator affiliate opportunities for Walmart products.",
        "revenue_type": "commission",
        "next_action": "Check current eligibility and application status.",
        "requires_human_approval": True,
        "verified_revenue": False,
        "last_checked": now_utc(),
    },
    {
        "id": "ugc",
        "name": "UGC / Brand Content",
        "category": "services",
        "status": "PLANNED",
        "user_status": "NOT_STARTED",
        "priority": "MEDIUM",
        "description": "Create product and social content for brands.",
        "revenue_type": "service_fee",
        "next_action": "Build a simple portfolio and prospect list.",
        "requires_human_approval": True,
        "verified_revenue": False,
        "last_checked": now_utc(),
    },
    {
        "id": "digital_products",
        "name": "Digital Products",
        "category": "products",
        "status": "PLANNED",
        "user_status": "NOT_STARTED",
        "priority": "MEDIUM",
        "description": "Sell useful original guides, templates, resources, or research.",
        "revenue_type": "direct_sale",
        "next_action": "Identify a real audience problem worth solving.",
        "requires_human_approval": True,
        "verified_revenue": False,
        "last_checked": now_utc(),
    },
    {
        "id": "lead_generation",
        "name": "Lead Generation",
        "category": "services",
        "status": "PLANNED",
        "user_status": "NOT_STARTED",
        "priority": "LOW",
        "description": "Generate legitimate business leads for appropriate providers.",
        "revenue_type": "referral_fee",
        "next_action": "Research legitimate referral opportunities.",
        "requires_human_approval": True,
        "verified_revenue": False,
        "last_checked": now_utc(),
    },
    {
        "id": "research_products",
        "name": "Research / Data Products",
        "category": "research",
        "status": "PLANNED",
        "user_status": "NOT_STARTED",
        "priority": "LOW",
        "description": "Turn useful original research into legitimate information products.",
        "revenue_type": "direct_sale",
        "next_action": "Identify a useful research niche.",
        "requires_human_approval": True,
        "verified_revenue": False,
        "last_checked": now_utc(),
    },
]


def get_opportunities() -> list[dict[str, Any]]:
    """Return all known revenue opportunities."""
    return OPPORTUNITIES


def get_active_opportunities() -> list[dict[str, Any]]:
    """Return opportunities currently being worked."""
    active_statuses = {
        "ACTIVE",
        "BUILDING",
        "RESEARCHING",
    }

    return [
        opportunity
        for opportunity in OPPORTUNITIES
        if opportunity["status"] in active_statuses
    ]


def get_priority_opportunities(limit: int = 5) -> list[dict[str, Any]]:
    """Return high-priority opportunities first."""
    priority_order = {
        "HIGH": 0,
        "MEDIUM": 1,
        "LOW": 2,
    }

    opportunities = sorted(
        OPPORTUNITIES,
        key=lambda item: priority_order.get(item["priority"], 99),
    )

    return opportunities[:limit]


def get_revenue_summary() -> dict[str, Any]:
    """
    Revenue is intentionally zero until actual evidence is recorded.

    This prevents the dashboard from confusing opportunities with income.
    """
    verified = [
        opportunity
        for opportunity in OPPORTUNITIES
        if opportunity.get("verified_revenue") is True
    ]

    return {
        "verified_revenue": 0.0,
        "pending_revenue": 0.0,
        "verified_opportunities": len(verified),
        "message": "No verified revenue has been recorded by this engine yet.",
    }


def get_engine_status() -> dict[str, Any]:
    """Return truthful engine health/activity information."""
    return {
        "engine": "revenue-opportunity-engine",
        "status": "READY",
        "last_check": now_utc(),
        "opportunity_count": len(OPPORTUNITIES),
        "active_opportunity_count": len(get_active_opportunities()),
        "verified_revenue": get_revenue_summary()["verified_revenue"],
}
