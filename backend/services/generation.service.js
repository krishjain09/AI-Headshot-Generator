const { runPuLID, PROMPT_TEMPLATES } = require("./replicate.service");

const { uploadUrlToCloudinary } = require("./cloudinary.service");
const { sessionStore } = require("../utils/sessionStore");
const { logger } = require("../utils/logger");

/**
 * AI HEADSHOT GENERATION PIPELINE
 *
 * FLOW:
 * Upload Photos
 *      ↓
 * Choose Best Face
 *      ↓
 * PuLID Identity Preservation
 *      ↓
 * Generate LinkedIn Headshots
 *      ↓
 * Save To Cloudinary
 */

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runGenerationPipeline(
  sessionId,
  bestImages,
  style = "corporate",
) {
  logger.info(`[Pipeline] Starting session ${sessionId}`);

  // ============================================================
  // GET PROMPTS
  // ============================================================

  const prompts = PROMPT_TEMPLATES[style] || PROMPT_TEMPLATES.corporate;

  // ============================================================
  // BEST FACE IMAGE
  // ============================================================
  console.log(bestImages);
  const primaryFaceUrl = bestImages[0]?.url;

  if (!primaryFaceUrl) {
    throw new Error("No valid face image found");
  }

  logger.info(`[Pipeline] Using face: ${primaryFaceUrl}`);

  const generatedImages = [];

  // ============================================================
  // GENERATE 3 HEADSHOTS
  // ============================================================

  const selectedPrompts = prompts.slice(0, 6);

  for (const [i, basePrompt] of selectedPrompts.entries()) {
    try {
      logger.info(`[Pipeline] Generation ${i + 1}/6`);

      // ============================================================
      // FINAL PROMPT
      // ============================================================

      const finalPrompt = `
          professional linkedin corporate headshot,
          same person as reference image,
          male,
          business suit,
          realistic face,
          office background,
          professional photography,
          natural skin texture,
          sharp focus,
          high quality,
          ${basePrompt}
          `;

      // ============================================================
      // RUN PULID
      // ============================================================

      const outputUrl = await runPuLID({
        faceImageUrl: primaryFaceUrl,
        prompt: finalPrompt,
      });

      logger.info(`[Pipeline] PuLID output received`);

      console.log(outputUrl.href);
      console.log(typeof outputUrl);
      // ============================================================
      // MOST PULID MODELS RETURN ARRAY
      // ============================================================

      // ============================================================
      // UPLOAD TO CLOUDINARY
      // ============================================================

      logger.info(`[Pipeline] Uploading to Cloudinary`);

      const cloudResult = await uploadUrlToCloudinary(outputUrl.href, {
        folder: `headshots/generated/${sessionId}`,
        public_id: `${sessionId}_pulid_${i}`,
        overwrite: true,
      });

      // ============================================================
      // GENERATED IMAGE OBJECT
      // ============================================================

      const generated = {
        url: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        model: "PuLID",
        prompt: basePrompt,
        index: generatedImages.length,
      };

      generatedImages.push(generated);

      // ============================================================
      // LIVE SESSION UPDATE
      // ============================================================

      sessionStore.update(sessionId, {
        generatedImages: [...generatedImages],
      });

      logger.info(`[Pipeline] Generation ${i + 1} completed`);

      // ============================================================
      // RATE LIMIT SAFETY
      // ============================================================

      await delay(15000);
    } catch (err) {
      logger.error(`[Pipeline] Generation ${i + 1} failed: ${err.message}`);
    }
  }

  // ============================================================
  // FINAL VALIDATION
  // ============================================================

  if (generatedImages.length === 0) {
    throw new Error("All generations failed");
  }

  // ============================================================
  // COMPLETE SESSION
  // ============================================================

  sessionStore.update(sessionId, {
    status: "completed",
    generatedImages,
  });

  logger.info(
    `[Pipeline] Completed session ${sessionId} with ${generatedImages.length} images`,
  );

  return generatedImages;
}

module.exports = {
  runGenerationPipeline,
};
