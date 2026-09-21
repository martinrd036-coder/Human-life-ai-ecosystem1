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
      type: "auto"
    })
  });

  if (!response.ok) {
    throw new Error("Exa API returned " + response.status);
  }

  return response.json();
}

function normalizeExaResults(data) {
  const results = Array.isArray(data.results) ? data.results : [];

  return results.map(result => ({
    title: result.title || "Untitled",
    url: result.url || "",
    publishedDate: result.publishedDate || "",
    author: result.author || "",
    source: result.url ? new URL(result.url).hostname : "Unknown",
    description: result.text || ""
  }));
}

async function researchOpportunities(topic) {
  const query = topic ||
    "legitimate ways to make money online official affiliate creator freelance remote work opportunities";

  const data = await exaSearch(query, 10);

  return {
    query,
    results: normalizeExaResults(data),
    searchedAt: new Date().toISOString()
  };
}

module.exports = {
  exaSearch,
  normalizeExaResults,
  researchOpportunities
};
