const express = require("express");
const router = express.Router();
const { getResults, getSessionStatus } = require("../controllers/results.controller");

// GET /api/results/:sessionId  – fetch completed headshots for a session
router.get("/:sessionId", getResults);

// GET /api/results/:sessionId/status  – poll generation status
router.get("/:sessionId/status", getSessionStatus);

module.exports = router;
