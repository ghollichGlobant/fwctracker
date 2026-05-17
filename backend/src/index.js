import express from "express";
import cors from "cors";
import albumsRouter from "./routes/albums.js";
import stickersRouter from "./routes/stickers.js";
import statsRouter from "./routes/stats.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health check ───────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "fwc2026-backend", timestamp: new Date().toISOString() });
});

// ─── Routes ─────────────────────────────────────────────────
app.use("/api/albums", albumsRouter);
app.use("/api/albums/:albumId/stickers", stickersRouter);
app.use("/api/albums/:albumId/stats", statsRouter);

// ─── 404 ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Error handler ──────────────────────────────────────────
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚽ FWC2026 Backend running on http://localhost:${PORT}`);
  console.log(`   Health:    GET  /health`);
  console.log(`   Albums:    POST /api/albums`);
  console.log(`              GET  /api/albums`);
  console.log(`              GET  /api/albums/:id`);
  console.log(`   Stickers:  GET  /api/albums/:id/stickers`);
  console.log(`              GET  /api/albums/:id/stickers/:code`);
  console.log(`              PATCH /api/albums/:id/stickers/:code`);
  console.log(`              PATCH /api/albums/:id/stickers  (bulk)`);
  console.log(`   Stats:     GET  /api/albums/:id/stats\n`);
});
