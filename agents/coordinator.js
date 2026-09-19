const { getAllAgents, getAgent } = require("./registry");

function buildAssignments() {
  return getAllAgents().map(agent => ({
    agentId: agent.id,
    agentName: agent.name,
    reportsTo: "agent-1",
    status: "assigned",
    assignment: `Agent 1 will coordinate ${agent.role.toLowerCase()}.`
  }));
}

function getCoordinatorStatus() {
  return {
    leader: "agent-1",
    leaderName: "Agent 1",
    mode: "central-command",
    agents: getAllAgents(),
    assignments: buildAssignments(),
    rule: "Agent 1 reviews and coordinates all agent work."
  };
}

function assignAgent(agentId, task) {
  const agent = getAgent(agentId);

  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  return {
    leader: "agent-1",
    assignedTo: agent,
    task,
    status: "pending-review"
  };
}

module.exports = {
  buildAssignments,
  getCoordinatorStatus,
  assignAgent
};
