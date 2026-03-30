import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { classifyIntent, executeIntent } from "@/lib/query-engine";
import type { GiftRow } from "@/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const userId = (session.user as { id?: string }).id || session.user.email!;

  try {
    const { question } = await req.json();
    if (!question?.trim()) return new Response("No question provided", { status: 400 });

    const rows = await prisma.giftRow.findMany({ where: { userId } });
    if (rows.length === 0) return new Response("No data uploaded yet", { status: 400 });

    const intent = classifyIntent(question);
    const result = executeIntent(intent, rows as GiftRow[]);

    const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar",
        stream: true,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are a concise donor analytics assistant for a VP of Development at a nonprofit.
The system already ran a deterministic query against the actual data and produced the structured result below.
Answer the question using ONLY these numbers. Be specific. Add 1-2 brief actionable observations. Max 4 sentences. No markdown.
Structured result: ${JSON.stringify(result)}`,
          },
          { role: "user", content: question },
        ],
      }),
    });

    if (!perplexityRes.ok) {
      const err = await perplexityRes.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = perplexityRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const text = parsed.choices?.[0]?.delta?.content || "";
                if (text) controller.enqueue(encoder.encode(text));
              } catch {
                // skip malformed SSE frames
              }
            }
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

