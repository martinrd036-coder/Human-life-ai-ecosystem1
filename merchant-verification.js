
"use strict";

const SHOP_DOMAINS = {
  amazon: ["amazon.com"],
  walmart: ["walmart.com"],
  etsy: ["etsy.com"],
  ebay: ["ebay.com"],
  shopify: ["myshopify.com"]
};

function normalizeHost(host) {
  return String(host || "")
    .toLowerCase()
    .replace(/\.$/, "");
}

function hostMatches(host, domain) {
  return host === domain || host.endsWith("." + domain);
}

function getVerifiedShopifyDomains() {
  return String(
    process.env.SHOPIFY_VERIFIED_DOMAINS || ""
  )
    .split(",")
    .map(normalizeHost)
    .filter(Boolean);
}

function classifyProductUrl(value) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    return {
      accepted: false,
      merchant: null,
      host: "",
      reason: "Invalid product URL."
    };
  }

  if (
    !["https:", "http:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.port
  ) {
    return {
      accepted: false,
      merchant: null,
      host: "",
      reason: "Unsafe or unsupported URL format."
    };
  }

  const host = normalizeHost(parsed.hostname);

  let merchant = null;

  for (const [name, domains] of Object.entries(SHOP_DOMAINS)) {
    if (domains.some(domain => hostMatches(host, domain))) {
      merchant = name;
      break;
    }
  }

  // Custom Shopify domains must be individually approved
  // through SHOPIFY_VERIFIED_DOMAINS.
  if (!merchant) {
    const approvedShopifyDomains =
      getVerifiedShopifyDomains();

    if (approvedShopifyDomains.includes(host)) {
      merchant = "shopify";
    }
  }

  if (!merchant) {
    return {
      accepted: false,
      merchant: null,
      host,
      reason: "Merchant domain is not supported or verified."
    };
  }

  const path = parsed.pathname;

  const productPathPatterns = {
    amazon:
      /\/(?:dp|gp\/product|gp\/aw\/d)\/[A-Z0-9]{10}(?:\/|$)/i,
    walmart:
      /\/ip\/(?:[^/?#]+\/)?\d+(?:\/|$)/i,
    etsy:
      /\/listing\/\d+(?:\/|$)/i,
    ebay:
      /\/itm\/(?:[^/?#]+\/)?\d+(?:\/|$)/i,
    shopify:
      /\/products\/[^/?#]+(?:\/|$)/i
  };

  if (!productPathPatterns[merchant].test(path)) {
    return {
      accepted: false,
      merchant,
      host,
      reason: "URL does not match a supported product-page pattern."
    };
  }

  return {
    accepted: true,
    merchant,
    host,
    reason: "Supported merchant and product URL pattern."
  };
}

async function verifyProductPage(value) {
  const classification = classifyProductUrl(value);

  if (!classification.accepted) {
    return {
      ...classification,
      status: "rejected"
    };
  }

  try {
    const response = await fetch(value, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ProductResearchBot/1.0)"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000)
    });

    let finalUrl;

    try {
      finalUrl = classifyProductUrl(response.url || value);
    } catch {
      finalUrl = { accepted: false };
    }

    if (
      !finalUrl.accepted ||
      finalUrl.merchant !== classification.merchant
    ) {
      return {
        ...classification,
        status: "needs_verification",
        reason: "Redirect destination could not be verified."
      };
    }

    if (
      response.status === 404 ||
      response.status === 410
    ) {
      return {
        ...classification,
        status: "rejected",
        reason: "Product page returned a not-found response."
      };
    }

    if (!response.ok) {
      return {
        ...classification,
        status: "needs_verification",
        reason: `Store returned HTTP ${response.status}.`
      };
    }

    const html = await response.text();

    if (
      /Page Not Found|Sorry! We couldn't find that page|This item is no longer available/i
        .test(html)
    ) {
      return {
        ...classification,
        status: "rejected",
        reason: "Page content indicates the product is unavailable."
      };
    }

    const hasProductEvidence =
      /"@type"\s*:\s*\[?\s*"?Product"?/i.test(html) ||
      /"@type"\s*:\s*"Product"/i.test(html) ||
      /property=["']og:type["'][^>]*content=["']product/i.test(html) ||
      /itemtype=["'][^"']*schema\.org\/Product/i.test(html);

    return {
      ...classification,
      status: hasProductEvidence
        ? "automated_checks_passed_needs_human_review"
        : "needs_verification",
      reason: hasProductEvidence
        ? "Product-page evidence found; human review is still required."
        : "A supported URL was found, but product-page evidence was inconclusive."
    };
  } catch (error) {
    return {
      ...classification,
      status: "needs_verification",
      reason: "The product page could not be verified automatically."
    };
  }
}

module.exports = {
  classifyProductUrl,
  verifyProductPage
};
