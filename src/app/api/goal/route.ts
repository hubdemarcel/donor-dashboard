import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const GOAL_FILE    = join(process.cwd(), "data", "goal.json");
const DEFAULT_GOAL = 50000;

function readGoal(): number {
  try {
    if (existsSync(GOAL_FILE)) {
      const data = JSON.parse(readFileSync(GOAL_FILE, "utf-8"));
      return typeof data.goal === "number" && data.goal > 0 ? data.goal : DEFAULT_GOAL;
    }
  } catch { /* fall through */ }
  return DEFAULT_GOAL;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json({ goal: readGoal() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const text = await req.text();
    const { goal } = JSON.parse(text);
    if (typeof goal !== "number" || goal <= 0) {
      return NextResponse.json({ error: "goal must be a positive number" }, { status: 400 });
    }
    writeFileSync(GOAL_FILE, JSON.stringify({ goal }));
    return NextResponse.json({ goal });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
