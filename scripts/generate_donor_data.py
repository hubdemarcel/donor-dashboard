#!/usr/bin/env python3
"""Generate realistic donor gift history CSV with city column.
Run from any directory — writes to data/donor_gift_history.csv.
"""
import csv
import random
from datetime import date, timedelta
from collections import Counter
from pathlib import Path

random.seed(42)

TODAY        = date(2026, 3, 29)
CURRENT_START = TODAY - timedelta(days=365)   # 2025-03-29
PRIOR_START   = TODAY - timedelta(days=730)   # 2024-03-29
PRIOR_END     = CURRENT_START - timedelta(days=1)
FAR_START     = TODAY - timedelta(days=1460)  # 2022-03-29

REGION_CITIES = {
    "Northeast":       ["Boston", "Providence", "Hartford"],
    "Southeast":       ["Atlanta", "Charlotte", "Nashville"],
    "Midwest":         ["Chicago", "Columbus", "Indianapolis"],
    "Southwest":       ["Phoenix", "Albuquerque", "Tucson"],
    "West":            ["Los Angeles", "San Francisco", "Seattle"],
    "Mid-Atlantic":    ["New York", "Philadelphia", "Baltimore"],
    "New England":     ["Burlington", "Portland ME", "Concord"],
    "Pacific Northwest":["Portland OR", "Tacoma", "Eugene"],
    "Mountain West":   ["Denver", "Salt Lake City", "Boise"],
    "Texas":           ["Dallas", "Houston", "Austin"],
}

CAMPAIGNS_CURRENT = [
    "Year-End 2025", "Spring Gala 2025", "Annual Fund 2025",
    "Capital Campaign", "Major Gifts",
]
CAMPAIGNS_PRIOR = [
    "Year-End 2024", "Spring Gala 2024", "Annual Fund 2024",
    "Emergency Relief", "Legacy Circle",
]
CAMPAIGNS_OLD = [
    "Year-End 2023", "Annual Fund 2023", "Capital Campaign", "Legacy Circle",
]
CHANNELS = ["Email", "Mail", "Phone", "Web", "Event"]


def rand_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, max(delta, 0)))


rows: list[dict] = []


def gift(donor_id, name, segment, dt, amount, campaign, channel, region):
    city = random.choice(REGION_CITIES[region])
    rows.append({
        "donor_id":    donor_id,
        "donor_name":  name,
        "segment":     segment,
        "gift_date":   dt.isoformat(),
        "gift_amount": round(amount, 2),
        "campaign":    campaign,
        "channel":     channel,
        "region":      region,
        "city":        city,
    })


# ── MAJOR GIFT DONORS (large retained, gifts in all periods) ──────────────────
major_donors = [
    ("D001", "Margaret Williams",  "Major Gifts", "Mid-Atlantic"),
    ("D002", "Robert Thompson",    "Major Gifts", "West"),
    ("D003", "Susan Anderson",     "Major Gifts", "Northeast"),
    ("D004", "Betty Walker",       "Major Gifts", "Midwest"),
    ("D005", "William Harris",     "Major Gifts", "Texas"),
    ("D006", "Eleanor Bradford",   "Major Gifts", "Southeast"),
]
for did, name, seg, region in major_donors:
    ch = random.choice(CHANNELS)
    for _ in range(random.randint(3, 4)):
        gift(did, name, seg, rand_date(FAR_START, PRIOR_START - timedelta(1)),
             random.uniform(9000, 25000), random.choice(CAMPAIGNS_OLD), ch, region)
    for _ in range(random.randint(2, 3)):
        gift(did, name, seg, rand_date(PRIOR_START, PRIOR_END),
             random.uniform(9000, 25000), random.choice(CAMPAIGNS_PRIOR), ch, region)
    for _ in range(random.randint(2, 3)):
        gift(did, name, seg, rand_date(CURRENT_START, TODAY),
             random.uniform(9000, 25000), random.choice(CAMPAIGNS_CURRENT), ch, region)

# ── MID-LEVEL RETAINED DONORS ─────────────────────────────────────────────────
mid_donors = [
    ("D007", "James Chen",       "Mid-Level", "West"),
    ("D008", "Jennifer Davis",   "Mid-Level", "Southeast"),
    ("D009", "Linda Wilson",     "Mid-Level", "Mid-Atlantic"),
    ("D010", "Karen Jackson",    "Mid-Level", "Midwest"),
    ("D011", "Nancy Harris",     "Mid-Level", "Southwest"),
    ("D012", "Thomas Lee",       "Mid-Level", "Pacific Northwest"),
    ("D013", "Sarah Patel",      "Mid-Level", "Mountain West"),
    ("D014", "Marcus Rivera",    "Mid-Level", "Texas"),
    ("D015", "Diana Foster",     "Mid-Level", "New England"),
]
for did, name, seg, region in mid_donors:
    ch = random.choice(CHANNELS)
    for _ in range(random.randint(2, 3)):
        gift(did, name, seg, rand_date(PRIOR_START, PRIOR_END),
             random.uniform(1200, 4500), random.choice(CAMPAIGNS_PRIOR), ch, region)
    for _ in range(random.randint(2, 3)):
        gift(did, name, seg, rand_date(CURRENT_START, TODAY),
             random.uniform(1200, 4500), random.choice(CAMPAIGNS_CURRENT), ch, region)

