require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const uploadRoutes = require("./routes/upload.routes");
const generateRoutes = require("./routes/generate.routes");
const unlockRoutes = require("./routes/unlock.routes");
const resultsRoutes = require("./routes/results.routes");

const { errorHandler } = require("./utils/errorHandler");
const { logger } = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Ensure local temp directories exist 
["uploads", "generated"].forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// ─── Middleware 
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logger
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ─── Routes 
app.use("/api/upload", uploadRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/unlock", unlockRoutes);


// ─── Error Handler 
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Headshot backend running on http://localhost:${PORT}`);
});

module.exports = app;
