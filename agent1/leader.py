from datetime import datetime, timezone


class Agent1Leader:
    def __init__(self):
        self.name = "Agent 1"
        self.status = "online"
        self.mission = (
            "Find legitimate opportunities to build income through content, "
            "affiliate marketing, remote work, and useful digital services."
        )

        self.agents = [
            {"name": "Research Agent", "status": "ready"},
            {"name": "Affiliate Intelligence", "status": "ready"},
            {"name": "Content Agent", "status": "ready"},
            {"name": "Remote Job Agent", "status": "ready"},
            {"name": "Analytics Agent", "status": "ready"},
            {"name": "Safety Agent", "status": "online"},
        ]

        self.tasks = []
        self.activity = []

    def log(self, message):
        self.activity.insert(0, {
            "time": datetime.now(timezone.utc).isoformat(),
            "message": message
        })

    def add_task(self, title, agent="Agent 1"):
        task = {
            "title": title,
            "agent": agent,
            "status": "queued"
        }

        self.tasks.append(task)
        self.log(f"Task assigned to {agent}: {title}")
        return task

    def start_mission(self):
        self.status = "online"
        self.log("Agent 1 started the coordination cycle")

        if not self.tasks:
            self.add_task(
                "Research legitimate income opportunities",
                "Research Agent"
            )

            self.add_task(
                "Find affiliate products with real demand",
                "Affiliate Intelligence"
            )

            self.add_task(
                "Create three short-form content ideas",
                "Content Agent"
            )

            self.add_task(
                "Research legitimate remote jobs",
                "Remote Job Agent"
            )

        return self.tasks

    def get_status(self):
        return {
            "name": self.name,
            "status": self.status,
            "mission": self.mission,
            "agents": self.agents,
            "tasks": self.tasks,
            "activity": self.activity
        }


agent1 = Agent1Leader()