# ── ANNUAL FUND RETAINED DONORS ───────────────────────────────────────────────
annual_retained = [
    ("D016", "Patricia Rodriguez", "Annual Fund", "Northeast"),
    ("D017", "Michael Brown",      "Annual Fund", "Southeast"),
    ("D018", "David Martinez",     "Annual Fund", "Midwest"),
    ("D019", "Christopher Taylor", "Annual Fund", "Southwest"),
    ("D020", "Daniel White",       "Annual Fund", "West"),
    ("D021", "Matthew Lewis",      "Annual Fund", "Mid-Atlantic"),
    ("D022", "Ashley Moore",       "Annual Fund", "Texas"),
    ("D023", "Kevin Clark",        "Annual Fund", "Pacific Northwest"),
    ("D024", "Rachel Green",       "Annual Fund", "Mountain West"),
    ("D025", "Brian Scott",        "Annual Fund", "New England"),
    ("D026", "Olivia Turner",      "Annual Fund", "Northeast"),
    ("D027", "Nathan Hall",        "Annual Fund", "Southeast"),
    ("D028", "Cynthia Adams",      "Annual Fund", "Midwest"),
    ("D029", "Victor Nguyen",      "Annual Fund", "Southwest"),
    ("D030", "Grace Mitchell",     "Annual Fund", "West"),
]
for did, name, seg, region in annual_retained:
    ch = random.choice(CHANNELS)
    for _ in range(random.randint(2, 3)):
        gift(did, name, seg, rand_date(PRIOR_START, PRIOR_END),
             random.uniform(250, 1200), random.choice(CAMPAIGNS_PRIOR), ch, region)
    for _ in range(random.randint(2, 3)):
        gift(did, name, seg, rand_date(CURRENT_START, TODAY),
             random.uniform(250, 1200), random.choice(CAMPAIGNS_CURRENT), ch, region)

# ── NEW DONORS (first gift in current period only) ────────────────────────────
new_donors = [
    ("D031", "Ethan Brooks",      "New Donor", "Mid-Atlantic"),
    ("D032", "Sophia Kim",        "New Donor", "Pacific Northwest"),
    ("D033", "Lucas Ortiz",       "New Donor", "Texas"),
    ("D034", "Ava Johnson",       "New Donor", "Mountain West"),
    ("D035", "Noah Williams",     "New Donor", "New England"),
    ("D036", "Isabella Martinez", "New Donor", "Northeast"),
    ("D037", "Liam Anderson",     "New Donor", "Southeast"),
    ("D038", "Mia Thompson",      "New Donor", "Midwest"),
    ("D039", "Zoe Campbell",      "New Donor", "Southwest"),
    ("D040", "Caleb Wright",      "New Donor", "West"),
]
for did, name, seg, region in new_donors:
    ch = random.choice(CHANNELS)
    for _ in range(random.randint(1, 2)):
        gift(did, name, seg, rand_date(CURRENT_START, TODAY),
             random.uniform(100, 750), random.choice(CAMPAIGNS_CURRENT), ch, region)

# ── LAPSED DONORS (historical only, before prior period) ─────────────────────
lapsed_donors = [
    ("D041", "Harold Simmons",  "Lapsed", "Southwest"),
    ("D042", "Dorothy Hughes",  "Lapsed", "West"),
    ("D043", "Raymond Flores",  "Lapsed", "Mid-Atlantic"),
    ("D044", "Evelyn Price",    "Lapsed", "Texas"),
    ("D045", "Frank Barnes",    "Lapsed", "Pacific Northwest"),
]
for did, name, seg, region in lapsed_donors:
    ch = random.choice(CHANNELS)
    for _ in range(random.randint(2, 4)):
        gift(did, name, seg, rand_date(FAR_START, PRIOR_START - timedelta(1)),
             random.uniform(200, 1200), random.choice(CAMPAIGNS_OLD), ch, region)

