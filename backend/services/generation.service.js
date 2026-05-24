const axios = require("axios");

const { runPuLID, PROMPT_TEMPLATES } = require("./replicate.service");

const {
  uploadUrlToCloudinary,
  uploadToCloudinary,
} = require("./cloudinary.service");

const { applyCornerBadge } = require("../utils/watermark");

const { sessionStore } = require("../utils/sessionStore");

const { logger } = require("../utils/logger");

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runGenerationPipeline(
  sessionId,
  bestImages,
  style = "corporate",
) {
  logger.info(`[Pipeline] Starting session ${sessionId}`);

  const prompts = PROMPT_TEMPLATES[style] || PROMPT_TEMPLATES.corporate;

  const primaryFaceUrl = bestImages[0]?.url;

  if (!primaryFaceUrl) {
    throw new Error("No valid face image found");
  }

  logger.info(`[Pipeline] Using face: ${primaryFaceUrl}`);

  const generatedImages = [];

  const selectedPrompts = prompts.slice(0, 6);

  for (const [i, basePrompt] of selectedPrompts.entries()) {
    try {
      logger.info(`[Pipeline] Generation ${i + 1}/6`);

      // ============================================================
      // RUN PULID
      // ============================================================

      const outputUrl = await runPuLID({
        faceImageUrl: primaryFaceUrl,

        prompt: basePrompt,
      });

      logger.info(`[Pipeline] PuLID output received`);

      // ============================================================
      // DOWNLOAD GENERATED IMAGE
      // ============================================================

      const response = await axios.get(outputUrl.href, {
        responseType: "arraybuffer",
      });

      const originalBuffer = Buffer.from(response.data);

      // ============================================================
      // APPLY WATERMARK
      // ============================================================

      const previewBuffer = await applyCornerBadge(originalBuffer);

      // ============================================================
      // SAVE ORIGINAL IMAGE
      // ============================================================

      logger.info(`[Pipeline] Uploading original image`);

      const originalUpload = await uploadToCloudinary(originalBuffer, {
        folder: `headshots/generated/original/${sessionId}`,

        public_id: `${sessionId}_original_${i}`,

        overwrite: true,
      });

      // ============================================================
      // SAVE WATERMARK PREVIEW
      // ============================================================

      logger.info(`[Pipeline] Uploading preview image`);

      const previewUpload = await uploadToCloudinary(previewBuffer, {
        folder: `headshots/generated/preview/${sessionId}`,

        public_id: `${sessionId}_preview_${i}`,

        overwrite: true,
      });

      // ============================================================
      // GENERATED OBJECT
      // ============================================================

      const generated = {
        previewUrl: previewUpload.secure_url,

        originalUrl: originalUpload.secure_url,

        previewPublicId: previewUpload.public_id,

        originalPublicId: originalUpload.public_id,

        model: "PuLID",

        prompt: basePrompt,

        index: generatedImages.length,
      };

      generatedImages.push(generated);

      // ============================================================
      // LIVE SESSION UPDATE
      // ============================================================

      sessionStore.update(sessionId, {
        generatedImages,
      });

      logger.info(`[Pipeline] Generation ${i + 1} completed`);

      await delay(15000);
    } catch (err) {
      logger.error(`[Pipeline] Generation ${i + 1} failed: ${err.message}`);
    }
  }

  if (generatedImages.length === 0) {
    throw new Error("All generations failed");
  }

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
