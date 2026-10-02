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
    /\b(ideal for|designed for|helps you|helps users|used to|use it to|built for|made for|solves|solution for|organize your|protect your|clean your|carry your|store your|improve your|watch|stream|streaming|play games|listen to|read|write|charge|charging|control|connect|connected|browse|search|work|learn|cook|travel|record|display|view|track|monitor|communicate|call|video call|take photos|photography)\b/i.test(
      description
    );

  const hasUsefulDetails =
    /\b(price|reviews?|rated|features?|dimensions?|size|color|battery|wireless|bluetooth|wifi|storage|display|resolution|material|includes?|compatible|works with|seller|in stock)\b/i.test(
      description
    );

  const hasGarbage =
    /\b(var\s+\w+\s*=|window\.|document\.|function\s*\(|setInterval\s*\(|setTimeout\s*\(|ue_[a-z_]+)\b/i.test(
      description
    );

  const hasContentPotential = Boolean(
    title &&
    hasUseCase &&
    hasUsefulDetails &&
    !hasGarbage
  );
    const qualificationChecks = [];
  let qualificationScore = 0;

  const scoreChecks = {
    productName: Boolean(title),
    directUrl: Boolean(url),
    directAmazonProduct,
    cleanDetails:
      description.length >= 120 && !hasGarbage,
    recognizedSource,
    customerUseCase: hasUseCase,
    contentPotential: hasContentPotential
  };

  if (scoreChecks.productName) {
    qualificationScore += 10;
    evidence.push("product_identity_confirmed");
  } else {
    qualificationChecks.push("Product identity needs verification.");
  }

  if (scoreChecks.directUrl) {
    qualificationScore += 10;
    evidence.push("direct_product_url");
  } else {
    qualificationChecks.push("Direct product URL is missing.");
  }

  if (scoreChecks.directAmazonProduct) {
    qualificationScore += 20;
    evidence.push("direct_amazon_product_page");
  } else {
    qualificationChecks.push(
      "Confirm this is a direct Amazon product page."
    );
  }

  if (scoreChecks.cleanDetails) {
    qualificationScore += 15;
    evidence.push("clean_product_details");
  } else {
    qualificationChecks.push(
      "Clean, detailed product evidence is needed."
    );
  }

  if (scoreChecks.recognizedSource) {
    qualificationScore += 10;
    evidence.push("recognized_commerce_source");
  } else {
    qualificationChecks.push(
      "Commerce source needs verification."
    );
  }

  if (scoreChecks.customerUseCase) {
    qualificationScore += 15;
    evidence.push("customer_use_case");
  } else {
    qualificationChecks.push(
      "Clear customer use case needs verification."
    );
  }

  if (scoreChecks.contentPotential) {
    qualificationScore += 20;
    evidence.push("content_potential");
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
    scoreChecks.cleanDetails &&
    recognizedSource &&
    qualificationScore >= 85
  ) {
    qualification = "QUALIFIED";
  } else if (
    title &&
    url &&
    qualificationScore >= 50
  ) {
    qualification = "NEEDS_VERIFICATION";
  } else {
    qualification = "REJECTED";
    }

  const contentAngles = [];

if (title) {
  contentAngles.push(
    "Problem hook: show the everyday problem this product solves in the first 2 seconds."
  );

  contentAngles.push(
    "Demonstration: show the product solving a real-world use case with a fast visual payoff."
  );

  contentAngles.push(
    "Curiosity hook: show the product first, then reveal why someone would actually want it."
  );

  contentAngles.push(
    "Who is this for?: demonstrate the specific type of customer who could benefit from the product."
  );

  contentAngles.push(
    "Quick comparison: explain the practical reason someone might consider this product."
  );
}
    const videoConcepts = [];

  if (title) {
    videoConcepts.push({
      format:
        "Problem-to-solution short",
      durationSeconds:
        20,
      hook:
        "You might not realize this product can solve this everyday problem.",
      script:
        "Show the problem first. Introduce " +
        title +
        ". Demonstrate the relevant use case quickly. End by showing the practical result.",
      onScreenText:
        "Problem → Product → Result",
      callToAction:
        "See the product details through the link.",
      disclosure:
        "#ad #CommissionsEarned"
    });

    videoConcepts.push({
      format:
        "3-second curiosity short",
      durationSeconds:
        15,
      hook:
        "Wait until you see what this product is designed to do.",
      script:
        "Open with the most visually interesting use case. Show " +
        title +
        " in action. Explain one useful benefit supported by the product evidence.",
      onScreenText:
        "What does this actually do?",
      callToAction:
        "Check out the product through the link.",
      disclosure:
        "#ad #CommissionsEarned"
    });

    videoConcepts.push({
      format:
        "Who is this for?",
      durationSeconds:
        20,
      hook:
        "This could be useful if you deal with this every day.",
      script:
        "Identify the customer problem. Show " +
        title +
        " solving that problem. Explain who the product may be useful for using only verified product information.",
      onScreenText:
        "Who is this for?",
      callToAction:
        "See the product details through the link.",
      disclosure:
        "#ad #CommissionsEarned"
    });
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
  "Affiliate eligibility not independently verified.",
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
