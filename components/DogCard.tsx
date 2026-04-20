import Link from "next/link";
import ImageWithFallback from "./ImageWithFallback";
import type { DogWithCover } from "@/types/database";

const SIZE_LABEL: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  extra_large: "XL",
};

const ENERGY_COLOR: Record<string, string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

function ageLabel(months: number | null): string {
  if (months === null) return "Age unknown";
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export default function DogCard({ dog }: { dog: DogWithCover }) {
  return (
    <Link
      href={`/dogs/${dog.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative h-52 bg-amber-50">
        <ImageWithFallback
          src={dog.cover_photo}
          alt={dog.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">{dog.name}</h3>
          {dog.sterilized && (
            <span className="shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Sterilized</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{dog.breed ?? "Mixed breed"}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {dog.gender === "unknown" ? "Unknown gender" : dog.gender === "male" ? "Male" : "Female"}
          </span>
          {dog.age_months !== null && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ageLabel(dog.age_months)}</span>
          )}
          {dog.size && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{SIZE_LABEL[dog.size]}</span>
          )}
          {dog.energy_level && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${ENERGY_COLOR[dog.energy_level]}`}>
              {dog.energy_level.charAt(0).toUpperCase() + dog.energy_level.slice(1)} energy
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
