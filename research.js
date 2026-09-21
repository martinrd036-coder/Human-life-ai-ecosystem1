const DEFAULT_RESEARCH_SOURCES = [
  "official company career pages",
  "official affiliate programs",
  "official creator programs",
  "official freelance platforms",
  "official government job resources",
  "reputable business opportunity sources"
];

function getResearchConfig() {
  return {
    provider: process.env.RESEARCH_PROVIDER || "exa",
    apiKeyConfigured: Boolean(process.env.EXA_API_KEY)
  };
}

function buildResearchQuery(topic = "legitimate ways to make money online") {
  return [
    topic,
    "legitimate",
    "current",
    "official source",
    "requirements",
    "how to apply",
    "costs or fees",
    "earning model"
  ].join(" ");
}

function normalizeOpportunity(raw) {
  return {
    title: raw.title || "Untitled opportunity",
    revenueSource: raw.revenueSource || "Unknown",
    category: raw.category || "Business Opportunities",
    description: raw.description || "",
    sourceName: raw.sourceName || "Unknown source",
    sourceUrl: raw.sourceUrl || "",
    evidence: raw.evidence || "",
    requirements: raw.requirements || "Not yet verified",
    cost: raw.cost || "Not yet verified",
    riskNotes:
      raw.riskNotes ||
      "Verify terms and eligibility before acting.",
    discoveredAt: new Date().toISOString()
  };
}

module.exports = {
  DEFAULT_RESEARCH_SOURCES,
  getResearchConfig,
  buildResearchQuery,
  normalizeOpportunity
};
