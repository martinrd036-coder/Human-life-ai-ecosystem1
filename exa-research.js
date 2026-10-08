const providerHealth = {
  exa: {
    status: "UNKNOWN",
    lastError: "",
    failedAt: null,
    retryAfter: 0
  },
    tavily: {
    status: "UNKNOWN",
    lastError: "",
    failedAt: null,
    retryAfter: 0
  },
  serper: {
    status: "UNKNOWN",
    lastError: "",
    failedAt: null,
    retryAfter: 0
  }
};

const PROVIDER_COOLDOWN_MS =
  60 * 60 * 1000;

function providerIsAvailable(provider) {
  const health =
    providerHealth[provider];

  if (!health) {
    return false;
  }

  if (
    health.retryAfter &&
    Date.now() < health.retryAfter
  ) {
    return false;
  }

  return true;
}

function markProviderFailure(
  provider,
  error
) {
  const health =
    providerHealth[provider];

  if (!health) {
    return;
  }

  health.status = "UNAVAILABLE";
  health.lastError =
    error?.message ||
    "Provider request failed.";
  health.failedAt =
    new Date().toISOString();
  health.retryAfter =
    Date.now() +
    PROVIDER_COOLDOWN_MS;
}

function markProviderSuccess(
  provider
) {
  const health =
    providerHealth[provider];

  if (!health) {
    return;
  }

  health.status = "HEALTHY";
  health.lastError = "";
  health.failedAt = null;
  health.retryAfter = 0;
}

function getProviderHealth() {
  return JSON.parse(
    JSON.stringify(
      providerHealth
    )
  );
}
const RESEARCH_GOVERNOR = {
  cooldownMs:
    30 * 60 * 1000,

  maxSessions:
    8,

  sessions:
    0,

  windowStartedAt:
    Date.now(),

  lastStartedAt:
    0
};

function researchGovernor() {

  const now =
    Date.now();

  const windowMs =
    24 * 60 * 60 * 1000;

  if (
    now -
    RESEARCH_GOVERNOR.windowStartedAt
    >= windowMs
  ) {
    RESEARCH_GOVERNOR.sessions =
      0;

    RESEARCH_GOVERNOR.windowStartedAt =
      now;
  }

  if (
    RESEARCH_GOVERNOR.sessions >=
    RESEARCH_GOVERNOR.maxSessions
  ) {
    throw new Error(
      "Research governor limit reached. Research paused until the next 24-hour window."
    );
  }

  if (
    RESEARCH_GOVERNOR.lastStartedAt &&
    now -
    RESEARCH_GOVERNOR.lastStartedAt
    <
    RESEARCH_GOVERNOR.cooldownMs
  ) {
    throw new Error(
      "Research governor cooldown active. Research paused to protect provider usage."
    );
  }

  RESEARCH_GOVERNOR.sessions++;

  RESEARCH_GOVERNOR.lastStartedAt =
    now;

  return {
    allowed:true,
    sessionsUsed:
      RESEARCH_GOVERNOR.sessions,
    sessionsRemaining:
      RESEARCH_GOVERNOR.maxSessions -
      RESEARCH_GOVERNOR.sessions
  };
}
async function exaSearch(
  query,
  numResults = 10,
  includeDomains = []
) {
  if (!providerIsAvailable("exa")) {
    throw new Error(
      "Exa provider is temporarily unavailable."
    );
  }

  const apiKey =
    process.env.EXA_API_KEY;

  if (!apiKey) {
    const error =
      new Error(
        "EXA_API_KEY is not configured."
      );

    markProviderFailure(
      "exa",
      error
    );

    throw error;
  }

  const body = {
    query,
    numResults,
    type: "auto",
    contents: {
      text: {
        maxCharacters: 2000
      }
    }
  };

  if (
    Array.isArray(includeDomains) &&
    includeDomains.length > 0
  ) {
    body.includeDomains =
      includeDomains;
  }

  try {
    const response =
      await fetch(
        "https://api.exa.ai/search",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "x-api-key":
              apiKey
          },
          body:
            JSON.stringify(body)
        }
      );

    if (!response.ok) {
      throw new Error(
        "Exa API returned " +
        response.status
      );
    }

    const data =
      await response.json();

    markProviderSuccess(
      "exa"
    );

    return data;

  } catch (error) {

    markProviderFailure(
      "exa",
      error
    );

    throw error;
  }
}

