import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { GiftRow } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id || session.user.email!;

  try {
    const rows = await prisma.giftRow.findMany({
      where: { userId },
      orderBy: { gift_date: "desc" },
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 400 });
    }

    const COLS: (keyof GiftRow)[] = [
      "donor_id","donor_name","segment","gift_date","gift_amount","campaign","channel","region",
    ];

    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const lines = [
      COLS.join(","),
      ...(rows as GiftRow[]).map(r => COLS.map(c => escape(r[c])).join(",")),
    ];
    const csv = lines.join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="donor_gift_history_export.csv"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
