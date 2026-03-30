"use client";
import { useRouter } from "next/navigation";
import CsvUploader from "@/components/dashboard/CsvUploader";

export default function UploadPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-base font-semibold text-brand-text">Upload Donor Data</h1>
        <p className="text-xs text-brand-muted mt-1">
          Upload a CSV to replace the current dataset. Required columns:
          donor_id, donor_name, segment, gift_date, gift_amount, campaign, channel, region.
        </p>
      </div>
      <CsvUploader onSuccess={() => router.push("/dashboard")} />
    </div>
  );
}
