const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const opportunities = [];

const agentRegistry = [
  {
    id: "agent1",
    name: "Football Intelligence",
    purpose: "Football research and intelligence",
    status: "online",
    lastActivity: "System connected"
  },
  {
    id: "affiliate-intelligence",
    name: "Affiliate Intelligence",
    purpose: "Find and analyze affiliate opportunities",
    status: "not_connected",
    lastActivity: "Not connected yet"
  },
  {
    id: "viral-content",
    name: "Viral Content Agent",
    purpose: "Discover and develop viral content opportunities",
    status: "not_connected",
    lastActivity: "Not connected yet"
  },
  {
    id: "job-hunter",
    name: "Job Hunter Agent",
    purpose: "Find legitimate online income and job opportunities",
    status: "not_connected",
    lastActivity: "Not connected yet"
  },
  {
    id: "analytics",
    name: "Analytics Agent",
    purpose: "Track performance, revenue, and experiments",
    status: "not_connected",
    lastActivity: "Not connected yet"
  },
  {
    id: "opportunity-scout",
    name: "Opportunity Scout",
    purpose: "Discover and prioritize legitimate revenue opportunities",
    status: "building",
    lastActivity: "Agent registry created"
  },
  {
    id: "product-scout",
    name: "Product Scout",
    purpose: "Find products with affiliate and content potential",
    status: "building",
    lastActivity: "Waiting for activation"
  },
  {
    id: "guardian",
    name: "Guardian",
    purpose: "Monitor the ecosystem and protect system operations",
    status: "building",
    lastActivity: "Waiting for activation"
  },
  {
    id: "engineering-guardian",
    name: "Engineering Guardian",
    purpose: "Monitor, diagnose, repair, test, and verify the ecosystem",
    status: "building",
    lastActivity: "Engineer specification created"
  }
];

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    service: "Human Life AI Ecosystem"
  });
});

app.get("/api/agents/status", (req, res) => {
  res.json({
    status: "online",
    totalAgents: agentRegistry.length,
    agents: agentRegistry
  });
});

app.get("/api/agent1/status", (req, res) => {
  const agent = agentRegistry.find((item) => item.id === "agent1");

  res.json({
    status: "online",
    agent
  });
});

app.get("/api/guardian/status", (req, res) => {
  const guardian = agentRegistry.find((item) => item.id === "guardian");
  const engineeringGuardian = agentRegistry.find(
    (item) => item.id === "engineering-guardian"
  );

  res.json({
    status: "online",
    guardian,
    engineeringGuardian
  });
});

app.get("/api/opportunities/status", (req, res) => {
  const opportunityScout = agentRegistry.find(
    (item) => item.id === "opportunity-scout"
  );

  res.json({
    status: "building",
    agent: opportunityScout,
    opportunities
  });
});

app.get("/api/opportunities", (req, res) => {
  res.json({
    status: "ready",
    agent: "Opportunity Scout",
    opportunities,
    message: "Opportunity Scout is ready to begin scanning."
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Human Life AI Ecosystem running on port ${PORT}`);
});
