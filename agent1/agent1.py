- No real-money betting.
        "name": "football-intelligence",
            "football_agent.py",
            "football_agent/main.py",
            "football/main.py",
            "nfl_agent.py",
            "odds_client.py",
            "odds_client",
        "purpose": "Football statistics, schedules, injuries, and odds research.",
        "name": "paper-trading",
            "paper_trader.py",
            "paper_tracker.py",
        "purpose": "Market research and simulated trades only.",
        "mode": "paper",
    if config["mode"] == "paper":
            "%s found at %s. Starting only if PAPER_TRADING=true.",
        if os.getenv("PAPER_TRADING", "false").lower() != "true":
                "%s remains paused. Set PAPER_TRADING=true to allow simulation.",
