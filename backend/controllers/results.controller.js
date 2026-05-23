const { sessionStore } = require("../utils/sessionStore");
const { logger } = require("../utils/logger");

/**
 * GET /api/results/:sessionId
 * Returns the full session data including all generated image URLs.
 */
async function getResults(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    return res.status(200).json({
      sessionId,
      status: session.status,
      style: session.style || "corporate",
      uploadedImages: session.uploadedImages || [],
      generatedImages: session.generatedImages || [],
      error: session.error || null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/results/:sessionId/status
 * Lightweight polling endpoint – returns only status + progress.
 */
async function getSessionStatus(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    return res.status(200).json({
      sessionId,
      status: session.status,
      generatedCount: (session.generatedImages || []).length,
      error: session.error || null,
      updatedAt: session.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getResults, getSessionStatus };
