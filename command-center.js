const startedAt = new Date().toISOString();

const state = {
  startedAt,
  cycle: 0,
  lastCycleAt: null,

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
      status: "building",
      next: "Receive research assignments from Command Center"
    },
    {
      id: "product-scout",
      name: "Product Scout",
      status: "building",
      next: "Connect product discovery"
    },
    {
      id: "guardian",
      name: "Guardian",
      status: "building",
      next: "Connect ecosystem monitoring"
    },
    {
      id: "engineering-guardian",
      name: "Engineering Guardian",
      status: "building",
      next: "Connect deployment diagnostics"
    }
  ],

  assignments: []
};

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

    agents: agentRegistry,

    tasks: state.tasks,

    assignments: state.assignments,

    events: state.events
  };
}

module.exports = {
  runCycle,
  getStatus,
  assignTask,
  completeTask,
  failTask
};
