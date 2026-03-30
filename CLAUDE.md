# DonorIQ — Assessment Brief & Project Rules

> This document is your single source of truth for Claude Code sessions.
> Keep it open alongside the codebase. Every decision should trace back to a rule here.

---

## What the Client Wants

The client is a **VP of Development at a mid-size nonprofit**.
She needs a **Donor Intelligence Dashboard** that helps her answer questions like:

- "How is donor retention trending this year vs last year?"
- "Which campaign has the highest average gift?"
- "Who are my top 10 donors right now?"
- "How many lapsed donors do we have and what's the recovery opportunity?"

She is **not technical**. She uploads a CSV, sees charts and KPIs, and asks natural language questions.
The system must feel trustworthy — she will present these numbers to her board.

---

## Deliverables Checklist

- [x] Working Next.js app running locally on port 3333
- [x] Login page (credentials-based auth via NextAuth)
- [x] CSV upload with preview + validation + commit flow
- [x] Dashboard with KPI cards (4 metrics)
- [x] Gifts Over Time chart (bar/line toggle, monthly/quarterly)
- [x] Segment + Channel breakdown
- [x] Top Donors table (searchable)
- [x] Natural Language Query panel with streaming AI responses
- [ ] All charts render after CSV upload
- [ ] NL query returns real answers (not hallucinated)
- [ ] README explains every design decision

---

## Tech Stack (DO NOT CHANGE)

| Layer        | Technology              | Notes                                      |
|---|---|---|
| Framework    | Next.js 15 (App Router) | Server components + API routes             |
| Auth         | NextAuth v4             | Credentials provider, JWT session          |
| Database     | SQLite via Prisma       | `file:./dev.db` — no external DB needed    |
| Charts       | Recharts                | Already installed, use this only           |
| AI           | Perplexity API (`sonar`)| NOT OpenAI — env var: PERPLEXITY_API_KEY   |
| Styling      | Tailwind CSS v3         | Config at `tailwind.config.js`             |
| Icons        | lucide-react            | Already installed                          |

---

## File Structure

```
C:\Users\Usuario\donor\
├── .env.local                          ← secrets (never commit)
├── prisma/schema.prisma                ← SQLite schema
├── src/
│   ├── types/index.ts                  ← all shared TypeScript types
│   ├── lib/
│   │   ├── auth.ts                     ← NextAuth config
│   │   ├── db.ts                       ← Prisma singleton
│   │   ├── csv-parser.ts               ← parse + validate CSV
│   │   ├── metrics.ts                  ← ALL KPI computations (single source of truth)
│   │   └── query-engine.ts             ← intent classifier + deterministic executor
│   ├── app/
│   │   ├── globals.css                 ← Tailwind base
│   │   ├── layout.tsx                  ← root layout (SessionProvider)
│   │   ├── page.tsx                    ← redirects to /dashboard or /login
│   │   ├── login/page.tsx              ← login form
│   │   ├── dashboard/
│   │   │   ├── layout.tsx              ← auth guard + sidebar shell
│   │   │   └── page.tsx                ← main dashboard (fetches /api/metrics)
│   │   └── api/
│   │       ├── auth/[...nextauth]/     ← NextAuth handler
│   │       ├── upload/route.ts         ← CSV parse → preview → commit
│   │       ├── metrics/route.ts        ← compute KPIs from DB
│   │       └── query/route.ts          ← NL → intent → data → Perplexity stream
│   └── components/
│       ├── layout/Sidebar.tsx
│       ├── layout/Topbar.tsx
│       └── dashboard/
│           ├── KpiGrid.tsx
│           ├── GiftsOverTimeChart.tsx
│           ├── SegmentBreakdown.tsx
│           ├── TopDonorsTable.tsx
│           ├── CsvUploader.tsx
│           └── NlQueryPanel.tsx
```

---

## .env.local Reference

```env
NEXTAUTH_URL=http://localhost:3333
NEXTAUTH_SECRET=<any string>
TEST_USER_EMAIL=vp@donoriq.com
TEST_USER_PASSWORD=yesihiremarcel
DATABASE_URL=file:./dev.db
PERPLEXITY_API_KEY=pplx-...
```

---

## Data Model Rules

- **Gift-level grain** — one DB row = one gift event. A donor who gave 3 times = 3 rows.
- **Never store aggregates** — always compute from raw rows at query time.
- **Rolling windows:**
  - Current period: last 365 days from today
  - Prior period: 365–730 days ago
- **userId** — every GiftRow belongs to the logged-in user (multi-tenant safe).

### CSV Schema (required columns)

