let db = null;

async function initCommandCenter(pool) {
  db = pool;

  const result = await db.query(`
    SELECT
      id,
      agent_id AS "agentId",
      task_name AS "taskName",
      details,
      status,
      assigned_at AS "assignedAt",
      started_at AS "startedAt",
      completed_at AS "completedAt",
      result
    FROM command_assignments
    ORDER BY assigned_at DESC
    LIMIT 50
  `);

  state.assignments = result.rows;

  const savedState = await db.query(`
    SELECT cycle, last_cycle_at
    FROM command_center_state
    WHERE id = 1
  `);

  if (savedState.rows.length) {
    state.cycle = savedState.rows[0].cycle || 0;
    state.lastCycleAt = savedState.rows[0].last_cycle_at
      ? new Date(savedState.rows[0].last_cycle_at).toISOString()
      : null;
  }
}
    const savedState = await db.query(`
    SELECT cycle, last_cycle_at
    FROM command_center_state
    WHERE id = 1
  `);

  if (savedState.rows.length) {
    state.cycle = savedState.rows[0].cycle || 0;
    state.lastCycleAt = savedState.rows[0].last_cycle_at
      ? new Date(savedState.rows[0].last_cycle_at).toISOString()
      : null;
  }
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
  "revenue-intelligence",
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

async function assignTask(agentId, taskName, details = {}) {
  if (!db) {
    throw new Error("Command Center database is not initialized.");
  }

  const assignment = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    agentId,
    taskName,
    details,
    status: "assigned",
    assignedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    result: null
  };

  await db.query(
    `INSERT INTO command_assignments
      (id, agent_id, task_name, details, status, assigned_at, started_at, completed_at, result)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      assignment.id,
      assignment.agentId,
      assignment.taskName,
      JSON.stringify(assignment.details),
      assignment.status,
      assignment.assignedAt,
      null,
      null,
      null
    ]
  );

  state.assignments.unshift(assignment);
  state.assignments = state.assignments.slice(0, 50);

  addEvent(
    "task-assigned",
    `Command Center assigned "${taskName}" to ${agentId}.`
  );

  return assignment;
}

async function startTask(assignmentId) {
  if (!db) {
    throw new Error("Command Center database is not initialized.");
  }

  const assignment = state.assignments.find(
    (task) => task.id === assignmentId
  );

  if (!assignment) {
    return null;
  }

  const startedAt = new Date().toISOString();

  await db.query(
    `UPDATE command_assignments
     SET status = $1,
         started_at = $2
     WHERE id = $3`,
    [
      "running",
      startedAt,
      assignmentId
    ]
  );

  assignment.status = "running";
  assignment.startedAt = startedAt;

  addEvent(
    "task-started",
    `Task "${assignment.taskName}" started by ${assignment.agentId}.`
  );

  return assignment;
}

async function completeTask(assignmentId, result = {}) {
  if (!db) {
    throw new Error("Command Center database is not initialized.");
  }

  const assignment = state.assignments.find(
    (task) => task.id === assignmentId
  );

  if (!assignment) {
    return null;
  }

  const completedAt = new Date().toISOString();

  await db.query(
    `UPDATE command_assignments
     SET status = $1,
         completed_at = $2,
         result = $3
     WHERE id = $4`,
    [
      "completed",
      completedAt,
      JSON.stringify(result),
      assignmentId
    ]
  );

  assignment.status = "completed";
  assignment.completedAt = completedAt;
  assignment.result = result;

  addEvent(
    "task-completed",
    `Task "${assignment.taskName}" completed by ${assignment.agentId}.`
  );

  return assignment;
  }

  async function 
  failTask(assignmentId, errorMessage) {
  if (!db) {
    throw new Error("Command Center database is not initialized.");
  }

  const assignment = state.assignments.find(
    (task) => task.id === assignmentId
  );

  if (!assignment) {
    return null;
  }

  const completedAt = new Date().toISOString();

  const result = {
    error: errorMessage
  };

  await db.query(
    `UPDATE command_assignments
     SET status = $1,
         completed_at = $2,
         result = $3
     WHERE id = $4`,
    [
      "failed",
      completedAt,
      JSON.stringify(result),
      assignmentId
    ]
  );

  assignment.status = "failed";
  assignment.completedAt = completedAt;
  assignment.result = result;

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
    if (db) {
    db.query(
      `UPDATE command_center_state
       SET cycle = $1,
           last_cycle_at = $2
       WHERE id = 1`,
      [state.cycle, state.lastCycleAt]
    ).catch((error) => {
      console.error("Command Center state persistence failed:", error.message);
    });
    }

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
  initCommandCenter,
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
