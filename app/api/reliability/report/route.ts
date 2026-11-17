import { NextResponse, type NextRequest } from "next/server";
import { sanitizeReliabilityReport } from "@/utils/reliability-schema";

const WINDOW_MS = 60_000;
const MAX_REPORTS_PER_WINDOW = 20;
const buckets = new Map<string, { started: number; count: number }>();

function sourceKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const key = sourceKey(request);
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.started > WINDOW_MS) buckets.set(key, { started: now, count: 1 });
  else if (bucket.count >= MAX_REPORTS_PER_WINDOW) return new NextResponse(null, { status: 204 });
  else bucket.count += 1;

  const report = sanitizeReliabilityReport(await request.json().catch(() => null));
  if (!report) return NextResponse.json({ error: "Invalid reliability report." }, { status: 400 });

  if (process.env.RELIABILITY_MONITORING_ENABLED !== "true") return new NextResponse(null, { status: 204 });
  console.error("PAWJAI_RELIABILITY", report);
  return new NextResponse(null, { status: 204 });
}
