const express = require("express");
const router = express.Router();
const { generateHeadshots } = require("../controllers/generate.controller");

// POST /api/generate
// Accept Cloudinary image URLs + optional style, kick off Replicate generation
router.post("/", generateHeadshots);

module.exports = router;
