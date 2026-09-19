const agents = [
  ["Agent 1", "Central control and approval", "ONLINE"],
  ["Job Hunter", "Find legitimate remote employment", "READY"],
  ["Affiliate Intelligence", "Research products and commissions", "READY"],
  ["Viral Content", "Create TikTok, YouTube, and Reels ideas", "READY"],
  ["Local Business Scout", "Find businesses needing services", "READY"],
  ["Market Research", "Find problems customers will pay to solve", "READY"],
  ["Automation", "Connect approved workflows", "READY"],
  ["Analytics", "Track clicks, sales, and revenue", "READY"],
  ["Safety Review", "Reject scams and unsafe activity", "ONLINE"]
];

const agentContainer = document.getElementById("agents");

agentContainer.innerHTML = agents.map(agent => `
  <article class="card">
    <div class="card-top">
      <h3>${agent[0]}</h3>
      <span class="badge">${agent[2]}</span>
    </div>
    <p>${agent[1]}</p>
    <button onclick="selectAgent('${agent[0]}')">Open Agent</button>
  </article>
`).join("");

document.getElementById("start").onclick = function () {
  document.getElementById("message").textContent =
    "Agent 1 is online and ready to coordinate the ecosystem.";
};

document.getElementById("mission").onclick = function () {
  document.getElementById("activity").textContent =
    "Daily mission started. Agents are ready for approved tasks.";
};

function selectAgent(name) {
  document.getElementById("activity").textContent =
    name + " selected. Agent 1 will coordinate its next task.";
}
