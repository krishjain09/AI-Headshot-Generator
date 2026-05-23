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
    "photorealistic linkedin headshot of the same person from reference images, navy blue tailored suit with subtle texture, crisp white dress shirt, soft diffused office lighting, shallow depth of field with blurred modern glass office background, direct confident eye contact, natural pore-level skin texture, shot on Sony A7R V with 85mm f/1.4 lens, professional neutral expression, color graded warm-neutral tones",

    "photorealistic corporate executive portrait of the same person from reference images, seated at a sleek modern office desk, natural window light from left side creating soft shadows, ultra realistic facial features preserved, calm authoritative expression, business formal attire, premium linkedin profile quality, shot on Phase One medium format camera",

    "photorealistic business professional portrait of the same person from reference images, standing near floor-to-ceiling glass office wall, luxury high-rise corporate environment visible through glass, cinematic depth of field, ultra sharp facial details, realistic skin tones, natural stance, shot on Canon R5 with 85mm lens, editorial magazine quality",

    "photorealistic linkedin headshot of the same person from reference images, arms crossed confident pose, dark charcoal tailored suit, elegant soft-lit office background, studio-quality lighting with gentle rim light, natural facial proportions fully preserved, realistic skin texture with micro detail, premium corporate headshot quality",

    "photorealistic smiling office portrait of the same person from reference images, warm approachable expression, modern open-plan workspace bokeh background, business formal attire, even soft lighting, true-to-life face reproduction, high detail hair and skin, linkedin profile quality, shot on Nikon Z9 portrait lens",

    "photorealistic half-body corporate portrait of the same person from reference images, deep navy wool suit, realistic office interior environment, warm cinematic tungsten-balanced lighting, ultra realistic skin and fabric texture, strong professional presence, premium business photography aesthetic",
  ],

  startup: [
    "photorealistic startup founder portrait of the same person from reference images, modern industrial coworking space background with soft bokeh, smart casual outfit — open collar shirt and unstructured blazer, relaxed and confident expression, natural ambient window lighting, true-to-life facial features preserved, premium editorial portrait quality",

    "photorealistic tech entrepreneur headshot of the same person from reference images, modern startup loft office environment, casual dark blazer over crew-neck tee, warm natural lighting, authentic candid-style portrait, realistic skin texture and hair detail, approachable founder energy, shot on 85mm f/1.2",

    "photorealistic creative professional portrait of the same person from reference images, minimalist white concrete workspace background, soft natural daylight from window, business casual attire, genuine relaxed expression, ultra realistic face reproduction with pore detail, shallow depth of field, clean premium headshot aesthetic",

    "photorealistic modern tech professional portrait of the same person from reference images, stylish business casual — navy chinos and fitted blazer, glass and steel startup office environment, cinematic shallow depth of field, realistic skin texture and natural hair, confident relaxed expression, editorial portrait quality",

    "photorealistic linkedin portrait of the same person from reference images, modern light-filled glass office background, natural true-to-life photography, genuine warm smile, casual professional attire, premium sharpness on face with soft bokeh background, startup founder aesthetic, shot on Sony 85mm GM lens",

    "photorealistic creative entrepreneur portrait of the same person from reference images, standing full-confidence pose, modern open coworking office environment, ultra sharp face and hair detail, realistic skin tones, soft ambient lighting, business casual styling, premium portrait photography with cinematic color grade",
  ],

  executive: [
    "photorealistic luxury executive portrait of the same person from reference images, premium dark walnut and glass office background, formal black wool business suit with silk tie, ultra realistic face and skin preserved, powerful confident CEO expression, dramatic soft studio lighting, premium linkedin headshot quality, shot on Hasselblad medium format",

    "photorealistic senior executive headshot of the same person from reference images, elegant high-end corporate office interior, professional three-point studio lighting setup, ultra realistic skin texture and facial structure preserved, sharp eyes with natural catchlight, dark navy power suit, premium portrait photography",

    "photorealistic boardroom executive portrait of the same person from reference images, luxury conference room environment with soft background bokeh, formal dark business attire, cinematic warm-cool office lighting contrast, natural realistic face with full micro-detail, authoritative calm expression, magazine cover quality photography",

    "photorealistic CEO linkedin portrait of the same person from reference images, luxury executive office background with bookshelves and city view, dark charcoal tailored suit, natural confident composed expression, ultra realistic photography preserving all facial features, premium business photography, shot on 85mm f/1.4",

    "photorealistic executive leadership portrait of the same person from reference images, seated in modern leather boardroom chair, realistic corporate interior environment, soft dramatic side lighting with gentle fill, premium business aesthetic, true-to-life face and expression, sharp suit detail, editorial quality",

    "photorealistic distinguished executive portrait of the same person from reference images, high-end mahogany and glass office environment, realistic facial bone structure and skin texture fully preserved, ultra detailed hair and fabric, professional formal attire, powerful composed expression, premium magazine-quality corporate photography, Leica portrait rendering aesthetic",
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
