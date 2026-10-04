const {
  config,
  higgsfield
}=require("@higgsfield/client/v2");

const MODEL=
  process.env.HIGGSFIELD_MODEL ||
  "bytedance/seedance-2.0/text-to-video";

const DEFAULT_DURATION=5;
const MAX_DURATION=15;
const DEFAULT_RESOLUTION="720p";
const DEFAULT_ASPECT_RATIO="9:16";

function requireCredentials(){

  const credentials=
    process.env.HF_CREDENTIALS ||
    process.env.HF_KEY;

  if(!credentials){

    throw new Error(
      "Higgsfield is not configured. Add HF_CREDENTIALS to Railway."
    );

  }

  return credentials;
}

function buildPrompt(production){

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

async function createVideo(production={}){

  const credentials=
    requireCredentials();

  config({
    credentials
  });

  const requestedDuration=
    Number(
      production.duration_seconds ||
      DEFAULT_DURATION
    );

  const duration=
    Math.min(
      MAX_DURATION,
      Math.max(
        4,
        Math.floor(requestedDuration)
      )
    );

  const result=
    await higgsfield.subscribe(
      MODEL,
      {
        input:{
          prompt:
            buildPrompt(production),

          duration,

          resolution:
            DEFAULT_RESOLUTION,

          aspect_ratio:
            DEFAULT_ASPECT_RATIO,

          generate_audio:
            true
        },

        withPolling:
          true
      }
    );

  if(!result){

    throw new Error(
      "Higgsfield returned no generation result."
    );

  }

  if(result.status==="failed"){

    throw new Error(
      result.error ||
      "Higgsfield video generation failed."
    );

  }

  if(result.status==="nsfw"){

    throw new Error(
      "Higgsfield rejected the video generation."
    );

  }

  if(result.status==="canceled"){

    throw new Error(
      "Higgsfield video generation was canceled."
    );

  }

  const videoUrl=
    result.video?.url ||
    null;

  return {

    provider:
      "higgsfield",

    model:
      MODEL,

    status:
      result.status==="completed"
        ? "COMPLETED"
        : "GENERATING",

    providerJobId:
      result.request_id ||
      null,

    videoUrl

  };

}

module.exports={
  createVideo
};