# ── AT-RISK DONORS (gave in prior period, NOT in current) ─────────────────────
at_risk_donors = [
    ("D046", "George Washington", "Annual Fund", "Northeast"),
    ("D047", "Alice Monroe",      "Mid-Level",   "Southeast"),
    ("D048", "Henry Ford",        "Annual Fund", "Midwest"),
    ("D049", "Clara Bennett",     "Mid-Level",   "Southwest"),
    ("D050", "Oscar Newman",      "Annual Fund", "Mountain West"),
    ("D051", "Ruth Hoffman",      "Annual Fund", "West"),
    ("D052", "Philip Morton",     "Mid-Level",   "Mid-Atlantic"),
]
for did, name, seg, region in at_risk_donors:
    ch = random.choice(CHANNELS)
    for _ in range(random.randint(1, 2)):
        gift(did, name, seg, rand_date(PRIOR_START, PRIOR_END),
             random.uniform(300, 3000), random.choice(CAMPAIGNS_PRIOR), ch, region)

# ── REACTIVATED DONORS (historical + current, skip prior) ────────────────────
reactivated_donors = [
    ("D053", "Victor Crane",   "Annual Fund", "West"),
    ("D054", "Helen Torres",   "Mid-Level",   "Texas"),
    ("D055", "Samuel Park",    "Annual Fund", "Midwest"),
    ("D056", "Iris Webb",      "Annual Fund", "New England"),
    ("D057", "Colin Fraser",   "Mid-Level",   "Northeast"),
]
for did, name, seg, region in reactivated_donors:
    ch = random.choice(CHANNELS)
    gift(did, name, seg, rand_date(FAR_START, PRIOR_START - timedelta(1)),
         random.uniform(300, 1500), random.choice(CAMPAIGNS_OLD), ch, region)
    for _ in range(random.randint(1, 2)):
        gift(did, name, seg, rand_date(CURRENT_START, TODAY),
             random.uniform(300, 1500), random.choice(CAMPAIGNS_CURRENT), ch, region)

# ── CONVERSION DONORS (new in prior, gave again in current) ──────────────────
conversion_donors = [
    ("D058", "Abigail Stone",  "Annual Fund", "Texas"),
    ("D059", "Derek Walsh",    "Mid-Level",   "Pacific Northwest"),
    ("D060", "Fiona Grant",    "Annual Fund", "Mountain West"),
]
for did, name, seg, region in conversion_donors:
    ch = random.choice(CHANNELS)
    gift(did, name, seg, rand_date(PRIOR_START, PRIOR_END),
         random.uniform(250, 1500), random.choice(CAMPAIGNS_PRIOR), ch, region)
    for _ in range(random.randint(1, 2)):
        gift(did, name, seg, rand_date(CURRENT_START, TODAY),
             random.uniform(250, 1500), random.choice(CAMPAIGNS_CURRENT), ch, region)

# ── 5 INVALID ROWS (validation testing) ───────────────────────────────────────
bad_rows = [
    # empty donor_name
    {"donor_id": "BAD001", "donor_name": "",              "segment": "Annual Fund",
     "gift_date": "2025-06-01", "gift_amount": "500",  "campaign": "Spring Gala 2025",
     "channel": "Email",  "region": "Northeast",        "city": "Boston"},
    # empty segment
    {"donor_id": "BAD002", "donor_name": "Test User Two", "segment": "",
     "gift_date": "2025-07-01", "gift_amount": "300",  "campaign": "Annual Fund 2025",
     "channel": "Mail",   "region": "Midwest",          "city": "Chicago"},
    # invalid date
    {"donor_id": "BAD003", "donor_name": "Test User Three","segment": "Annual Fund",
     "gift_date": "not-a-date", "gift_amount": "200",  "campaign": "Annual Fund 2025",
     "channel": "Web",    "region": "West",             "city": "Seattle"},
    # negative amount
    {"donor_id": "BAD004", "donor_name": "Test User Four","segment": "Annual Fund",
     "gift_date": "2025-08-01", "gift_amount": "-100", "campaign": "Annual Fund 2025",
     "channel": "Phone",  "region": "Texas",            "city": "Dallas"},
    # non-numeric amount + empty campaign
    {"donor_id": "BAD005", "donor_name": "Test User Five","segment": "Annual Fund",
     "gift_date": "2025-09-01", "gift_amount": "abc",  "campaign": "",
     "channel": "Event",  "region": "Southeast",        "city": "Atlanta"},
]

all_rows = rows + bad_rows

# ── WRITE CSV ──────────────────────────────────────────────────────────────────
output_path = Path(__file__).parent.parent / "data" / "donor_gift_history.csv"
fieldnames  = [
    "donor_id", "donor_name", "segment", "gift_date",
    "gift_amount", "campaign", "channel", "region", "city",
]
with open(output_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(all_rows)

region_counts = Counter(r["region"] for r in rows)
print(f"✓  {len(rows)} valid rows  +  {len(bad_rows)} invalid rows  =  {len(all_rows)} total")
print(f"✓  Written to {output_path}\n")
print("Rows by region:")
for region in sorted(REGION_CITIES.keys()):
    print(f"  {region:<20} {region_counts.get(region, 0):>3} rows")
