const https = require("https");

function exaSearch(query, numResults = 10) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.EXA_API_KEY;

    if (!apiKey) {
      return reject(new Error("EXA_API_KEY is not configured."));
    }

    const body = JSON.stringify({
      query,
      numResults,
      type: "auto"
    });

    const request = https.request(
      {
        hostname: "api.exa.ai",
        path: "/search",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            return reject(
              new Error(
                `Exa API returned ${response.statusCode}: ${data}`
              )
            );
          }

          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error("Exa returned invalid JSON."));
          }
        });
      }
    );

    request.on("error", reject);

    request.write(body);
    request.end();
  });
}

function normalizeExaResults(data) {
  const results = Array.isArray(data?.results) ? data.results : [];

  return results.map((result) => ({
    title: result.title || "Untitled",
    url: result.url || "",
    publishedDate: result.publishedDate || "",
    author: result.author || "",
    source: result.url
     
