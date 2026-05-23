const { sessionStore } = require("../utils/sessionStore");
const { runGenerationPipeline } = require("../services/generation.service");
const { logger } = require("../utils/logger");

/**
 * POST /api/generate
 * Body: { sessionId, style? }
 *
 * Kicks off the async AI generation pipeline.
 * Returns immediately with status "processing"; poll /results/:sessionId/status.
 */
async function generateHeadshots(req, res, next) {
  try {
    const { sessionId, style } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required." });
    }

    const session = sessionStore.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found. Please upload images first." });
    }

    if (session.status === "processing") {
      return res.status(409).json({
        error: "Generation already in progress.",
        sessionId,
      });
    }

    if (!session.bestImages || session.bestImages.length === 0) {
      return res.status(400).json({ error: "No reference images found for this session." });
    }

    // Mark as processing immediately so the client can start polling
    sessionStore.update(sessionId, { status: "processing", style: style || "corporate" });

    logger.info(`Starting generation pipeline for session ${sessionId}`);

    // Run async – do NOT await here; client polls for results
    runGenerationPipeline(sessionId, session.bestImages, style || "corporate").catch(
      (err) => {
        logger.error(`Generation pipeline failed for session ${sessionId}: ${err.message}`);
        sessionStore.update(sessionId, {
          status: "failed",
          error: err.message,
        });
      }
    );

    return res.status(202).json({
      sessionId,
      status: "processing",
      message: "Generation started. Poll /api/results/:sessionId/status for updates.",
      estimatedSeconds: 60,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { generateHeadshots };
