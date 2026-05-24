const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { logger } = require("../utils/logger");

// Configure Cloudinary once on import
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a single local file to Cloudinary.
 * @param {string} filePath – local disk path
 * @param {object} options  – Cloudinary upload options
 * @returns Cloudinary upload result
 */
async function uploadToCloudinary(file, options = {}) {
  try {
    // ============================================================
    // BUFFER UPLOAD
    // ============================================================

    if (Buffer.isBuffer(file)) {
      return await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",

            ...options,
          },

          (err, result) => {
            if (err) {
              logger.error(`Cloudinary buffer upload failed: ${err.message}`);

              return reject(
                new Error(`Cloudinary upload failed: ${err.message}`),
              );
            }

            logger.info(`Cloudinary upload OK: ${result.public_id}`);

            resolve(result);
          },
        );

        stream.end(file);
      });
    }

    // ============================================================
    // FILE PATH UPLOAD
    // ============================================================

    const result = await cloudinary.uploader.upload(file, {
      resource_type: "image",

      ...options,
    });

    logger.info(`Cloudinary upload OK: ${result.public_id}`);

    return result;
  } catch (err) {
    logger.error(`Cloudinary upload failed: ${err.message}`);

    throw new Error(`Cloudinary upload failed: ${err.message}`);
  }
}

/**
 * Upload a URL (e.g., Replicate output) to Cloudinary for permanent storage.
 */
async function uploadUrlToCloudinary(url, options = {}) {
  try {
    const result = await cloudinary.uploader.upload(url, {
      resource_type: "image",
      ...options,
    });
    logger.info(`Cloudinary URL upload OK: ${result.public_id}`);
    return result;
  } catch (err) {
    logger.error(`Cloudinary URL upload failed: ${err.message}`);
    throw new Error(`Cloudinary URL upload failed: ${err.message}`);
  }
}

/**
 * Delete a Cloudinary asset by publicId.
 */
async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Cloudinary delete OK: ${publicId}`);
  } catch (err) {
    logger.warn(`Cloudinary delete failed for ${publicId}: ${err.message}`);
  }
}

/**
 * Remove local temp files after upload.
 */
async function cleanupLocalFiles(filePaths = []) {
  for (const fp of filePaths) {
    try {
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch (err) {
      logger.warn(`Could not delete temp file ${fp}: ${err.message}`);
    }
  }
}

// Future: watermark helper (not implemented yet)
// async function applyWatermark(publicId) { ... }

module.exports = {
  uploadToCloudinary,
  uploadUrlToCloudinary,
  deleteFromCloudinary,
  cleanupLocalFiles,
  cloudinary,
};
