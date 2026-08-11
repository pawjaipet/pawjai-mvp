"use client";

import { useRef, useState, useTransition } from "react";
import { Award, Camera, Check, Gift, Pencil, Star, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { updateProfile } from "@/app/profile/actions";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const M = "Montserrat, sans-serif";
const PROFILE_NAME_MAX_LENGTH = 10;

function normalizeProfileNameInput(value: string) {
  return value.replace(/\s+/g, " ").replace(/^\s+/, "").slice(0, PROFILE_NAME_MAX_LENGTH);
}

function normalizeProfileNameForSave(value: string) {
  return normalizeProfileNameInput(value).trim();
}

function profileNameFontSize(value: string) {
  const length = value.trim().length;
  if (length >= 9) return 27;
  if (length >= 7) return 30;
  return 33;
}

type BadgeId = "first_adopter" | "top_donater" | "premium_user";

const BADGE_CONFIG: Record<BadgeId, { label: string; Icon: LucideIcon; variant: "outline" | "filled" }> = {
  first_adopter: { label: "First Adopter", Icon: Award, variant: "outline" },
  top_donater: { label: "Top Donor", Icon: Gift, variant: "outline" },
  premium_user: { label: "Premium User", Icon: Star, variant: "filled" },
};

interface Props {
  initialNickname: string;
  initialFullName: string;
  initialAvatarUrl: string | null;
  initialCoverUrl: string | null;
  badges: BadgeId[];
}

export default function EditableProfileHeader({
  initialNickname,
  initialFullName,
  initialAvatarUrl,
  initialCoverUrl,
  badges,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(() => normalizeProfileNameInput(initialFullName));
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialCoverUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const { t } = useLanguage();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleCoverPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleCancel() {
    setEditing(false);
    setName(normalizeProfileNameInput(initialFullName));
    setAvatarPreview(initialAvatarUrl);
    setCoverPreview(initialCoverUrl);
    setAvatarFile(null);
    setCoverFile(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function handleSave() {
    const savedName = normalizeProfileNameForSave(name);
    const fd = new FormData();
    fd.append("fullName", savedName);
    if (avatarFile) fd.append("avatar", avatarFile);
    if (coverFile) fd.append("cover", coverFile);
    startTransition(async () => {
      await updateProfile(fd);
      setName(savedName);
      setEditing(false);
      setAvatarFile(null);
      setCoverFile(null);
    });
  }

  const displayNickname = normalizeProfileNameForSave(name) || normalizeProfileNameForSave(initialNickname);
  const displayNameFontSize = profileNameFontSize(displayNickname);
  const avatarSize = 106;

  return (
    <>
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleCoverPick}
        className="hidden"
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleAvatarPick}
        className="hidden"
      />

      <div
        className="relative w-full overflow-hidden"
        style={{
          height: 196,
          background: coverPreview
            ? undefined
            : "linear-gradient(135deg, #f5eadb 0%, #eadcc7 48%, #d6c8ad 100%)",
        }}
      >
        {coverPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPreview} alt="Cover" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute bottom-[-18px] right-[-18px] opacity-[0.08]">
            <svg width="210" height="210" viewBox="0 0 100 100" fill="#65584f">
              <ellipse cx="50" cy="75" rx="22" ry="18" />
              <ellipse cx="20" cy="55" rx="10" ry="13" />
              <ellipse cx="80" cy="55" rx="10" ry="13" />
              <ellipse cx="35" cy="40" rx="9" ry="11" />
              <ellipse cx="65" cy="40" rx="9" ry="11" />
            </svg>
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 h-[76px]"
          style={{ background: "linear-gradient(to bottom, rgba(245,241,232,0), rgba(245,241,232,0.76))" }}
        />

        {!editing && (
          <>
            <div
              className="pointer-events-none absolute left-[18px] top-[18px] z-20"
              style={{
                width: 112,
                height: 58,
                filter: "drop-shadow(0 2px 6px rgba(255,255,255,0.72))",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pawjai-logo.png" alt="PawJai" className="h-full w-full object-contain object-left" />
            </div>
            <div className="absolute right-[18px] top-[28px] z-30">
              <LanguageSwitcher compact />
            </div>
          </>
        )}

        {editing && (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 z-10 flex items-center justify-center transition-all"
            style={{ background: "rgba(0,0,0,0.32)" }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95">
                <Camera size={26} stroke="#65584f" strokeWidth={2} />
              </div>
              <span className="text-[13px] font-semibold text-white" style={{ fontFamily: M }}>
                {t("Change cover photo")}
              </span>
            </div>
          </button>
        )}
      </div>

      <div
        className="relative mx-[14px] rounded-[28px] bg-white px-[18px] pb-[20px] pt-[66px]"
        style={{
          marginTop: -52,
          boxShadow: "0 14px 34px rgba(101,88,79,0.10)",
          zIndex: 10,
        }}
      >
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="absolute right-[16px] top-[16px] flex h-[40px] w-[40px] items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              background: "rgba(205,129,136,0.12)",
              color: "#cd8188",
              fontFamily: M,
            }}
            aria-label={t("Edit profile")}
          >
            <Pencil size={18} strokeWidth={2.2} />
          </button>
        )}

        <div
          className="absolute flex items-center justify-center overflow-hidden rounded-full border-[5px] border-white"
          style={{
            top: -55,
            left: "50%",
            transform: "translateX(-50%)",
            width: avatarSize,
            height: avatarSize,
            background: "linear-gradient(135deg, #d6c8ad 0%, #c4b49a 100%)",
            boxShadow: "0 8px 22px rgba(101,88,79,0.18)",
          }}
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt={displayNickname} className="h-full w-full object-cover" />
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12ZM12 14C8.67 14 2 15.68 2 19V21H22V19C22 15.68 15.33 14 12 14Z"
                fill="rgba(101,88,79,0.4)"
              />
            </svg>
          )}

          {editing && (
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-[4px]"
              style={{ background: "rgba(0,0,0,0.55)" }}
              aria-label={t("Change profile photo")}
            >
              <Camera size={26} stroke="white" strokeWidth={2.2} />
              <span className="text-[10px] font-semibold leading-none text-white" style={{ fontFamily: M }}>
                {t("Change")}
              </span>
            </button>
          )}
        </div>

        {editing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(normalizeProfileNameInput(e.target.value))}
            placeholder={t("Your name")}
            maxLength={PROFILE_NAME_MAX_LENGTH}
            aria-label={t("Profile display name")}
            className="mt-[4px] w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-[14px] px-[12px] py-[8px] text-center font-bold leading-tight outline-none"
            style={{
              color: "#65584f",
              fontFamily: M,
              fontSize: displayNameFontSize,
              background: "rgba(245,241,232,0.64)",
              border: "1.5px solid rgba(205,129,136,0.34)",
            }}
          />
        ) : (
          <h1
            className="mt-[4px] max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-center font-bold leading-tight"
            style={{ color: "#65584f", fontFamily: M, fontSize: displayNameFontSize }}
            title={displayNickname}
          >
            {displayNickname}
          </h1>
        )}

        {editing && (
          <p className="mt-[8px] text-[12px] text-[#65584f]/60" style={{ fontFamily: M }}>
            {t("Tap the banner or profile photo to upload.")}
          </p>
        )}

        <div className="mt-[14px] flex flex-wrap justify-center gap-[8px]" style={{ minHeight: badges.length > 0 ? 34 : 8 }}>
          {badges.map((id) => {
            const cfg = BADGE_CONFIG[id];
            if (!cfg) return null;
            const { label, Icon, variant } = cfg;
            const isFilled = variant === "filled";
            return (
              <div
                key={id}
                className="inline-flex items-center gap-[7px] rounded-full px-[13px] py-[7px]"
                style={{
                  background: isFilled ? "#cd8188" : "rgba(245,241,232,0.86)",
                  border: isFilled ? "none" : "1.5px solid rgba(101,88,79,0.10)",
                  color: isFilled ? "white" : "#65584f",
                  boxShadow: isFilled ? "0 4px 14px rgba(205,129,136,0.30)" : "none",
                  fontFamily: M,
                }}
              >
                <Icon size={16} stroke={isFilled ? "white" : "#cd8188"} strokeWidth={2.2} />
                <span className="whitespace-nowrap text-[13px] font-semibold">{t(label)}</span>
              </div>
            );
          })}
        </div>

        {editing && (
          <div className="mt-[16px] flex w-full gap-[10px]">
            <button
              type="button"
              onClick={handleCancel}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-[6px] rounded-[14px] py-[12px] text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: "white",
                border: "1.5px solid rgba(101,88,79,0.2)",
                color: "#65584f",
                fontFamily: M,
              }}
            >
              <X size={15} /> {t("Cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-[6px] rounded-[14px] py-[12px] text-[14px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              <Check size={15} /> {pending ? t("Saving...") : t("Save")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
