import { Router } from "express";
import db from "../firebase.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router({ mergeParams: true });

// ─── GET /api/albums/:albumId/stats ─────────────────────────

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const albumDoc = await db.collection("albums").doc(req.params.albumId).get();
    if (!albumDoc.exists) {
      const err = new Error("Album not found"); err.status = 404; throw err;
    }

    const snap = await db
      .collection("albums")
      .doc(req.params.albumId)
      .collection("stickers")
      .get();

    const byTeam = {};
    const byGroup = {};
    let complete = 0;
    let missing = 0;
    let repeated = 0;
    let totalRepeats = 0;

    snap.forEach((d) => {
      const s = d.data();
      const team = s.team || "FWC";
      const group = s.group || "Special";

      // Per-team breakdown
      if (!byTeam[team]) byTeam[team] = { name: s.teamName || team, total: 0, complete: 0, missing: 0, repeated: 0 };
      byTeam[team].total++;

      // Per-group breakdown
      if (!byGroup[group]) byGroup[group] = { total: 0, complete: 0, missing: 0, repeated: 0 };
      byGroup[group].total++;

      if (s.status === "complete") {
        complete++;
        byTeam[team].complete++;
        byGroup[group].complete++;
      } else if (s.status === "repeated") {
        repeated++;
        totalRepeats += s.repeats || 0;
        byTeam[team].repeated++;
        byGroup[group].repeated++;
      } else {
        missing++;
        byTeam[team].missing++;
        byGroup[group].missing++;
      }
    });

    const total = snap.size;

    res.json({
      total,
      complete,
      missing,
      repeated,
      totalRepeats,
      progress: total > 0 ? Math.round((complete / total) * 10000) / 100 : 0,
      byTeam,
      byGroup,
    });
  })
);

export default router;
