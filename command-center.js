const startedAt = new Date().toISOString();

const state = {
  startedAt,
  cycle: 0,
  lastCycleAt: null,

  automation: {
    enabled: true,
    intervalMinutes: 5,
    cursor: 0,
    lastAgentId: null,
    lastRunAt: null,
    lastResult: null
  },

  events: [
    {
      time: startedAt,
      type: "system",
      message: "Command Center initialized."
    }
  ],

  tasks: [
  {
    id: "opportunity-scout",
    name: "Opportunity Scout",
    status: "active",
    next: "Discover and evaluate legitimate revenue opportunities"
  },
  {
    id: "product-scout",
    name: "Product Scout",
    status: "active",
    next: "Research real products, affiliate eligibility, and content potential"
  },
  {
    id: "guardian",
    name: "Guardian",
    status: "active",
    next: "Monitor ecosystem health, safety, failures, and protected operations"
  },
  {
    id: "engineering-guardian",
    name: "Engineering Guardian",
    status: "active",
    next: "Monitor, diagnose, verify, and safely repair technical systems"
  }
],

  assignments: []
};

const automationOrder = [
  "opportunity-scout",
  "affiliate-intelligence",
  "product-scout",
  "viral-content",
  "job-hunter",
  "analytics",
  "guardian",
  "engineering-guardian"
];

function addEvent(type, message) {
  const event = {
    time: new Date().toISOString(),
    type,
    message
  };

  state.events.unshift(event);
  state.events = state.events.slice(0, 25);

  return event;
}

function assignTask(agentId, taskName, details = {}) {
  const assignment = {
    id: `task-${Date.now()}`,
    agentId,
    taskName,
    details,
    status: "assigned",
    assignedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    result: null
  };

  state.assignments.unshift(assignment);
  state.assignments = state.assignments.slice(0, 50);

  addEvent(
    "task-assigned",
    `Command Center assigned "${taskName}" to ${agentId}.`
  );

  return assignment;
}

function startTask(assignmentId) {
  const assignment = state.assignments.find(
    (task) => task.id === assignmentId
  );

  if (!assignment) {
    return null;
  }

  assignment.status = "running";
  assignment.startedAt = new Date().toISOString();

  addEvent(
    "task-started",
    `Task "${assignment.taskName}" started by ${assignment.agentId}.`
  );

  return assignment;
}

function completeTask(assignmentId, result = {}) {
  const assignment = state.assignments.find(
    (task) => task.id === assignmentId
  );

  if (!assignment) {
    return null;
  }

  assignment.status = "completed";
  assignment.completedAt = new Date().toISOString();
  assignment.result = result;

  addEvent(
    "task-completed",
    `Task "${assignment.taskName}" completed by ${assignment.agentId}.`
  );

  return assignment;
}

function failTask(assignmentId, errorMessage) {
  const assignment = state.assignments.find(
    (task) => task.id === assignmentId
  );

  if (!assignment) {
    return null;
  }

  assignment.status = "failed";
  assignment.completedAt = new Date().toISOString();
  assignment.result = {
    error: errorMessage
  };

  addEvent(
    "task-failed",
    `Task "${assignment.taskName}" failed for ${assignment.agentId}.`
  );

  return assignment;
}

function nextAutomatedAgent(agentRegistry) {
  if (!state.automation.enabled) {
    return null;
  }

  for (let i = 0; i < automationOrder.length; i++) {
    const index =
      (state.automation.cursor + i) % automationOrder.length;

    const agentId = automationOrder[index];

    const found = agentRegistry.find(
      (agent) => agent.id === agentId
    );

    if (found) {
      state.automation.cursor =
        (index + 1) % automationOrder.length;

      return agentId;
    }
  }

  return null;
}

function recordAutomation(result = {}) {
  state.automation.lastRunAt = new Date().toISOString();
  state.automation.lastAgentId = result.agentId || null;
  state.automation.lastResult = result;

  addEvent(
    "automation",
    result.message ||
      `Automation cycle completed for ${result.agentId || "unknown agent"}.`
  );

  return state.automation;
}

function setAutomation(enabled, intervalMinutes = 5) {
  state.automation.enabled = Boolean(enabled);
  state.automation.intervalMinutes =
    Number(intervalMinutes) > 0
      ? Number(intervalMinutes)
      : 5;

  addEvent(
    "automation-control",
    `Continuous automation ${
      state.automation.enabled ? "enabled" : "disabled"
    }.`
  );

  return state.automation;
}

function runCycle(agentRegistry) {
  state.cycle += 1;
  state.lastCycleAt = new Date().toISOString();

  const online = agentRegistry.filter(
    (agent) => agent.status === "online"
  ).length;

  addEvent(
    "heartbeat",
    "Command Center cycle #" +
      state.cycle +
      ": " +
      online +
      "/" +
      agentRegistry.length +
      " registered agents reporting."
  );

  return {
    cycle: state.cycle,
    lastCycleAt: state.lastCycleAt,
    onlineAgents: online,
    totalAgents: agentRegistry.length,
    activeAssignments: state.assignments.filter(
      (task) =>
        task.status === "assigned" ||
        task.status === "running"
    ).length
  };
}

function getStatus(agentRegistry) {
  return {
    status: "online",
    mode: "command-center",
    mission:
      "Coordinate agents, assign work, track results, verify completion, and protect the ecosystem.",

    startedAt: state.startedAt,
    cycle: state.cycle,
    lastCycleAt: state.lastCycleAt,

    automation: state.automation,

    agents: agentRegistry,

    tasks: state.tasks,

    assignments: state.assignments,

    events: state.events
  };
}
function getAutomationIntervalMinutes(){
  return state.automation.intervalMinutes;
}
module.exports = {
  runCycle,
  getStatus,
  assignTask,
  startTask,
  completeTask,
  failTask,
  nextAutomatedAgent,
  recordAutomation,
  setAutomation,
  getAutomationIntervalMinutes
};