async function tavilySearch(
  query,
  numResults = 10,
  includeDomains = []
) {
  const apiKey =
    process.env.TAVILY_API_KEY;

  if (!apiKey) {
    providerHealth.tavily.status =
      "NOT_CONFIGURED";
    providerHealth.tavily.lastError =
      "TAVILY_API_KEY is not configured.";
    providerHealth.tavily.failedAt = null;
    providerHealth.tavily.retryAfter = 0;

    throw new Error(
      "TAVILY_API_KEY is not configured."
    );
  }

  if (!providerIsAvailable("tavily")) {
    throw new Error(
      "Tavily provider is temporarily unavailable."
    );
  }

  const body = {
    api_key: apiKey,
    query,
    search_depth: "basic",
    max_results: numResults,
    include_answer: false,
    include_raw_content: false
  };

  if (
    Array.isArray(includeDomains) &&
    includeDomains.length > 0
  ) {
    body.include_domains =
      includeDomains;
  }

  try {
    const response =
      await fetch(
        "https://api.tavily.com/search",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(body)
        }
      );

    if (!response.ok) {
      throw new Error(
        "Tavily API returned " +
        response.status
      );
    }

    const data =
      await response.json();

    markProviderSuccess(
      "tavily"
    );

    return data;

  } catch (error) {

    markProviderFailure(
      "tavily",
      error
    );

    throw error;
  }
}


