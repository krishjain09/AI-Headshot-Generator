const {
  runFluxPro,
  runInstantID,
  PROMPT_TEMPLATES,
} = require("./replicate.service");

const { uploadUrlToCloudinary } = require("./cloudinary.service");
const { sessionStore } = require("../utils/sessionStore");
const { logger } = require("../utils/logger");

/**
 * Core AI generation pipeline.
 *
 * Strategy:
 * 1. Use InstantID with the best face reference image
 * 2. Use FLUX Pro for premium generations
 * 3. Store generated images in Cloudinary
 
 */

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runGenerationPipeline(
  sessionId,
  bestImages,
  style = "corporate",
) {
  logger.info(`[Pipeline] Starting for session ${sessionId}, style: ${style}`);

  const prompts = PROMPT_TEMPLATES[style] || PROMPT_TEMPLATES.corporate;

  const primaryFaceUrl = bestImages[0]?.url;

  const generatedImages = [];

  // ─────────────────────────────────────────────────────────────
  // Phase 1: InstantID
  // ─────────────────────────────────────────────────────────────

  // if (primaryFaceUrl) {
  //   logger.info(`[Pipeline] Phase 1: InstantID with ${primaryFaceUrl}`);

  //   const instantIdPrompts = prompts.slice(0, 3);
  //   console.log(instantIdPrompts.entries());
  //   for (const [i, prompt] of instantIdPrompts.entries()) {
  //     try {
  //       logger.info(`[Pipeline] InstantID generation ${i + 1}/3`);

  //       const outputUrl = await runInstantID({
  //         faceImageUrl: primaryFaceUrl,
  //         prompt: `${prompt}, (same person:1.4), detailed face, high quality`,
  //       });

  //       const cloudResult = await uploadUrlToCloudinary(outputUrl, {
  //         folder: `headshots/generated/${sessionId}`,
  //         public_id: `${sessionId}_instantid_${i}`,
  //         overwrite: true,
  //       });

  //       const generated = {
  //         url: cloudResult.secure_url,
  //         publicId: cloudResult.public_id,
  //         model: "InstantID",
  //         prompt: prompt.slice(0, 80),
  //         index: generatedImages.length,
  //       };

  //       generatedImages.push(generated);

  //       sessionStore.update(sessionId, {
  //         generatedImages: [...generatedImages],
  //       });

  //       logger.info(`[Pipeline] InstantID ${i + 1} completed`);

  //       // VERY IMPORTANT FOR FREE-TIER RATE LIMITS
  //       await delay(60000);
  //     } catch (err) {
  //       logger.warn(`[Pipeline] InstantID prompt ${i} failed: ${err.message}`);
  //     }
  //   }
  // }

  // ─────────────────────────────────────────────────────────────
  // Phase 2: FLUX Pro
  // ─────────────────────────────────────────────────────────────

  logger.info(`[Pipeline] Phase 2: FLUX Pro`);

  const fluxPrompts = prompts
    .slice(0, 3)
    .map((p) => `${p}, professional photo, shot on Canon R5, 85mm lens, f/2.8`);

  for (const [i, prompt] of fluxPrompts.entries()) {
    try {
      logger.info(`[Pipeline] FLUX generation ${i + 1}/3`);

      const outputUrl = await runFluxPro({ prompt });

      const cloudResult = await uploadUrlToCloudinary(outputUrl, {
        folder: `headshots/generated/${sessionId}`,
        public_id: `${sessionId}_flux_${i}`,
        overwrite: true,
      });

      const generated = {
        url: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        model: "FLUX Pro",
        prompt: prompt.slice(0, 80),
        index: generatedImages.length,
      };

      generatedImages.push(generated);

      sessionStore.update(sessionId, {
        generatedImages: [...generatedImages],
      });

      logger.info(`[Pipeline] FLUX ${i + 1} completed`);

      // VERY IMPORTANT FOR FREE-TIER RATE LIMITS
      await delay(20000);
    } catch (err) {
      logger.warn(`[Pipeline] FLUX prompt ${i} failed: ${err.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Finalize
  // ─────────────────────────────────────────────────────────────

  if (generatedImages.length === 0) {
    throw new Error("All generation attempts failed. Please try again.");
  }

  sessionStore.update(sessionId, {
    status: "completed",
    generatedImages,
  });

  logger.info(
    `[Pipeline] Completed session ${sessionId}: ${generatedImages.length} images generated`,
  );

  return generatedImages;
}

module.exports = {
  runGenerationPipeline,
};
