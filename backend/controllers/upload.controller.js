const { v4: uuidv4 } = require("uuid");
const { uploadToCloudinary, cleanupLocalFiles } = require("../services/cloudinary.service");
const { selectBestImages } = require("../services/imageSelection.service");
const { sessionStore } = require("../utils/sessionStore");
const { logger } = require("../utils/logger");

/**
 * POST /api/upload
 * 1. Receive multipart files via multer
 * 2. Upload each to Cloudinary
 * 3. Run basic best-image selection
 * 4. Create a session and return session ID + image URLs
 */
async function uploadImages(req, res, next) {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No images provided." });
    }

    const min = parseInt(process.env.MIN_FILES || "5");
    const max = parseInt(process.env.MAX_FILES || "10");

    if (files.length < min) {
      return res
        .status(400)
        .json({ error: `Please upload at least ${min} images.` });
    }
    if (files.length > max) {
      return res
        .status(400)
        .json({ error: `Maximum ${max} images allowed.` });
    }

    logger.info(`Uploading ${files.length} images to Cloudinary…`);

    // Upload all files to Cloudinary in parallel
    const uploadResults = await Promise.all(
      files.map((file) =>
        uploadToCloudinary(file.path, {
          folder: "headshots/uploads",
          transformation: [
            { width: 1024, height: 1024, crop: "fill", gravity: "face" },
            { quality: "auto:best" },
          ],
        })
      )
    );

    // Clean up local temp files after Cloudinary upload
    await cleanupLocalFiles(files.map((f) => f.path));

    const cloudinaryUrls = uploadResults.map((r) => ({
      publicId: r.public_id,
      url: r.secure_url,
      width: r.width,
      height: r.height,
    }));

    // Select the best reference images for generation
    const bestImages = await selectBestImages(cloudinaryUrls);

    // Create session
    const sessionId = uuidv4();
    sessionStore.set(sessionId, {
      sessionId,
      status: "uploaded",
      uploadedImages: cloudinaryUrls,
      bestImages,
      generatedImages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.info(`Session ${sessionId} created with ${cloudinaryUrls.length} images`);

    return res.status(200).json({
      sessionId,
      uploadedCount: cloudinaryUrls.length,
      uploadedImages: cloudinaryUrls,
      bestImages,
      message: "Images uploaded successfully. Ready for generation.",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImages };
