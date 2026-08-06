"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Check, X, Pencil, Award, Gift, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { updateProfile } from "@/app/profile/actions";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const M = "Montserrat, sans-serif";

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
  const [name, setName] = useState(initialFullName);
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
    setName(initialFullName);
    setAvatarPreview(initialAvatarUrl);
    setCoverPreview(initialCoverUrl);
    setAvatarFile(null);
    setCoverFile(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function handleSave() {
    const fd = new FormData();
    fd.append("fullName", name);
    if (avatarFile) fd.append("avatar", avatarFile);
    if (coverFile) fd.append("cover", coverFile);
    startTransition(async () => {
      await updateProfile(fd);
      setEditing(false);
      setAvatarFile(null);
      setCoverFile(null);
    });
  }

  const displayNickname = name.trim() ? name.trim().split(" ")[0] : initialNickname;
  const AVATAR_SIZE = 150;

  return (
    <>
      {/* Hidden file inputs */}
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

      {/* ── Banner — full bleed ── */}
      <div
        className="w-full relative overflow-hidden"
        style={{
          height: 300,
          background: coverPreview
            ? undefined
            : "linear-gradient(135deg, #e8dfd0 0%, #d6c8ad 50%, #c9b99e 100%)",
        }}
      >
        {coverPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPreview}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {!coverPreview && (
          <div className="absolute right-[-20px] bottom-[40px] opacity-[0.10]">
            <svg width="220" height="220" viewBox="0 0 100 100" fill="#65584f">
              <ellipse cx="50" cy="75" rx="22" ry="18" />
              <ellipse cx="20" cy="55" rx="10" ry="13" />
              <ellipse cx="80" cy="55" rx="10" ry="13" />
              <ellipse cx="35" cy="40" rx="9" ry="11" />
              <ellipse cx="65" cy="40" rx="9" ry="11" />
            </svg>
          </div>
        )}

        {/* PawJai logo — top-left, larger */}
        {!editing && (
          <div
            className="absolute top-[16px] left-[14px] z-20 pointer-events-none"
            style={{
              width: 80,
              height: 80,
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.20))",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pawjai-logo.png"
              alt="PawJai"
              className="w-full h-full object-contain object-left"
            />
          </div>
        )}

        {/* Floating Edit pencil — top-right of banner (hidden when editing) */}
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="absolute top-[14px] right-[14px] w-[40px] h-[40px] rounded-full flex items-center justify-center transition-all active:scale-90 z-20"
            style={{
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              backdropFilter: "blur(8px)",
            }}
            aria-label="Edit profile"
          >
            <Pencil size={16} stroke="#65584f" strokeWidth={2.2} />
          </button>
        )}

        {!editing && (
          <LanguageSwitcher className="absolute right-[62px] top-[14px] z-20" compact />
        )}

        {/* Cover change overlay — only in edit mode */}
        {editing && (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center transition-all z-10"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.95)" }}
              >
                <Camera size={26} stroke="#65584f" strokeWidth={2} />
              </div>
              <span className="text-white text-[13px] font-semibold" style={{ fontFamily: M }}>
                {t("Change cover photo")}
              </span>
            </div>
          </button>
        )}
      </div>

      {/* ── Centered avatar + name + badges ── */}
      <div className="relative flex flex-col items-center px-[20px]" style={{ marginTop: -(AVATAR_SIZE / 2) }}>
        {/* Avatar */}
        <div
          className="relative rounded-full border-[5px] border-white overflow-hidden flex items-center justify-center"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            background: "linear-gradient(135deg, #d6c8ad 0%, #c4b49a 100%)",
            boxShadow: "0 6px 20px rgba(101,88,79,0.20)",
          }}
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt={displayNickname} className="w-full h-full object-cover" />
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
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
              <Camera size={28} stroke="white" strokeWidth={2.2} />
              <span className="text-white text-[10px] font-semibold leading-none" style={{ fontFamily: M }}>
                {t("Change")}
              </span>
            </button>
          )}
        </div>

        {/* Edit-mode hint — clarifies both upload zones */}
        {editing && (
          <p className="mt-[10px] text-[12px] text-[#65584f]/65 text-center" style={{ fontFamily: M }}>
            {t("Tap photo or banner to upload")}
          </p>
        )}

        {/* Name */}
        {editing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("Your name")}
            maxLength={60}
            className="mt-[18px] w-full max-w-[300px] text-center text-[34px] font-bold leading-tight outline-none rounded-[10px] px-[12px] py-[6px]"
            style={{
              color: "#65584f",
              fontFamily: M,
              background: "rgba(255,255,255,0.85)",
              border: "1.5px solid rgba(205,129,136,0.4)",
            }}
          />
        ) : (
          <h1
            className="mt-[18px] text-[40px] font-bold leading-none text-center"
            style={{ color: "#65584f", fontFamily: M }}
          >
            {displayNickname}
          </h1>
        )}

        {/* Badges — centered, blank space if none */}
        <div className="flex flex-wrap gap-[10px] justify-center mt-[18px]" style={{ minHeight: 40 }}>
          {badges.map((id) => {
            const cfg = BADGE_CONFIG[id];
            if (!cfg) return null;
            const { label, Icon, variant } = cfg;
            const isFilled = variant === "filled";
            return (
              <div
                key={id}
                className="inline-flex items-center gap-[8px] rounded-full px-[16px] py-[8px]"
                style={{
                  background: isFilled ? "#cd8188" : "white",
                  border: isFilled ? "none" : "1.5px solid rgba(101,88,79,0.18)",
                  color: isFilled ? "white" : "#65584f",
                  boxShadow: isFilled
                    ? "0 4px 14px rgba(205,129,136,0.30)"
                    : "0 2px 8px rgba(101,88,79,0.06)",
                  fontFamily: M,
                }}
              >
                <Icon size={16} stroke={isFilled ? "white" : "#cd8188"} strokeWidth={2.2} />
                <span className="text-[14px] font-semibold whitespace-nowrap">{t(label)}</span>
              </div>
            );
          })}
        </div>

        {/* Save / Cancel — only in edit mode */}
        {editing && (
          <div className="flex gap-[10px] mt-[18px] w-full max-w-[300px]">
            <button
              type="button"
              onClick={handleCancel}
              disabled={pending}
              className="flex-1 rounded-[12px] py-[12px] text-[14px] font-semibold flex items-center justify-center gap-[6px] transition-all active:scale-[0.98] disabled:opacity-50"
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
              className="flex-1 rounded-[12px] py-[12px] text-[14px] font-semibold text-white flex items-center justify-center gap-[6px] transition-all active:scale-[0.98] disabled:opacity-60"
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
