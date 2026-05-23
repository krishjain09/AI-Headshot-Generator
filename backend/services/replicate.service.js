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
const INSTANT_ID_MODEL =
  "zedge/instantid:ba2d5293be8794a05841a6f6eed81e810340142c3c25fab4838ff2b5d9574420";

// IP-Adapter Face ID (alternative face consistency model)
const IP_ADAPTER_MODEL = "cubiq/ip-adapter-faceid-portrait:latest";

// ─── Prompt templates ─────────────────────────────────────────────────────────
const PROMPT_TEMPLATES = {
  corporate: [
    "Professional LinkedIn headshot, corporate office background, formal navy blazer, crisp white shirt, studio lighting, ultra realistic, 4K, sharp focus, confident expression, business professional",
    "Corporate executive portrait, clean gradient background, professional attire, soft box lighting, photorealistic, high detail, polished appearance, business formal",
    "Professional headshot, modern office environment, business casual attire, natural window light, cinematic photography, ultra sharp, LinkedIn profile photo quality",
  ],
  startup: [
    "Startup founder portrait, modern co-working space background, smart casual attire, natural lighting, candid professional look, 4K photorealistic, approachable expression",
    "Tech entrepreneur headshot, premium startup office environment, casual blazer, warm ambient lighting, ultra realistic photography, confident and friendly",
    "Creative professional portrait, modern workspace, stylish business casual, beautiful bokeh background, professional photography, sharp and detailed",
  ],
  executive: [
    "C-suite executive portrait, luxury office background, premium tailored suit, dramatic studio lighting, ultra high resolution, authoritative and confident expression, professional photography",
    "Senior executive headshot, elegant office setting, formal business attire, professional lighting setup, crisp sharp details, distinguished appearance",
    "Board-level executive portrait, sophisticated background, premium business formal, cinematic lighting, ultra realistic, commanding presence, professional headshot",
  ],
};

const NEGATIVE_PROMPT =
  "cartoon, illustration, painting, drawing, art, animated, deformed, blurry, bad anatomy, bad face, mutation, extra limbs, watermark, text, logo, signature, low quality, pixelated, grainy, overexposed, underexposed";

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
async function runInstantID({
  faceImageUrl,
  prompt,
  negativePrompt = NEGATIVE_PROMPT,
}) {
  logger.info(`Running InstantID with face: ${faceImageUrl}`);

  const output = await replicate.run(INSTANT_ID_MODEL, {
    input: {
      input_image: faceImageUrl,
      prompt,
      negative_prompt: negativePrompt,
      width: 1024,
      height: 1024,
      num_inference_steps: 30,
      guidance_scale: 5,
      ip_adapter_scale: 0.8,
      controlnet_conditioning_scale: 0.8,
      enable_lcm: false,
      enhance_face_region: true,
    },
  });

  const url = Array.isArray(output) ? output[0] : output;
  logger.info(`InstantID output: ${url}`);
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
  runInstantID,
  waitForPrediction,
  PROMPT_TEMPLATES,
  NEGATIVE_PROMPT,
};
