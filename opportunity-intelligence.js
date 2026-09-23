function getSourceQuality(url = "") {
  if (!url) {
    return {
      score: 0,
      level: "missing",
      reason: "No source URL was provided."
    };
  }

  try {
    const host = new URL(url).hostname.toLowerCase();

    const officialDomains = [
      ".gov",
      "amazon.com",
      "youtube.com",
      "tiktok.com",
      "walmart.com",
      "etsy.com",
      "ebay.com",
      "shopify.com",
      "upwork.com",
      "fiverr.com",
      "linkedin.com"
    ];

    const isOfficial = officialDomains.some(domain =>
      host === domain ||
      host.endsWith(domain)
    );

    if (isOfficial) {
      return {
        score: 30,
        level: "authoritative",
        reason: "Recognized official or authoritative domain."
      };
    }

    return {
      score: 5,
      level: "third_party",
      reason: "Third-party source requires verification."
    };

  } catch (e) {
    return {
      score: 0,
      level: "invalid",
      reason: "Source URL could not be verified."
    };
  }
}


function scoreOpportunity(item = {}) {

  let score = 0;
  const evidence = [];
  const verificationChecks = [];

  const source = getSourceQuality(item.url);

  score += source.score;

  if (source.level === "authoritative") {
    evidence.push("authoritative_source");
  } else {
    verificationChecks.push("Verify source authority.");
  }

  if (item.url) {
    score += 15;
    evidence.push("source_url");
  } else {
    verificationChecks.push("Find an authoritative source.");
  }

  if (
    item.description &&
    item.description.length >= 120
  ) {
    score += 15;
    evidence.push("detailed_description");
  } else {
    verificationChecks.push("Confirm the opportunity details.");
  }

  if (
    item.revenueSource &&
    item.revenueSource !== "Research source"
  ) {
    score += 10;
    evidence.push("identified_source");
  } else {
    verificationChecks.push("Identify the actual revenue source.");
  }

  if (
    item.title &&
    item.title.length >= 12
  ) {
    score += 5;
    evidence.push("clear_title");
  }

  if (
    item.cost &&
    item.cost !== "Unknown" &&
    item.cost !== "Not yet verified"
  ) {
    score += 5;
    evidence.push("cost_identified");
  } else {
    verificationChecks.push("Verify costs or fees.");
  }

  if (
    item.riskNotes &&
    item.riskNotes.length > 20
  ) {
    score += 5;
    evidence.push("risk_note");
  }

  const evidenceScore =
    Math.min(100, score);

  const testabilityScore =
    Math.min(
      100,
      evidenceScore +
      (item.url ? 10 : 0)
    );

  let confidenceBand;

  if (
    source.level === "authoritative" &&
    evidenceScore >= 65
  ) {
    confidenceBand = "strong_evidence";
  } else if (evidenceScore >= 40) {
    confidenceBand = "moderate_evidence";
  } else {
    confidenceBand = "needs_verification";
  }

  let qualityGate;

  if (
    confidenceBand === "strong_evidence" &&
    testabilityScore >= 70
  ) {
    qualityGate = "ready_for_verification";
  } else if (
    confidenceBand === "moderate_evidence"
  ) {
    qualityGate = "verify_before_testing";
  } else {
    qualityGate = "low_confidence";
  }

  return {
    evidenceScore,
    testabilityScore,
    confidenceBand,
    qualityGate,
    sourceQuality: source.level,
    evidence,
    verificationChecks
  };
}


function buildExperimentPlan(item = {}) {

  const intelligence =
    scoreOpportunity(item);

  return {

    opportunityId:
      item.id || null,

    objective:
      "Verify the opportunity first, then run the smallest measurable test before investing significant time or money.",

    firstAction:
      item.url
        ? "Open the source, verify eligibility, monetization terms, costs, and requirements."
        : "Find and verify an authoritative source before testing.",

    verificationChecks:
      intelligence.verificationChecks,

    successMetrics: [
      "verified source",
      "eligibility confirmed",
      "test completed",
      "measurable response",
      "cost recorded",
      "revenue or conversion evidence recorded"
    ],

    stopRules: [
      "Stop if eligibility is not confirmed.",
      "Stop if required cost exceeds the approved test budget.",
      "Stop if the source or terms cannot be verified.",
      "Stop if the opportunity depends on unsupported income claims."
    ],

    evidenceScore:
      intelligence.evidenceScore,

    testabilityScore:
      intelligence.testabilityScore,

    confidenceBand:
      intelligence.confidenceBand,

    qualityGate:
      intelligence.qualityGate,

    sourceQuality:
      intelligence.sourceQuality
  };
}


module.exports = {
  scoreOpportunity,
  buildExperimentPlan
};
