import express from "express";
import cors from "cors";
import { pool, initializeDatabase, checkDatabaseConnection } from "./database.js";
import { log } from "./logger.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.use((req, res, next) => {
  log("info", "Incoming request", {
    method: req.method,
    path: req.path
  });
  next();
});

app.get("/health", async (req, res) => {
  try {
    await checkDatabaseConnection();

    res.status(200).json({
      status: "healthy",
      service: "backend",
      database: "reachable"
    });
  } catch (error) {
    log("error", "Healthcheck failed", { error: error.message });

    res.status(503).json({
      status: "unhealthy",
      service: "backend",
      database: "unreachable"
    });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const totalResult = await pool.query("SELECT COUNT(*)::int AS total FROM feedback");
    const averageResult = await pool.query("SELECT COALESCE(ROUND(AVG(rating), 1), 0) AS average FROM feedback");

    res.json({
      totalFeedbacks: totalResult.rows[0].total,
      averageRating: Number(averageResult.rows[0].average)
    });
  } catch (error) {
    log("error", "Could not load statistics", { error: error.message });
    res.status(500).json({ error: "Statistics could not be loaded" });
  }
});

app.get("/api/feedback", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, category, rating, message, created_at
      FROM feedback
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    log("error", "Could not load feedback", { error: error.message });
    res.status(500).json({ error: "Feedback could not be loaded" });
  }
});

app.post("/api/feedback", async (req, res) => {
  const { name, category, rating, message } = req.body;

  const cleanName = String(name || "").trim();
  const cleanCategory = String(category || "").trim();
  const cleanMessage = String(message || "").trim();
  const numericRating = Number(rating);

  if (!cleanName || !cleanCategory || !cleanMessage || !Number.isInteger(numericRating)) {
    log("warn", "Invalid feedback request", { reason: "missing_or_invalid_fields" });
    return res.status(400).json({
      error: "Name, category, rating and message are required"
    });
  }

  if (cleanName.length > 80 || cleanCategory.length > 40 || cleanMessage.length > 600) {
    log("warn", "Invalid feedback request", { reason: "field_too_long" });
    return res.status(400).json({
      error: "Input is too long"
    });
  }

  if (numericRating < 1 || numericRating > 5) {
    log("warn", "Invalid feedback request", { reason: "rating_out_of_range" });
    return res.status(400).json({
      error: "Rating must be between 1 and 5"
    });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO feedback (name, category, rating, message)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, category, rating, message, created_at
      `,
      [cleanName, cleanCategory, numericRating, cleanMessage]
    );

    log("info", "Feedback created", {
      feedbackId: result.rows[0].id,
      category: cleanCategory,
      rating: numericRating
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    log("error", "Could not save feedback", { error: error.message });
    res.status(500).json({ error: "Feedback could not be saved" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      log("info", "Backend started", { port });
    });
  })
  .catch((error) => {
    log("error", "Backend startup failed", { error: error.message });
    process.exit(1);
  });
