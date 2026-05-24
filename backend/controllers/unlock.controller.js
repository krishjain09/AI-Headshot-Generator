const { sessionStore } = require("../utils/sessionStore");

async function unlockImages(req, res) {
  try {
    const { sessionId } = req.body;

    const session = sessionStore.get(sessionId);

    if (!session) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    return res.status(200).json({
      unlocked: true,

      images: session.generatedImages.map((img) => ({
        originalUrl: img.originalUrl,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
}

module.exports = {
  unlockImages,
};
