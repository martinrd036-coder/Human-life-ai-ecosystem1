function scoreOpportunity(item = {}) {
  let score = 0;
  const evidence = [];

  if (item.url) {
    score += 20;
    evidence.push("source_url");
  }

  if (item.description && item.description.length >= 80) {
    score += 15;
    evidence.push("useful_description");
  }

  if (
    item.revenueSource &&
    item.revenueSource !== "Research source"
  ) {
    score += 15;
    evidence.push("identified_source");
  }

  if (item.title && item.title.length >= 12) {
    score += 10;
    evidence.push("clear_title");
  }

  if (item.url) {
    try {
      const host = new URL(item.url).hostname.toLowerCase();

      if (
        host.endsWith(".gov") ||
        host.includes("amazon.") ||
        host.includes("youtube.") ||
        host.includes("tiktok.") ||
        host.includes("walmart.") ||
        host.includes("etsy.") ||
        host.includes("ebay.")
      ) {
        score += 20;
        evidence.push("recognized_platform");
      }
    } catch (e) {}
  }

  if (
    item.cost &&
    item.cost !== "Unknown" &&
    item.cost !== "Not yet verified"
  ) {
    score += 5;
    evidence.push("cost_identified");
  }

  if (item.riskNotes && item.riskNotes.length > 20) {
    score += 5;
    evidence.push("risk_note");
  }

  const testability = Math.min(
    100,
    Math.max(0, score + (item.url ? 10 : 0))
  );

  return {
    evidenceScore: Math.min(100, score),
    testabilityScore: testability,
    confidenceBand:
      score >= 70
        ? "strong_evidence"
        : score >= 45
        ? "moderate_evidence"
        : "needs_verification",
    evidence
  };
}

function buildExperimentPlan(item = {}) {
  const score = scoreOpportunity(item);

  return {
    opportunityId: item.id || null,

    objective:
      "Run a small, measurable test before investing significant time or money.",

    firstAction: item.url
      ? "Open the source, verify eligibility and monetization terms, then create the smallest possible test."
      : "Find and verify an authoritative source before testing.",

    successMetrics: [
      "verified source",
      "test completed",
      "measurable response",
      "cost recorded",
      "revenue or conversion evidence recorded"
    ],

    stopRules: [
      "Stop if eligibility is not confirmed.",
      "Stop if required cost exceeds the approved test budget.",
      "Stop if the source or terms cannot be verified."
    ],

    evidenceScore: score.evidenceScore,
    testabilityScore: score.testabilityScore,
    confidenceBand: score.confidenceBand
  };
}

module.exports = {
  scoreOpportunity,
  buildExperimentPlan
};
