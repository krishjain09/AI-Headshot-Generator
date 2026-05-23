const express = require("express");
const router = express.Router();
const { uploadImages } = require("../controllers/upload.controller");
const { multerUpload } = require("../utils/multerConfig");

// POST /api/upload
// Accept 5–10 images, upload to Cloudinary, return URLs
router.post(
  "/",
  multerUpload.array("images", parseInt(process.env.MAX_FILES || "10")),
  uploadImages
);

module.exports = router;
