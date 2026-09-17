import os
from datetime import date
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel


# Create the application
app = FastAPI(title="Human-Life AI Ecosystem")


# Allow connections from your dashboard
app.add_middleware(
    CORSMiddleware,
        allow_origins=["*"],
            allow_credentials=True,
                allow_methods=["*"],
                    allow_headers=["*"],
                    )


                    # Store agents temporarily in memory
                    agents = []


                    # Agent creation model
                    class AgentCreate(BaseModel):
                        name: str
                            purpose: str = ""


                            # HOMEPAGE
                            # This displays your index.html dashboard
                            @app.get("/")
                            def home():
                                index_path = Path(__file__).parent / "index.html"
                                    return FileResponse(index_path)


                                    # Health check
                                    @app.get("/health")
                                    def health():
                                        return {
                                                "status": "healthy",
                                                        "service": "Human-Life AI Ecosystem"
                                                            }


                                                            # Dashboard API
                                                            @app.get("/api/dashboard")
                                                            def dashboard():
                                                                return {
                                                                        "agents": len(agents),
                                                                                "status": "online",
                                                                                        "date": str(date.today())
                                                                                            }


                                                                                            # Get all agents
                                                                                            @app.get("/api/agents")
                                                                                            def get_agents():
                                                                                                return {
                                                                                                        "agents": agents
                                                                                                            }


                                                                                                            # Create a new AI agent
                                                                                                            @app.post("/api/agents")
                                                                                                            def create_agent(item: AgentCreate):
                                                                                                                agent = {
                                                                                                                        "id": len(agents) + 1,
                                                                                                                                "name": item.name,
                                                                                                                                        "purpose": item.purpose
                                                                                                                                            }

                                                                                                                                                agents.append(agent)

                                                                                                                                                    return agent
                                                                                                                                                    