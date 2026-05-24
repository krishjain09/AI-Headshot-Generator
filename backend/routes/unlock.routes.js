const express = require("express");

const router = express.Router();

const { unlockImages } = require("../controllers/unlock.controller");

router.post("/", unlockImages);

module.exports = router;
