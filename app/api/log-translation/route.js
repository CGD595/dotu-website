import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

// ── Constants ────────────────────────────────────────────────────────────────
const VALID_DIRECTIONS = new Set(["eng_to_dzo", "dzo_to_eng"]);
const MAX_TEXT_LEN = 512;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── Simple in-memory rate limiter ────────────────────────────────────────────
// Allows MAX_REQUESTS per SESSION per WINDOW_MS.
// Resets automatically; no external dependency needed for a demo site.
const rateLimitMap = new Map(); // sessionId → { count, resetAt }
const WINDOW_MS = 60_000;       // 1 minute
const MAX_REQUESTS = 30;        // 30 translations per session per minute

function isRateLimited(sessionId) {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS) return true;

  entry.count += 1;
  return false;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { sessionId, direction, input, output } = body ?? {};

    // ── Validation ──────────────────────────────────────────────────────────
    if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
      return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    if (!VALID_DIRECTIONS.has(direction)) {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }

    if (typeof input !== "string" || typeof output !== "string") {
      return NextResponse.json({ error: "input and output must be strings" }, { status: 400 });
    }

    if (!input.trim() || !output.trim()) {
      return NextResponse.json({ error: "Empty input or output" }, { status: 400 });
    }

    // ── Rate limit ──────────────────────────────────────────────────────────
    if (isRateLimited(sessionId)) {
      return NextResponse.json(
        { error: "Too many requests — slow down" },
        { status: 429 }
      );
    }

    // ── Sanitise & truncate ─────────────────────────────────────────────────
    const doc = {
      sessionId,
      direction,
      input:     input.trim().slice(0, MAX_TEXT_LEN),
      output:    output.trim().slice(0, MAX_TEXT_LEN),
      timestamp: new Date(),
    };

    // ── Persist ─────────────────────────────────────────────────────────────
    const client = await clientPromise;
    const db = client.db("dotu");
    await db.collection("translations").insertOne(doc);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    // Never leak internal error details to the client
    console.error("[log-translation]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Reject every other HTTP method
export function GET()    { return NextResponse.json({ error: "Method not allowed" }, { status: 405 }); }
export function PUT()    { return NextResponse.json({ error: "Method not allowed" }, { status: 405 }); }
export function DELETE() { return NextResponse.json({ error: "Method not allowed" }, { status: 405 }); }