function normalizeSearchResults(
  data,
  provider = "unknown"
) {
  const results = Array.isArray(data?.results)
    ? data.results
    : [];

  return results.map(result => ({
    title:
      result.title ||
      "Untitled",

    url:
      result.url ||
      "",

    publishedDate:
      result.publishedDate ||
      result.published_date ||
      "",

    author:
      result.author ||
      "",

    source:
      result.url
        ? new URL(result.url).hostname
        : "Unknown",

    description:
      result.text ||
      result.content ||
      result.description ||
      (
        Array.isArray(result.highlights)
          ? result.highlights.join(" ")
          : ""
      ) ||
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
async function serperSearch(
  query,
  numResults = 10,
  includeDomains = []
) {
  const apiKey =
    process.env.SERPER_API_KEY;

  if (!apiKey) {
    providerHealth.serper.status =
      "NOT_CONFIGURED";
    providerHealth.serper.lastError =
      "SERPER_API_KEY is not configured.";
    providerHealth.serper.failedAt = null;
    providerHealth.serper.retryAfter = 0;

    throw new Error(
      "SERPER_API_KEY is not configured."
    );
  }

  if (!providerIsAvailable("serper")) {
    throw new Error(
      "Serper provider is temporarily unavailable."
    );
  }

  const body = {
    q: query,
    num: numResults
  };

  if (
    Array.isArray(includeDomains) &&
    includeDomains.length > 0
  ) {
    body.site =
      includeDomains
        .map(domain =>
          "site:" + domain
        )
        .join(" OR ");
  }

  try {
    const response =
      await fetch(
        "https://google.serper.dev/search",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "X-API-KEY":
              apiKey
          },
          body:
            JSON.stringify(body)
        }
      );

    if (!response.ok) {
      throw new Error(
        "Serper API returned " +
        response.status
      );
    }

    const data =
      await response.json();

    markProviderSuccess(
      "serper"
    );

    return {
      results:
        Array.isArray(data?.organic)
          ? data.organic
          : []
    };

  } catch (error) {

    markProviderFailure(
      "serper",
      error
    );

    throw error;
  }
}

function normalizeExaResults(data) {
  return normalizeSearchResults(
    data,
    "exa"
  );
}


function normalizeTavilyResults(data) {
  return normalizeSearchResults(
    data,
    "tavily"
  );
}
function normalizeSerperResults(data) {
  const results =
    Array.isArray(data?.results)
      ? data.results
      : [];

  return results.map(result => ({
    title:
      result.title ||
      "Untitled",

    url:
      result.link ||
      "",

    publishedDate:
      result.date ||
      "",

    author:
      "",

    source:
      result.link
        ? new URL(result.link).hostname
        : "Unknown",

    description:
      result.snippet ||
      "",

    highlights:
      [],

    score:
      null,

    provider:
      "serper"
  }));
}

function sourcePriority(url = "") {
  if (!url) {
    return 0;
  }

  try {
    const host =
      new URL(url)
        .hostname
        .toLowerCase();

        const authoritativeDomains = [
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
      "linkedin.com",
      "openai.com",
      "anthropic.com",
      "google.com",
      "microsoft.com",
      "meta.com",
      "stripe.com",
      "hubspot.com",
      "semrush.com"
    ];

    const recognizedResearchDomains = [
      "openai.com",
      "anthropic.com",
      "google.com",
      "microsoft.com",
      "meta.com",
      "stripe.com",
      "hubspot.com",
      "semrush.com",
      "reddit.com"
    ];

    if (
      authoritativeDomains.some(domain =>
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


function hasUsefulResults(data) {
  const results = Array.isArray(data?.results)
    ? data.results
    : [];

  const usable = results.filter(
    result =>
      Boolean(result?.url) &&
      Boolean(result?.title)
  );

  const authoritative = usable.filter(
    result =>
      sourcePriority(result.url) >= 3
  );

  return {
    usableCount: usable.length,
    authoritativeCount:
      authoritative.length,
    strong:
      usable.length >= 5 &&
      authoritative.length >= 1
  };
}


async function researchOpportunities(topic) {
    const governor =
    researchGovernor();
  const query =
    topic ||
    "legitimate ways to make money online through AI automation, affiliate programs, creator programs, freelance work, remote jobs, digital products, and reputable opportunities";

  const officialQuery =
    query +
    " official program official company official terms requirements eligibility fees";

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
  "linkedin.com",
  "usa.gov",
  "usajobs.gov",
  "dol.gov",
  "bls.gov",
  "openai.com",
  "anthropic.com",
  "google.com",
  "microsoft.com",
  "meta.com",
  "stripe.com",
  "hubspot.com",
  "semrush.com"
];

  const officialSearchQuery =
    officialQuery +
    " official source";

  let officialData;
  let generalData;

  let researchProvider = "exa";
  let fallbackReason = "";

  /*
   * PRIMARY RESEARCH
   *
   * Exa performs:
   * 1. An official-source search restricted to trusted domains.
   * 2. A general discovery search.
   */
  try {
    officialData = await exaSearch(
      officialSearchQuery,
      10,
      officialDomains
    );

    generalData = await exaSearch(
      query,
      10
    );

    const officialQuality =
      hasUsefulResults(
        officialData
      );

    const generalQuality =
      hasUsefulResults(
        generalData
      );
        /*
     * QUALITY FALLBACK
     *
     * Exa remains the primary research provider.
     * Use Tavily first when configured.
     * If Tavily fails, use Serper when configured.
     * If both fail, preserve the Exa results.
     */
    if (
      !officialQuality.strong ||
      !generalQuality.strong
    ) {
      const reasons = [];

      if (!officialQuality.strong) {
        reasons.push(
          "Exa official-source results were insufficient."
        );
      }

      if (!generalQuality.strong) {
        reasons.push(
          "Exa general research results were insufficient."
        );
      }

      fallbackReason =
        reasons.join(" ");

      const tavilyConfigured =
        Boolean(process.env.TAVILY_API_KEY);

      const serperConfigured =
        Boolean(process.env.SERPER_API_KEY);

      if (
        tavilyConfigured
      ) {
        try {
          const fallbackOfficialData =
            await tavilySearch(
              officialQuery,
              10,
              officialDomains
            );

          const fallbackGeneralData =
            await tavilySearch(
              query,
              10
            );

          const exaOfficialResults =
            normalizeExaResults(
              officialData
            );

          const exaGeneralResults =
            normalizeExaResults(
              generalData
            );

          const tavilyOfficialResults =
            normalizeTavilyResults(
              fallbackOfficialData
            );

          const tavilyGeneralResults =
            normalizeTavilyResults(
              fallbackGeneralData
            );

          officialData = {
            results: [
              ...exaOfficialResults,
              ...tavilyOfficialResults
            ]
          };

          generalData = {
            results: [
              ...exaGeneralResults,
              ...tavilyGeneralResults
            ]
          };

          researchProvider =
            "exa+tavily_quality_fallback";

        } catch (tavilyError) {
          fallbackReason +=
            ` Tavily fallback failed (${tavilyError?.message || "unknown error"}).`;

          if (
            serperConfigured
          ) {
            try {
              const serperOfficialData =
                await serperSearch(
                  officialQuery,
                  10,
                  officialDomains
                );

              const serperGeneralData =
                await serperSearch(
                  query,
                  10
                );

              const exaOfficialResults =
                normalizeExaResults(
                  officialData
                );

              const exaGeneralResults =
                normalizeExaResults(
                  generalData
                );

              const serperOfficialResults =
                normalizeSerperResults(
                  serperOfficialData
                );

              const serperGeneralResults =
                normalizeSerperResults(
                  serperGeneralData
                );

              officialData = {
                results: [
                  ...exaOfficialResults,
                  ...serperOfficialResults
                ]
              };

              generalData = {
                results: [
                  ...exaGeneralResults,
                  ...serperGeneralResults
                ]
              };

              researchProvider =
                "exa+serper_quality_fallback";

            } catch (serperError) {
              fallbackReason +=
                ` Serper fallback failed (${serperError?.message || "unknown error"}); Exa results retained.`;

              researchProvider =
                "exa";
            }
          } else {
            fallbackReason +=
              " Serper fallback skipped because SERPER_API_KEY is not configured.";

            researchProvider =
              "exa";
          }
        }

      } else if (
        serperConfigured
      ) {
        try {
          const serperOfficialData =
            await serperSearch(
              officialQuery,
              10,
              officialDomains
            );

          const serperGeneralData =
            await serperSearch(
              query,
              10
            );

          const exaOfficialResults =
            normalizeExaResults(
              officialData
            );

          const exaGeneralResults =
            normalizeExaResults(
              generalData
            );

          const serperOfficialResults =
            normalizeSerperResults(
              serperOfficialData
            );

          const serperGeneralResults =
            normalizeSerperResults(
              serperGeneralData
            );

          officialData = {
            results: [
              ...exaOfficialResults,
              ...serperOfficialResults
            ]
          };

          generalData = {
            results: [
              ...exaGeneralResults,
              ...serperGeneralResults
            ]
          };

          researchProvider =
            "exa+serper_quality_fallback";

        } catch (serperError) {
          fallbackReason +=
            ` Serper fallback failed (${serperError?.message || "unknown error"}); Exa results retained.`;

          researchProvider =
            "exa";
        }

      } else {
        fallbackReason +=
          " Tavily and Serper fallbacks are not configured; Exa results retained.";

        researchProvider =
          "exa";
      }
    }
    } catch (exaError) {
    /*
     * FULL EXA FAILURE
     *
     * Exa is the primary provider.
     * If Exa fails completely:
     * 1. Try Tavily when configured.
     * 2. If Tavily fails, try Serper.
     * 3. If Serper is unavailable or fails,
     *    preserve the original Exa failure.
     */

    fallbackReason =
      exaError?.message ||
      "Exa request failed.";

    const tavilyConfigured =
      Boolean(process.env.TAVILY_API_KEY);

    const serperConfigured =
      Boolean(process.env.SERPER_API_KEY);

    if (tavilyConfigured) {
      try {
        officialData =
          await tavilySearch(
            officialQuery,
            10,
            officialDomains
          );

        generalData =
          await tavilySearch(
            query,
            10
          );

        researchProvider =
          "tavily_fallback";

      } catch (tavilyError) {
        fallbackReason +=
          ` Tavily full fallback failed (${tavilyError?.message || "unknown error"}).`;

        if (serperConfigured) {
          try {
            officialData =
              await serperSearch(
                officialQuery,
                10,
                officialDomains
              );

            generalData =
              await serperSearch(
                query,
                10
              );

            researchProvider =
              "serper_fallback";

          } catch (serperError) {
            fallbackReason +=
              ` Serper full fallback failed (${serperError?.message || "unknown error"}).`;

            throw exaError;
          }

        } else {
          fallbackReason +=
            " Serper fallback skipped because SERPER_API_KEY is not configured.";

          throw exaError;
        }
      }

    } else if (serperConfigured) {
      try {
        officialData =
          await serperSearch(
            officialQuery,
            10,
            officialDomains
          );

        generalData =
          await serperSearch(
            query,
            10
          );

        researchProvider =
          "serper_fallback";

      } catch (serperError) {
        fallbackReason +=
          ` Serper full fallback failed (${serperError?.message || "unknown error"}).`;

        throw exaError;
      }

    } else {
      throw exaError;
    }
  }
    if (
    researchProvider ===
    "tavily_fallback"
  ) {
    officialResults =
      normalizeTavilyResults(
        officialData
      );

    generalResults =
      normalizeTavilyResults(
        generalData
      );

  } else if (
    researchProvider ===
    "serper_fallback"
  ) {
    officialResults =
      normalizeSerperResults(
        officialData
      );

    generalResults =
      normalizeSerperResults(
        generalData
      );

  } else if (
    researchProvider ===
    "exa+tavily_quality_fallback" ||
    researchProvider ===
    "exa+serper_quality_fallback"
  ) {
    officialResults =
      officialData.results || [];

    generalResults =
      generalData.results || [];

  } else {
    officialResults =
      normalizeExaResults(
        officialData
      );

    generalResults =
      normalizeExaResults(
        generalData
      );
  }
  /*
   * COMBINE + DEDUPLICATE
   */
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
    searchedAt:
      new Date().toISOString()
  };

}
      
module.exports = {
  exaSearch,
  tavilySearch,
  serperSearch,
  normalizeExaResults,
  normalizeTavilyResults,
  normalizeSerperResults,
  getProviderHealth,
  sourcePriority,
  researchOpportunities
};
