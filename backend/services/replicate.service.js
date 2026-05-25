const Replicate = require("replicate");
const { logger } = require("../utils/logger");

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// ─── Model identifiers
// FLUX.1 [pro] – highest quality text-to-image
const FLUX_PRO_MODEL = "black-forest-labs/flux-2-pro";

// InstantID – face-consistent portrait generation
// Requires: face_image input + prompt
const PULID_MODEL =
  "bytedance/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b";

// ─── Prompt templates ─────────────────────────────────────────────────────────
const PROMPT_TEMPLATES = {
  corporate: [
    "professional linkedin headshot, navy blue business suit, white dress shirt, modern corporate office background, soft studio lighting, shallow depth of field, realistic skin texture, premium corporate photography, ultra realistic",

    "corporate executive portrait, charcoal tailored suit, luxury office interior, natural window lighting, clean professional look, realistic facial details, linkedin profile photo, ultra realistic",

    "business professional headshot, formal dark suit, blurred glass office background, soft diffused lighting, confident expression, realistic skin texture, premium business photography",

    "professional office portrait, dark navy suit and tie, elegant modern workspace background, cinematic soft lighting, sharp facial focus, realistic portrait photography, linkedin style",

    "corporate linkedin portrait, formal business attire, warm office lighting, realistic face detail, clean luxury office environment, premium professional headshot, ultra realistic",

    "executive business portrait, black tailored suit, sophisticated office background, soft natural lighting, shallow depth of field, high-end corporate photography, realistic skin texture",
  ],

  startup: [
    "professional tech startup headshot, black blazer over dark t-shirt, modern startup office background, soft natural lighting, realistic skin texture, premium linkedin profile photo, ultra realistic",

    "startup founder portrait, smart casual outfit, modern coworking space background, clean ambient lighting, realistic facial features, shallow depth of field, professional photography",

    "tech entrepreneur headshot, modern business casual outfit, futuristic office background, soft daylight lighting, realistic skin texture, linkedin ready portrait, ultra realistic",

    "creative startup professional portrait, dark casual blazer, modern glass office environment, warm natural lighting, realistic face detail, premium business photography",

    "modern tech professional headshot, black t-shirt with fitted blazer, minimal startup office background, soft cinematic lighting, realistic portrait photography, linkedin style",

    "startup linkedin portrait, smart casual professional look, clean tech office background, shallow depth of field, realistic facial details, premium AI headshot photography",
  ],

  executive: [
    "luxury executive headshot, premium black business suit, elegant office background, soft studio lighting, realistic skin texture, powerful professional expression, ultra realistic corporate portrait",

    "CEO portrait, dark charcoal suit and tie, luxury corporate office interior, cinematic soft lighting, realistic facial details, premium executive photography, linkedin profile style",

    "executive leadership headshot, formal navy business suit, high-end office background, natural lighting, shallow depth of field, realistic portrait photography",

    "boardroom executive portrait, formal luxury attire, modern conference room background, soft dramatic lighting, ultra realistic skin texture, premium corporate photography",

    "professional executive linkedin portrait, black tailored suit, sophisticated office environment, realistic face detail, cinematic business lighting, ultra realistic",

    "luxury business portrait, premium formal attire, elegant glass office background, warm soft lighting, realistic portrait photography, high-end executive headshot",
  ],
};

const NEGATIVE_PROMPT =
  "blurry, out of focus, soft focus, motion blur, bokeh on face, hazy, foggy, low resolution, pixelated, grainy, noisy, jpeg artifacts, overexposed, underexposed, washed out, cartoon, illustration, painting, drawing, anime, CGI, 3D render, plastic skin, waxy skin, doll face, mask-like, deformed face, asymmetrical face, bad eyes, crossed eyes, extra limbs, bad anatomy, mutation, watermark, text, logo, signature, timestamp, border, frame, multiple people, duplicate face";
/**
 * Run a single prediction using FLUX Pro (text-to-image, high quality).
 * Best for: clean headshots with custom backgrounds.
 */
async function runFluxPro({
  prompt,
  aspectRatio = "1:1",
  outputFormat = "webp",
}) {
  logger.info(`Running FLUX Pro: "${prompt.slice(0, 60)}…"`);

  const output = await replicate.run(FLUX_PRO_MODEL, {
    input: {
      prompt,
      aspect_ratio: aspectRatio,
      output_format: outputFormat,
      output_quality: 100,
      safety_tolerance: 5,
      prompt_upsampling: true,
    },
  });

  // FLUX Pro returns a URL or array of URLs
  const url = Array.isArray(output) ? output[0] : output;

  console.log("Type of FLUX Pro output:", typeof output);
  console.log("FLUX Pro output:", url);

  const finalUrl = url.toString();

  logger.info(`FLUX Pro output: ${finalUrl}`);

  return finalUrl;
}

/**
 * Run InstantID – face-consistent generation using a reference face image.
 * Best for: preserving likeness while changing background/attire.
 */
async function runPuLID({ faceImageUrl, prompt }) {
  logger.info(`Running PuLID with face: ${faceImageUrl}`);

  const output = await replicate.run(PULID_MODEL, {
    input: {
      main_face_image: faceImageUrl,

      prompt,

      // ✅ ADD negative prompt
      negative_prompt: NEGATIVE_PROMPT,

      width: 1024,
      height: 1024,

      // ✅ More steps = sharper, more detailed output
      num_inference_steps: 35,

      // ✅ Higher guidance = stronger prompt adherence
      guidance_scale: 7.0,

      // ✅ true_cfg balances realism vs prompt
      true_cfg_scale: 1.5,

      // ✅ Lower id_weight = less face distortion, still preserves identity
      id_weight: 0.9,

      // ✅ Full prompt length — your prompts are long!
      max_sequence_length: 256,
    },
  });

  const fileOutput = Array.isArray(output) ? output[0] : output;
  const url = fileOutput.url();
  logger.info(`PuLID output: ${url}`);
  return url;
}

/**
 * Wait for a Replicate prediction to complete (polling).
 * Use this if you create predictions manually via replicate.predictions.create().
 */
async function waitForPrediction(
  predictionId,
  intervalMs = 3000,
  maxWaitMs = 300000,
) {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const prediction = await replicate.predictions.get(predictionId);

    if (prediction.status === "succeeded") {
      return prediction.output;
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(
        `Prediction ${predictionId} ${prediction.status}: ${prediction.error}`,
      );
    }

    logger.info(`Prediction ${predictionId} status: ${prediction.status}`);
    await sleep(intervalMs);
  }

  throw new Error(
    `Prediction ${predictionId} timed out after ${maxWaitMs / 1000}s`,
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  runFluxPro,
  runPuLID,
  waitForPrediction,
  PROMPT_TEMPLATES,
  NEGATIVE_PROMPT,
};