| Column        | Type   | Example          |
|---|---|---|
| donor_id      | string | D001             |
| donor_name    | string | Margaret Williams|
| segment       | string | Major Gifts      |
| gift_date     | date   | 2025-03-15       |
| gift_amount   | number | 5000             |
| campaign      | string | Year-End 2024    |
| channel       | string | Email            |
| region        | string | Northeast        |

Sample CSV is at: `C:\Users\Usuario\donor\data\donor_gift_history.csv`

---

## KPI Definitions

| KPI              | Formula                                                                 |
|---|---|
| Total Raised     | Sum of gift_amount in current period                                    |
| Average Gift     | Total Raised / count of gifts in current period                        |
| Donor Count      | Distinct donor_ids in current period                                    |
| Retention Rate   | donors in both prior AND current / donors in prior only × 100          |
| Conversion Rate  | new donors in prior who gave again in current / new donors in prior × 100 |
| Lapsed Count     | donors active before prior period, absent in both prior and current    |
| Reactivation Rate| lapsed donors who gave in current / all lapsed × 100                   |
| Upgrade Rate     | retained donors whose current total > prior total / retained × 100     |

All computed in `src/lib/metrics.ts`. **Do not duplicate logic elsewhere.**

---

## NL Query Pipeline Rules

The AI (Perplexity) **never sees raw data** and **never computes numbers**.

Flow:
1. User types a question
2. `classifyIntent()` in `query-engine.ts` assigns an intent type
3. `executeIntent()` runs deterministic SQL-like logic on the rows
4. The structured result JSON is passed to Perplexity as context
5. Perplexity only narrates the pre-computed result in plain English

This prevents hallucination. The VP can trust the numbers because they come from the database, not the LLM.

### Intent types in `query-engine.ts`

| Intent                  | Triggered by keywords                        |
|---|---|
| top_campaign_avg_gift   | "campaign", "average", "highest", "best"     |
| lapsed_donors           | "lapsed", "lost", "churned"                  |
| top_channel             | "channel", "email", "mail", "web", "phone"   |
| retention_rate          | "retention", "retain"                        |
| upgrade_rate            | "upgrade", "increased", "grew"               |
| general_summary         | everything else                              |

---

## Constraints & Rules for Claude Code

1. **Never use `localStorage` or `sessionStorage`** — the app runs in sandboxed contexts.
2. **Always use `--legacy-peer-deps`** when running `npm install` — Next.js 15 + NextAuth v4 have a peer dep conflict.
3. **Prisma with SQLite** — `createMany` is not supported in SQLite. Use a `for` loop with `create` instead.
4. **Port is 3333** — always run `npm run dev -- -p 3333`.
5. **Auth userId** — always extract as: `(session.user as { id?: string }).id || session.user.email!`
6. **API responses** — always wrap in try/catch and return `NextResponse.json({ error: String(err) }, { status: 500 })` on failure.
7. **Fetch in client components** — always do `const text = await res.text(); const data = JSON.parse(text)` instead of `res.json()` directly to avoid silent JSON parse errors.
8. **Perplexity streaming** — model is `sonar`, base URL is `https://api.perplexity.ai/chat/completions`, parse SSE lines starting with `data: `.
9. **Do not upgrade Prisma** — stay on v5.22.0 to match the generated client.
10. **Tailwind color classes** — custom colors are: `primary`, `surface`, `brand-text`, `brand-muted`, `brand-faint`. See `tailwind.config.js`.

---

## Known Issues Already Fixed

| Issue | Fix applied |
|---|---|
| `autoprefixer` missing | `npm install autoprefixer --legacy-peer-deps` |
| `createMany` fails on SQLite | Replaced with `for` loop in `upload/route.ts` |
| `res.json()` throws on empty body | Use `res.text()` then `JSON.parse()` in `CsvUploader.tsx` |
| Port conflict with localhost:3000 | Use `npm run dev -- -p 3333` |
| next-auth peer dep error | Use `npm install --legacy-peer-deps` |

---

## How to Start a Claude Code Session

Open terminal in `C:\Users\Usuario\donor`, then:

```bash
# If server is not running:
npm run dev -- -p 3333

# Tell Claude Code:
# "Read CLAUDE.md first, then help me fix [specific issue]"
```

Always point Claude Code to this file first with:
> "Read CLAUDE.md before making any changes"

---

## Current Status

- App runs on http://localhost:3333 ✅
- Login works ✅
- CSV upload parses and previews ✅
- Commit to SQLite works ✅
- Dashboard charts — **pending verification after data load**
- NL query panel — **pending Perplexity API key**
