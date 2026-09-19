from .evolution import MoneyEvolutionEngine


class MoneyEvolutionDirector:
    def __init__(self):
            self.engine = MoneyEvolutionEngine()
                    self.engine.initialize()

                        def status(self):
                                return {
                                            "population_size": len(self.engine.agents),
                                                        "active_agents": len(
                                                                        [
                                                                                            agent
                                                                                                                for agent in self.engine.agents
                                                                                                                                    if agent.status == "active"
                                                                                                                                                    ]
                                                                                                                                                                ),
                                                                                                                                                                            "evolution_interval_hours": 10,
                                                                                                                                                                                    }

                                                                                                                                                                                        def leaderboard(self):
                                                                                                                                                                                                return self.engine.leaderboard()

                                                                                                                                                                                                    def run_evolution_cycle(self):
                                                                                                                                                                                                            return self.engine.evolve()
