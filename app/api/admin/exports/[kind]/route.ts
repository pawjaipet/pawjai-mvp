import { getAdminAuthContext } from "@/utils/admin-auth";
import { createAdminClient } from "@/utils/supabase/admin";
import { dogArchive, readExportRows } from "@/utils/hq-export";
import { exportCsv } from "@/utils/export-format";
import type { DogPhoto, DogTrait } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const context = await getAdminAuthContext();
  if (!context?.isGlobalAdmin || context.role !== "admin" || !context.userId) return Response.json({ error: "PawJai HQ access required." }, { status: 403 });
  const { kind } = await params;
  if (kind !== "dogs" && kind !== "bookings") return Response.json({ error: "Unknown export." }, { status: 404 });
  const db = createAdminClient();
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  try {
    if (kind === "bookings") {
      const columns = ["id", "booking_code", "dog_id", "shelter_id", "appointment_date", "appointment_time", "status", "checked_in_at", "application_id", "created_at", "updated_at"];
      const [rows, dogs, shelters] = await Promise.all([
        readExportRows(db, "appointments", columns.join(","), 10000),
        readExportRows(db, "dogs", "id,name", 10000),
        readExportRows(db, "shelters", "id,name", 1000),
      ]);
      const enriched = rows.map(row => ({ ...row, dog: dogs.find(dog => dog.id === row.dog_id)?.name ?? "", shelter: shelters.find(shelter => shelter.id === row.shelter_id)?.name ?? "" }));
      return new Response(exportCsv([...columns, "dog", "shelter"], enriched), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="pawjai-visits.csv"' } });
    }
    const [dogs, photos, traits, shelters] = await Promise.all([
      readExportRows(db, "dogs", "id,name,breed,size,age_months,gender,adoption_status,shelter_id,weight_kg,energy_level,background", 2000),
      readExportRows(db, "dog_photos", "id,dog_id,public_url,storage_path,is_cover,sort_order", 10000),
      readExportRows(db, "dog_traits", "id,dog_id,trait_type,trait_value", 10000),
      readExportRows(db, "shelters", "id,name", 1000),
    ]);
    const iterator = dogArchive(dogs, photos as unknown as DogPhoto[], traits as unknown as DogTrait[], shelters, request.signal);
    const stream = new ReadableStream({
      async pull(controller) { const next = await iterator.next(); if (next.done) controller.close(); else controller.enqueue(next.value); },
      async cancel() { await iterator.return(); },
    });
    return new Response(stream, { headers: { ...headers, "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="pawjai-dogs.zip"' } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Export unavailable. Please try again." }, { status: 503, headers });
  }
}
