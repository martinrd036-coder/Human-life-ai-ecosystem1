function analyzeProduct(item = {}) {

  const title = item.title || "";
  const url = item.url || "";
  const description = item.description || "";
  const source = item.source || "";

  const checks = [];
  const evidence = [];

  if (title) {
    evidence.push("product_name");
  } else {
    checks.push("Confirm the product name.");
  }

  if (url) {
    evidence.push("product_url");
  } else {
    checks.push("Find a direct product source.");
  }

  if (description && description.length >= 80) {
    evidence.push("product_description");
  } else {
    checks.push("Confirm product details from the source.");
  }

  const host = url
    ? (() => {
        try {
          return new URL(url).hostname.toLowerCase();
        } catch (e) {
          return "";
        }
      })()
    : "";

  const recognizedSource =
    host.includes("amazon.") ||
    host.includes("walmart.") ||
    host.includes("etsy.") ||
    host.includes("ebay.") ||
    host.includes("shopify.");

  if (recognizedSource) {
    evidence.push("recognized_commerce_source");
  } else if (url) {
    checks.push("Verify the commerce source.");
  }

  let verificationStatus;

  if (
    title &&
    url &&
    description &&
    recognizedSource
  ) {
    verificationStatus = "needs_affiliate_verification";
  } else {
    verificationStatus = "needs_product_verification";
  }

  const contentAngles = [];

  if (title) {
    contentAngles.push(
      "Demonstration or real-world use case"
    );

    contentAngles.push(
      "Problem-and-solution style video"
    );

    contentAngles.push(
      "Short product review or comparison"
    );
  }

  return {
    productName: title || "Unknown product",

    sourceUrl: url || null,

    source: source || "Unknown source",

    verificationStatus,

    evidence,

    verificationChecks: checks,

    contentAngles,

    affiliateStatus:
      "Not verified — human verification required.",

    revenueStatus:
      "No revenue claimed.",

    testPlan: {
      objective:
        "Verify the product and affiliate eligibility before creating promotional content.",

      firstAction:
        "Verify the product page, current availability, affiliate eligibility, and applicable program rules.",

      successMetrics: [
        "product verified",
        "affiliate eligibility verified",
        "content test created",
        "content published",
        "clicks measured",
        "conversion evidence recorded",
        "revenue verified"
      ],

      stopRules: [
        "Stop if the product cannot be verified.",
        "Stop if affiliate eligibility cannot be confirmed.",
        "Stop if program rules prohibit the planned content.",
        "Do not claim revenue without verified reporting."
      ]
    }
  };
}


module.exports = {
  analyzeProduct
};
