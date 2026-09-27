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
  verificationStatus = "product_verified";
} else if (
  title &&
  url
) {
  verificationStatus = "product_details_need_verification";
} else {
  verificationStatus = "product_not_verified";
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
  "Promotion allowed — Amazon qualifying period active.",
    revenueStatus:
      "No revenue claimed.",

    testPlan: {
      objective:
  "Identify promising Amazon products, create content tests, drive traffic through the affiliate link, and measure views, clicks, qualifying purchases, and verified commissions.",
      firstAction:
  "Confirm the product page and current product information, then prepare a content test using the user's Amazon affiliate link and track views, clicks, qualifying purchases, and verified commissions.",
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
