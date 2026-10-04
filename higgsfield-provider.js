const { config, higgsfield } = require("@higgsfield/client/v2");

const MODEL =
  process.env.HIGGSFIELD_MODEL ||
  "kling-video/v3.0/std/text-to-video";

function requireCredentials() {
  const credentials =
    process.env.HF_CREDENTIALS ||
    process.env.HF_KEY;

  if (!credentials) {
    throw new Error(
      "Higgsfield is not configured. Add HF_CREDENTIALS to Railway."
    );
  }

  return credentials;
}

function buildPrompt(production) {
  return [
    `Create a vertical short-form product video for ${production.product_name}.`,
    `Format: ${production.concept_format || "product promotion"}.`,
    `Hook: ${production.hook || ""}.`,
    `Script: ${production.script || ""}.`,
    `On-screen text: ${production.on_screen_text || ""}.`,
    `Call to action: ${production.call_to_action || ""}.`,
    `Disclosure: ${production.disclosure || "#ad #CommissionsEarned"}.`,
    "Do not invent product specifications, prices, guarantees, testimonials, or performance claims.",
    "Keep the presentation suitable for a social-media product promotion."
  ].join("\n");
}

async function createVideo(production) {
  const credentials = requireCredentials();

  config({
    credentials
  });

  const duration =
    Math.min(
      15,
      Math.max(
        5,
        Number(production.duration_seconds || 15)
      )
    );

  const result =
    await higgsfield.subscribe(
      MODEL,
      {
        input: {
          prompt:
            buildPrompt(production),
          duration,
          aspect_ratio:
            "9:16",
          sound:
            "on"
        },
        withPolling: true
      }
    );

  const videoUrl =
    result?.video?.url ||
    result?.video?.public_url ||
    result?.video_url ||
    result?.url ||
    null;

  if (!videoUrl) {
    throw new Error(
      "Higgsfield completed without returning a video URL."
    );
  }

  return {
    provider: "higgsfield",
    model: MODEL,
    status: "COMPLETED",
    videoUrl,
    providerJobId:
      result?.id ||
      result?.request_id ||
      null
  };
}

module.exports = {
  createVideo
};
