const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const agentRegistry = [
  {
    id: "agent1",
    name: "Football Intelligence",
    status: "online"
  },
  {
    id: "affiliate-intelligence",
    name: "Affiliate Intelligence",
    status: "not_connected"
  },
  {
    id: "viral-content",
    name: "Viral Content Agent",
    status: "not_connected"
  },
  {
    id: "job-hunter",
    name: "Job Hunter Agent",
    status: "not_connected"
  },
  {
    id: "analytics",
    name: "Analytics Agent",
    status: "not_connected"
  }
];

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ status: "online" });
});

app.get("/api/agents/status", (req, res) => {
  res.json({
    status: "online",
    agents: agentRegistry
  });
});

app.get("/api/agent1/status", (req, res) => {
  res.json({
    status: "configured",
    agents: [
      {
        id: "agent1",
        name: "Football Intelligence",
        status: "configured"
      }
    ]
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Human Life AI Ecosystem running on port ${PORT}`);
});
