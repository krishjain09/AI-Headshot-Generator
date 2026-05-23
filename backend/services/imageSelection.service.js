const { logger } = require("../utils/logger");

/**
 * Selects the best reference images from an uploaded set.
 *
 * Current strategy: prefer images closest to square (face-crop friendly),
 * pick up to 3 best candidates to use as face references.
 *
 * Future improvement: integrate InsightFace/OpenCV face quality scoring here.
 * Replace this function body while keeping the signature identical.
 *
 * @param {Array<{publicId, url, width, height}>} images
 * @returns {Array} – up to 3 best image objects
 */
async function selectBestImages(images) {
  if (!images || images.length === 0) return [];

  // Score each image: lower is better (closer to square aspect ratio)
  const scored = images.map((img) => {
    const ratio = img.width && img.height ? img.width / img.height : 1;
    const squareness = Math.abs(ratio - 1); // 0 = perfect square
    return { ...img, squareness };
  });

  // Sort by squareness ascending, take top 3
  const sorted = scored
    .sort((a, b) => a.squareness - b.squareness)
    .slice(0, 3);

  logger.info(
    `Selected ${sorted.length} best reference image(s): ${sorted
      .map((i) => i.publicId)
      .join(", ")}`
  );

  return sorted.map(({ squareness, ...img }) => img);
}

module.exports = { selectBestImages };
