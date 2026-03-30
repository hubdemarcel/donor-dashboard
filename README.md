# DonorIQ — Donor Intelligence Dashboard

A full-stack nonprofit donor analytics platform built with Next.js 15, Prisma/SQLite, NextAuth, Recharts, and Perplexity AI.

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local — set NEXTAUTH_SECRET and PERPLEXITY_API_KEY

# 3. Push schema & generate Prisma client
npx prisma db push
npx prisma generate

# 4. Start dev server on port 3333
npm run dev -- -p 3333
```

Open [http://localhost:3333](http://localhost:3333) and sign in with:

- **Email:** `vp@donoriq.com`
- **Password:** `demo1234`

Then upload `data/donor_gift_history.csv` to populate the dashboard.

---

## Architecture

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components, API routes, SSE streaming |
| Auth | NextAuth v4 (Credentials) | JWT session, no OAuth needed |
| Database | SQLite via Prisma | Zero-config, file-based, gift-level grain |
| Charts | Recharts | BarChart, PieChart, Treemap, ScatterChart |
| AI | Perplexity `sonar` | Narrates pre-computed results — no hallucination |
| Styling | Tailwind CSS v3 | Custom teal palette, card/badge/btn utilities |

---

## Data Model

Each row = one gift event (gift-level grain, never aggregated in storage).
A donor who gave 3 times = 3 rows. All KPIs are computed at query time.

### Rolling Windows

| Period | Range |
|---|---|
| Current | Last 365 days from today |
| Prior | 365–730 days ago |

### KPI Definitions

| Metric | Formula |
|---|---|
| Total Raised | Sum of gift_amount, current period |
| Average Gift | Total Raised ÷ gift count |
| Donor Count | Distinct donor_ids, current period |
| Retention Rate | Donors in both prior AND current ÷ prior donors |
| Conversion Rate | New donors in prior who gave again in current ÷ new in prior |
| Reactivation Rate | Lapsed donors who gave in current ÷ all lapsed |
| Lapsed Count | Active before prior period, absent in both prior and current |

---

## NL Query Design

The natural language pipeline uses **intent classification → deterministic SQL execution → LLM narration**.
The AI (Perplexity) never sees raw donor data and never computes numbers.
It only narrates a pre-computed result object. This prevents hallucination — every number shown came from the database.

---

## CSV Schema

| Column | Type | Example |
|---|---|---|
| `donor_id` | string | `D001` |
| `donor_name` | string | `Margaret Williams` |
| `segment` | string | `Major Gifts` |
| `gift_date` | ISO date | `2025-03-15` |
| `gift_amount` | number | `5000` |
| `campaign` | string | `Year-End 2024` |
| `channel` | string | `Email` |
| `region` | string | `Northeast` |
| `city` | string | `Boston` *(optional)* |

Generate sample data (226 gifts, 60 donors, 10 regions):

```bash
pip install pandas
python scripts/generate_donor_data.py
```

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import the repo
3. In **Environment Variables**, add:

| Key | Value |
|---|---|
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | any random string |
| `TEST_USER_EMAIL` | `vp@donoriq.com` |
| `TEST_USER_PASSWORD` | `demo1234` |
| `DATABASE_URL` | `file:./prisma/dev.db` |
| `PERPLEXITY_API_KEY` | `pplx-...` |

1. Deploy. The build step runs `prisma generate && prisma db push && next build` automatically.

> **Note:** SQLite on Vercel is ephemeral — data resets on cold starts. Upload the CSV each session. For persistent storage, migrate to [Neon](https://neon.tech) (Postgres, free tier).
