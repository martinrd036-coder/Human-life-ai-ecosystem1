const express = require("express");
const { leader } = require("./leader");

const router = express.Router();

router.get("/status", (req, res) => {
  res.json(leader.getStatus());
});

router.post("/start", (req, res) => {
  res.json(leader.startMission());
});

router.post("/tasks", (req, res) => {
  const { title, agentId } = req.body || {};

  if (!title) {
    return res.status(400).json({
      error: "Task title is required"
    });
  }

  res.json(leader.addTask(title, agentId || "agent1"));
});

router.post("/tasks/:id/complete", (req, res) => {
  const task = leader.completeTask(req.params.id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  res.json(task);
});

router.post("/agents/:id/status", (req, res) => {
  const { status } = req.body || {};
  const agent = leader.setAgentStatus(req.params.id, status || "ready");

  if (!agent) {
    return res.status(404).json({
      error: "Agent not found"
    });
  }

  res.json(agent);
});

module.exports = router;
