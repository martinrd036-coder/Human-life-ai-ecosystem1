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

  const directAmazonProduct =
    /amazon\.com\/dp\/[a-z0-9]{10}/i.test(url) ||
    /amazon\.com\/gp\/product\/[a-z0-9]{10}/i.test(url);

  const hasUseCase =
    /\b(use|uses|ideal|designed|helps|for|solution|solve|organize|protect|clean|carry|store|improve)\b/i.test(
      description
    );

  const hasContentPotential = Boolean(
    title &&
    (description.length >= 80 || hasUseCase)
  );

  const qualificationChecks = [];
  let qualificationScore = 0;

  if (title) {
    qualificationScore += 15;
  } else {
    qualificationChecks.push("Product name is missing.");
  }

  if (url) {
    qualificationScore += 15;
  } else {
    qualificationChecks.push("Direct product URL is missing.");
  }

  if (directAmazonProduct) {
    qualificationScore += 20;
  } else {
    qualificationChecks.push(
      "Confirm this is a direct Amazon product page."
    );
  }

  if (description.length >= 80) {
    qualificationScore += 15;
  } else {
    qualificationChecks.push(
      "More product details are needed."
    );
  }

  if (recognizedSource) {
    qualificationScore += 10;
  } else {
    qualificationChecks.push(
      "Commerce source needs verification."
    );
  }

  if (hasUseCase) {
    qualificationScore += 10;
  } else {
    qualificationChecks.push(
      "Clear customer use case needs verification."
    );
  }

  if (hasContentPotential) {
    qualificationScore += 15;
  } else {
    qualificationChecks.push(
      "Content potential needs verification."
    );
  }

  let qualification;

  if (
    directAmazonProduct &&
    title &&
    url &&
    description.length >= 80 &&
    recognizedSource &&
    qualificationScore >= 80
  ) {
    qualification = "QUALIFIED";
  } else if (
    title &&
    url &&
    qualificationScore >= 45
  ) {
    qualification = "NEEDS_VERIFICATION";
  } else {
    qualification = "REJECTED";
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

  const recommendedAction =
    qualification === "QUALIFIED"
      ? "Prepare a content test and verify affiliate eligibility before publishing."
      : qualification === "NEEDS_VERIFICATION"
        ? "Verify the missing product evidence before creating a promotion test."
        : "Do not promote yet; find a stronger or better-supported product candidate.";

  return {
    productName: title || "Unknown product",

    sourceUrl: url || null,

    source: source || "Unknown source",

    verificationStatus:
      title && url && description && recognizedSource
        ? "product_verified"
        : title && url
          ? "product_details_need_verification"
          : "product_not_verified",

    qualification,

    qualificationScore,

    qualificationChecks,

    evidence,

    verificationChecks: checks,

    contentAngles,

    recommendedAction,

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
