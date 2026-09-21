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
      next: "Connect live research scan"
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
  ]
};

function runCycle(agentRegistry) {
  state.cycle += 1;
  state.lastCycleAt = new Date().toISOString();

  const online = agentRegistry.filter(
    (agent) => agent.status === "online"
  ).length;

  state.events.unshift({
    time: state.lastCycleAt,
    type: "heartbeat",
    message:
      "Command Center cycle #" +
      state.cycle +
      ": " +
      online +
      "/" +
      agentRegistry.length +
      " registered agents reporting."
  });

  state.events = state.events.slice(0, 25);

  return {
    cycle: state.cycle,
    lastCycleAt: state.lastCycleAt,
    onlineAgents: online,
    totalAgents: agentRegistry.length
  };
}

function getStatus(agentRegistry) {
  return {
    status: "online",
    mode: "command-center",
    mission:
      "Coordinate agents, track work, verify results, and protect the ecosystem.",
    startedAt: state.startedAt,
    cycle: state.cycle,
    lastCycleAt: state.lastCycleAt,
    agents: agentRegistry,
    tasks: state.tasks,
    events: state.events
  };
}

module.exports = {
  runCycle,
  getStatus
};
