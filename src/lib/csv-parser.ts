import Papa from "papaparse";
import type { GiftRow, InvalidRow, ParseResult } from "@/types";

const REQUIRED = ["donor_id","donor_name","segment","gift_date","gift_amount","campaign","channel","region"];

export function parseAndValidateCsv(text: string): ParseResult {
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true, skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const validRows: GiftRow[] = [];
  const invalidRows: InvalidRow[] = [];

  (data as Record<string, string>[]).forEach((row, index) => {
    for (const field of REQUIRED) {
      if (!(field in row)) { invalidRows.push({ row, reason: `Missing column: ${field}`, index }); return; }
    }
    if (!row.donor_name?.trim()) { invalidRows.push({ row, reason: "donor_name is empty", index }); return; }
    if (!row.segment?.trim())    { invalidRows.push({ row, reason: "segment is empty",    index }); return; }
    if (!row.campaign?.trim())   { invalidRows.push({ row, reason: "campaign is empty",   index }); return; }
    const d = new Date(row.gift_date);
    if (!row.gift_date || isNaN(d.getTime())) { invalidRows.push({ row, reason: `Invalid date: "${row.gift_date}"`, index }); return; }
    const amount = parseFloat(row.gift_amount);
    if (isNaN(amount) || amount <= 0) { invalidRows.push({ row, reason: `Invalid amount: "${row.gift_amount}"`, index }); return; }
    validRows.push({
      donor_id:   row.donor_id.trim(), donor_name: row.donor_name.trim(),
      segment:    row.segment.trim(),  gift_date:  d.toISOString().split("T")[0],
      gift_amount: amount,             campaign:   row.campaign.trim(),
      channel:    row.channel?.trim()  || "Unknown",
      region:     row.region?.trim()   || "Unknown",
      city:       row.city?.trim()     || "",
    });
  });

  return { validRows, invalidRows, totalParsed: data.length };
}
