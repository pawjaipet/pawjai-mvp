import Link from "next/link";
import ImageWithFallback from "./ImageWithFallback";
import type { DogWithCover } from "@/types/database";

function ageLabel(months: number | null): string {
  if (months === null) return "";
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export default function DogCard({ dog }: { dog: DogWithCover }) {
  return (
    <Link
      href={`/dogs/${dog.id}`}
      className="block rounded-[16px] overflow-hidden active:scale-95 transition-transform"
      style={{ background: "white" }}
    >
      {/* Photo */}
      <div className="relative h-[160px]" style={{ background: "#d6c8ad" }}>
        <ImageWithFallback
          src={dog.cover_photo}
          alt={dog.name}
          fill
          className="object-cover"
        />
        {/* Status badge */}
        {dog.adoption_status !== "available" && (
          <div className="absolute top-[8px] right-[8px] rounded-full px-[8px] py-[3px] text-[10px] font-semibold" style={{ background: "#65584f", color: "white", fontFamily: "Montserrat, sans-serif" }}>
            {dog.adoption_status}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-[12px] py-[10px]">
        <h3
          className="font-semibold text-[#65584f] text-[16px] leading-tight truncate"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {dog.name}
        </h3>
        <p
          className="text-[12px] text-[#65584f]/60 mt-[2px] truncate"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {dog.breed ?? "Mixed breed"}
        </p>

        {/* Tags row */}
        <div className="flex flex-wrap gap-[5px] mt-[8px]">
          {dog.age_months !== null && (
            <span
              className="text-[11px] rounded-full px-[8px] py-[2px]"
              style={{ background: "#d6c8ad", color: "#65584f", fontFamily: "Montserrat, sans-serif" }}
            >
              {ageLabel(dog.age_months)}
            </span>
          )}
          {dog.gender && dog.gender !== "unknown" && (
            <span
              className="text-[11px] rounded-full px-[8px] py-[2px] capitalize"
              style={{ background: "#d6c8ad", color: "#65584f", fontFamily: "Montserrat, sans-serif" }}
            >
              {dog.gender}
            </span>
          )}
          {dog.energy_level && (
            <span
              className="text-[11px] rounded-full px-[8px] py-[2px] capitalize"
              style={{
                background: dog.energy_level === "high" ? "#cd8188" : "#d6c8ad",
                color: dog.energy_level === "high" ? "white" : "#65584f",
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              {dog.energy_level}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
