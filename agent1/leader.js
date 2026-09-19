const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "leader-data.json");

const defaultState = {
  mission: "Build legitimate income opportunities through content, affiliate marketing, remote work, and automation.",
  status: "online",
  agents: [
    { id: "agent-1", name: "Agent 1 — Central Control", status: "online" },
    { id: "affiliate", name: "Affiliate Intelligence", status: "ready" },
    { id: "viral-content", name: "Viral Content Agent", status: "ready" },
    { id: "job-hunter", name: "Job Hunter Agent", status: "ready" },
    { id: "analytics", name: "Analytics Agent", status: "ready" }
  ],
  tasks: [],
  activity: [],
  createdAt: new Date().toISOString()
};

class Agent1Leader {
  constructor() {
    this.state = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      }
    } catch (error) {
      console.error("Could not load Agent 1 data:", error.message);
    }

    return JSON.parse(JSON.stringify(defaultState));
  }

  save() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2));
  }

  log(message) {
    this.state.activity.unshift({
      message,
      time: new Date().toISOString()
    });

    this.state.activity = this.state.activity.slice(0, 50);
    this.save();
  }

  addTask(task) {
    const newTask = {
      id: `task-${Date.now()}`,
      title: task.title,
      description: task.description || "",
      agentId: task.agentId || "agent-1",
      priority: task.priority || "medium",
      status: "pending",
      createdAt: new Date().toISOString(),
      completedAt: null,
      result: null
    };

    this.state.tasks.push(newTask);
    this.log(`Agent 1 assigned: ${newTask.title} to ${newTask.agentId}.`);
    return newTask;
  }

  completeTask(taskId, result = "") {
    const task = this.state.tasks.find(item => item.id === taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    task.status = "completed";
    task.completedAt = new Date().toISOString();
    task.result = result;

    this.log(`Task completed: ${task.title}`);
    return task;
  }

  startMission() {
    this.state.status = "online";
    this.log("Agent 1 started the ecosystem mission.");

    if (this.state.tasks.length === 0) {
      this.addTask({
        title: "Find legitimate affiliate opportunities",
        description: "Research products and programs that can be promoted honestly.",
        agentId: "affiliate",
        priority: "high"
      });

      this.addTask({
        title: "Find useful content opportunities",
        description: "Research content ideas that could grow an audience.",
        agentId: "viral-content",
        priority: "high"
      });

      this.addTask({
        title: "Find remote work opportunities",
        description: "Research legitimate remote jobs.",
        agentId: "job-hunter",
        priority: "high"
      });

      this.addTask({
        title: "Create a measurement plan",
        description: "Track applications, clicks, revenue, and results.",
        agentId: "analytics",
        priority: "medium"
      });
    }

    return this.getStatus();
  }

  getStatus() {
    const pendingTasks = this.state.tasks.filter(
      task => task.status === "pending"
    ).length;

    const completedTasks = this.state.tasks.filter(
      task => task.status === "completed"
    ).length;

    return {
      ...this.state,
      pendingTasks,
      completedTasks
    };
  }
}

const leader = new Agent1Leader();

module.exports = {
  Agent1Leader,
  leader
};
