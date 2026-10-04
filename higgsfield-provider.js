const {
  generate_video
}=require("@higgsfield/client");

const MODEL=
  process.env.HIGGSFIELD_MODEL ||
  "seedance_2_5";

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

async function createVideo(production){

  requireCredentials();

  const duration=
    Math.min(
      30,
      Math.max(
        4,
        Number(
          production.duration_seconds || 15
        )
      )
    );

  const result=
    await generate_video({
      params:{
        model:MODEL,
        mode:"t2v",
        prompt:buildPrompt(production),
        duration,
        aspect_ratio:"9:16",
        resolution:"720p",
        generate_audio:true
      }
    });

  const jobId=
    result?.job_ids?.[0] ||
    result?.id ||
    null;

  if(!jobId){

    throw new Error(
      "Higgsfield accepted no video generation job."
    );

  }

  return {
    provider:"higgsfield",
    model:MODEL,
    status:"GENERATING",
    providerJobId:jobId,
    videoUrl:null
  };

}

module.exports={
  createVideo
};
