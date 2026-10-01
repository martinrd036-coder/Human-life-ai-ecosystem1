async function exaSearch(query, numResults = 10) {
  const apiKey = process.env.EXA_API_KEY;

  if (!apiKey) {
    throw new Error("EXA_API_KEY is not configured.");
  }

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify({
      query,
      numResults,
      type: "auto",
      contents: {
        text: {
          maxCharacters: 2000
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error("Exa API returned " + response.status);
  }

  return response.json();
}

async function tavilySearch(query, numResults = 10, includeDomains = []) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not configured.");
  }

  const body = {
    api_key: apiKey,
    query,
    search_depth: "basic",
    max_results: numResults,
    include_answer: false,
    include_raw_content: false
  };

  if (Array.isArray(includeDomains) && includeDomains.length > 0) {
    body.include_domains = includeDomains;
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error("Tavily API returned " + response.status);
  }

  return response.json();
}

function normalizeSearchResults(data, provider = "unknown") {
  const results = Array.isArray(data?.results)
    ? data.results
    : [];

  return results.map(result => ({
    title: result.title || "Untitled",
    url: result.url || "",
    publishedDate:
      result.publishedDate ||
      result.published_date ||
      "",
    author: result.author || "",
    source: result.url
      ? new URL(result.url).hostname
      : "Unknown",

    description:
      result.text ||
      result.content ||
      result.description ||
      result.highlights?.join(" ") ||
      "",

    highlights:
      Array.isArray(result.highlights)
        ? result.highlights
        : [],

    score:
      typeof result.score === "number"
        ? result.score
        : null,

    provider
  }));
}

function normalizeExaResults(data) {
  return normalizeSearchResults(data, "exa");
}

function normalizeTavilyResults(data) {
  return normalizeSearchResults(data, "tavily");
}

function sourcePriority(url = "") {
  if (!url) return 0;

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

    const recognizedResearchDomains = [
      "openai.com",
      "anthropic.com",
      "google.com",
      "microsoft.com",
      "meta.com",
      "stripe.com",
      "hubspot.com",
      "semrush.com"
    ];

    if (
      officialDomains.some(domain =>
        host === domain ||
        host.endsWith(domain)
      )
    ) {
      return 3;
    }

    if (
      recognizedResearchDomains.some(domain =>
        host === domain ||
        host.endsWith(domain)
      )
    ) {
      return 2;
    }

    return 1;
  } catch (e) {
    return 0;
  }
}

async function researchOpportunities(topic) {
  const query = topic ||
    "legitimate ways to make money online through AI automation, affiliate programs, creator programs, freelance work, remote jobs, digital products, and reputable opportunities";

  const officialQuery =
    query +
    " official program official company official terms requirements eligibility fees";

  const officialSearchQuery =
    officialQuery +
    " site:amazon.com OR site:youtube.com OR site:tiktok.com OR site:walmart.com OR site:etsy.com OR site:ebay.com OR site:shopify.com OR site:upwork.com OR site:fiverr.com OR site:linkedin.com OR site:gov";

  const officialDomains = [
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

  let officialData;
  let generalData;

  let researchProvider = "exa";
  let fallbackReason = "";

  try {
    officialData = await exaSearch(
      officialSearchQuery,
      10
    );

    generalData = await exaSearch(
      query,
      10
    );
  } catch (exaError) {
    fallbackReason =
      exaError?.message ||
      "Exa request failed.";

    officialData = await tavilySearch(
      officialQuery,
      10,
      officialDomains
    );

    generalData = await tavilySearch(
      query,
      10
    );

    researchProvider = "tavily_fallback";
  }

  const officialResults =
    researchProvider === "tavily_fallback"
      ? normalizeTavilyResults(officialData)
      : normalizeExaResults(officialData);

  const generalResults =
    researchProvider === "tavily_fallback"
      ? normalizeTavilyResults(generalData)
      : normalizeExaResults(generalData);

  const seen = new Set();

  const combinedResults = [
    ...officialResults,
    ...generalResults
  ]
    .filter(result => {
      const key =
        result.url ||
        result.title;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((a, b) =>
      sourcePriority(b.url) -
      sourcePriority(a.url)
    )
    .slice(0, 10);

  return {
    query,
    results: combinedResults,
    researchProvider,
    fallbackReason,
    searchedAt: new Date().toISOString()
  };
}

module.exports = {
  exaSearch,
  tavilySearch,
  normalizeExaResults,
  normalizeTavilyResults,
  sourcePriority,
  researchOpportunities
};
