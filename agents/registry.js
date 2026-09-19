const agents = [
  {
    id: "affiliate-intelligence",
    name: "Affiliate Intelligence",
    role: "Find legitimate affiliate products and income opportunities",
    status: "ready",
    reportsTo: "agent-1"
  },
  {
    id: "remote-job-hunter",
    name: "Remote Job Hunter",
    role: "Find legitimate remote work opportunities",
    status: "ready",
    reportsTo: "agent-1"
  },
  {
    id: "viral-content",
    name: "Viral Content",
    role: "Discover and develop original content opportunities",
    status: "ready",
    reportsTo: "agent-1"
  },
  {
    id: "local-business-scout",
    name: "Local Business Scout",
    role: "Find legitimate local business opportunities",
    status: "ready",
    reportsTo: "agent-1"
  },
  {
    id: "market-research",
    name: "Market Research",
    role: "Research markets, trends, and customer demand",
    status: "ready",
    reportsTo: "agent-1"
  },
  {
    id: "automation",
    name: "Automation",
    role: "Identify safe ways to automate repetitive work",
    status: "ready",
    reportsTo: "agent-1"
  },
  {
    id: "analytics",
    name: "Analytics",
    role: "Track tasks, results, income, and performance",
    status: "ready",
    reportsTo: "agent-1"
  },
  {
    id: "safety-review",
    name: "Safety Review",
    role: "Review opportunities for scams, risks, and policy issues",
    status: "ready",
    reportsTo: "agent-1"
  }
];

function getAllAgents() {
  return agents;
}

function getAgent(id) {
  return agents.find(agent => agent.id === id);
}

module.exports = {
  agents,
  getAllAgents,
  getAgent
};
