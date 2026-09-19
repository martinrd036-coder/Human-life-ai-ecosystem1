const express = require("express");
const { getCoordinatorStatus, assignAgent } = require("./coordinator");

const router = express.Router();

router.get("/status", (req, res) => {
  res.json(getCoordinatorStatus());
});

router.post("/assign", (req, res) => {
  const { agentId, task } = req.body || {};

  if (!agentId || !task) {
    return res.status(400).json({
      error: "agentId and task are required"
    });
  }

  try {
    res.json(assignAgent(agentId, task));
  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
});

module.exports = router;
