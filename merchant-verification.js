
async function verifyProductPage(value) {
  const classification = classifyProductUrl(value);

  if (!classification.accepted) {
    return {
      ...classification,
      status: "rejected"
    };
  }

  try {
    let currentUrl = value;
    let response;

    // Check each redirect before requesting its destination.
    for (let redirects = 0; redirects <= 4; redirects++) {
      response = await fetch(currentUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ProductResearchBot/1.0)"
        },
        redirect: "manual",
        signal: AbortSignal.timeout(8000)
      });

      const isRedirect =
        response.status >= 300 && response.status < 400;

      if (!isRedirect) break;

      const location = response.headers.get("location");

      if (!location || redirects === 4) {
        return {
          ...classification,
          status: "needs_verification",
          reason: "Redirect could not be safely verified."
        };
      }

      let nextUrl;

      try {
        nextUrl = new URL(location, currentUrl).href;
      } catch {
        return {
          ...classification,
          status: "needs_verification",
          reason: "Redirect destination was invalid."
        };
      }

      const next = classifyProductUrl(nextUrl);

      if (
        !next.accepted ||
        next.merchant !== classification.merchant
      ) {
        return {
          ...classification,
          status: "needs_verification",
          reason: "Redirect destination is not an approved product URL."
        };
      }

      currentUrl = nextUrl;
    }

    if (!response) {
      return {
        ...classification,
        status: "needs_verification",
        reason: "No response was received."
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
        : "Product-page evidence was inconclusive."
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
