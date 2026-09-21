const path = require("path");
const express = require("express");
const { Pool } = require("pg");
const commandCenter = require("./command-center");
const { researchOpportunities } = require("./exa-research");

const {
  DEFAULT_RESEARCH_SOURCES,
  getResearchConfig
} = require("./research");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

app.use(express.json());

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      revenue_source TEXT NOT NULL,
      url TEXT,
      description TEXT,
      estimated_potential TEXT,
      difficulty TEXT,
      cost TEXT,
      risk_notes TEXT,
      status TEXT NOT NULL,
      discovered_at TIMESTAMPTZ NOT NULL
    )
  `);
}

const opportunities = [];
let lastOpportunityScoutRun = null;
let opportunityScoutRunning = false;

const OPPORTUNITY_SCOUT_COOLDOWN_MS = 15 * 60 * 1000;

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

app.get("/api/command-center/status", (req, res) => {
  res.json(commandCenter.getStatus(agentRegistry));
});

app.post("/api/command-center/cycle", (req, res) => {
  res.json({
    status: "success",
    cycle: commandCenter.runCycle(agentRegistry)
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

app.post("/api/opportunity-scout/run", async (req, res) => {
  if (opportunityScoutRunning) {
    return res.status(409).json({
      status: "busy",
      message: "Opportunity Scout is already running."
    });
  }

  if (
    lastOpportunityScoutRun &&
    Date.now() - new Date(lastOpportunityScoutRun).getTime() <
      OPPORTUNITY_SCOUT_COOLDOWN_MS
  ) {
    return res.status(429).json({
      status: "cooldown",
      message: "Opportunity Scout recently ran.",
      lastRunAt: lastOpportunityScoutRun
    });
  }

  const scout = agentRegistry.find(
    (item) => item.id === "opportunity-scout"
  );

  opportunityScoutRunning = true;
  scout.status = "running";
  scout.lastActivity = "Research scan started";

  try {
    const research = await researchOpportunities(
      req.body?.topic ||
        "legitimate ways to make money online through AI automation, affiliate programs, creator programs, freelance work, remote jobs, digital products, and reputable opportunities"
    );

    const discovered = research.results.map((result, index) => ({
      id: `opp-${Date.now()}-${index}`,
      title: result.title,
      revenueSource: result.source || "Research source",
      url: result.url,
      description: result.description,
      status: "new",
      discoveredAt: new Date().toISOString()
    }));

    opportunities.unshift(...discovered);
    opportunities.splice(100);

    lastOpportunityScoutRun = new Date().toISOString();

    scout.status = "online";
    scout.lastActivity =
      `Research scan completed: ${discovered.length} opportunities found`;

    res.json({
      status: "success",
      found: discovered.length,
      opportunities: discovered,
      searchedAt: research.searchedAt
    });
  } catch (error) {
    scout.status = "error";
    scout.lastActivity = "Research scan failed";

    res.status(500).json({
      status: "error",
      message: error.message
    });
  } finally {
    opportunityScoutRunning = false;
  }
});

app.get("/api/opportunities/status", (req, res) => {
  const opportunityScout = agentRegistry.find(
    (item) => item.id === "opportunity-scout"
  );

  res.json({
    status: opportunityScout.status,
    agent: opportunityScout,
    lastRunAt: lastOpportunityScoutRun,
    running: opportunityScoutRunning,
    opportunities
  });
});

app.get("/api/research/config", (req, res) => {
  const config = getResearchConfig();

  res.json({
    status: "ready",
    provider: config.provider,
    apiKeyConfigured: config.apiKeyConfigured,
    sources: DEFAULT_RESEARCH_SOURCES
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

app.post("/api/opportunities", (req, res) => {
  if (!req.body.title || !req.body.revenueSource) {
    return res.status(400).json({
      status: "error",
      message: "An opportunity must have a title and revenue source."
    });
  }

  const opportunity = {
    id: `opp-${Date.now()}`,
    title: req.body.title,
    revenueSource: req.body.revenueSource,
    estimatedPotential: req.body.estimatedPotential || "Unknown",
    difficulty: req.body.difficulty || "Unknown",
    cost: req.body.cost || "Unknown",
    riskNotes: req.body.riskNotes || "None provided",
    status: "new",
    discoveredAt: new Date().toISOString()
  };

  opportunities.push(opportunity);

  res.status(201).json({
    status: "created",
    opportunity
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Human Life AI Ecosystem running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });
