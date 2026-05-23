/**
 * Minimal structured logger.
 * Drop-in replacement: swap for Winston/Pino when needed.
 */

const levels = { info: "INFO", warn: "WARN", error: "ERROR", debug: "DEBUG" };

function log(level, message) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${levels[level]}] ${message}`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

const logger = {
  info: (msg) => log("info", msg),
  warn: (msg) => log("warn", msg),
  error: (msg) => log("error", msg),
  debug: (msg) => {
    if (process.env.NODE_ENV !== "production") log("debug", msg);
  },
};

module.exports = { logger };
