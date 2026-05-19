#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { SPECIAL_STICKERS, GROUPS } from "../src/albumData.js";

function getArg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback;
  return process.argv[idx + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

const csvPath = path.resolve(getArg("--csv", "../inputs/to complete fwctracker.csv"));
const baseUrl = getArg("--url", "").replace(/\/$/, "");
const albumId = getArg("--album-id", "");
const dryRun = hasFlag("--dry-run");

if (!fs.existsSync(csvPath)) {
  console.error(`CSV not found: ${csvPath}`);
  process.exit(1);
}

if (!dryRun && (!baseUrl || !albumId)) {
  console.error("Missing required args: --url and --album-id (or use --dry-run)");
  process.exit(1);
}

function allValidCodes() {
  const set = new Set();
  SPECIAL_STICKERS.forEach((s) => set.add(s.code));
  GROUPS.forEach((g) => {
    g.teams.forEach((t) => {
      for (let i = 1; i <= 20; i++) {
        set.add(`${t.code} ${i}`);
      }
    });
  });
  return set;
}

function parseMissingCodes(rawCsv) {
  const tokenRegex = /^([A-Za-z]+)\s*0*(\d+)$/;
  const missing = new Set();
  const unknownTokens = [];

  const tokens = rawCsv
    .split(/[,\r\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  for (const raw of tokens) {
    const upper = raw.toUpperCase();
    const m = upper.match(tokenRegex);
    if (!m) {
      unknownTokens.push(raw);
      continue;
    }

    let prefix = m[1];
    const number = Number.parseInt(m[2], 10);

    // CSV uses SC01..SC20 for Scotland; backend codes use SCO 1..20.
    if (prefix === "SC") prefix = "SCO";

    missing.add(`${prefix} ${number}`);
  }

  return { missing, unknownTokens };
}

async function patchChunk(url, id, chunk) {
  const res = await fetch(`${url}/api/albums/${id}/stickers`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stickers: chunk }),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

async function main() {
  const raw = fs.readFileSync(csvPath, "utf8");
  const validCodes = allValidCodes();
  const { missing, unknownTokens } = parseMissingCodes(raw);

  const unknownCodes = [...missing].filter((code) => !validCodes.has(code));
  const validMissing = [...missing].filter((code) => validCodes.has(code));

  const updates = [...validCodes].map((code) => ({
    code,
    status: missing.has(code) ? "missing" : "complete",
    repeats: 0,
  }));

  const completeCount = updates.filter((u) => u.status === "complete").length;
  const missingCount = updates.filter((u) => u.status === "missing").length;

  console.log(`CSV file: ${csvPath}`);
  console.log(`Valid album codes: ${validCodes.size}`);
  console.log(`Missing parsed from CSV: ${validMissing.length}`);
  console.log(`Will set complete: ${completeCount}`);
  console.log(`Will set missing:  ${missingCount}`);

  if (unknownCodes.length > 0) {
    console.log(`\nUnknown sticker codes ignored (${unknownCodes.length}):`);
    console.log(unknownCodes.slice(0, 20).join(", "));
    if (unknownCodes.length > 20) console.log("...");
  }

  if (unknownTokens.length > 0) {
    console.log(`\nUnrecognized raw tokens (${unknownTokens.length}) ignored.`);
  }

  if (dryRun) {
    console.log("\nDry-run enabled. No changes pushed.");
    return;
  }

  const chunkSize = 100;
  let pushed = 0;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await patchChunk(baseUrl, albumId, chunk);
    pushed += chunk.length;
    console.log(`Pushed ${pushed}/${updates.length}`);
  }

  console.log("\nDone. Cloud album state mirrored from CSV missing list.");
}

main().catch((err) => {
  console.error("Sync failed:", err.message);
  process.exit(1);
});

