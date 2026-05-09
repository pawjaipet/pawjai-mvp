"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Check, X, Pencil } from "lucide-react";
import { updateProfile } from "@/app/profile/actions";

const M = "Montserrat, sans-serif";

interface Props {
  initialNickname: string;
  initialFullName: string;
  initialAvatarUrl: string | null;
  initialCoverUrl: string | null;
  badges: string[];
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

      {/* ── Banner ── */}
      <div
        className="w-full relative overflow-hidden"
        style={{
          height: 260,
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
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.08]">
            <svg width="200" height="200" viewBox="0 0 100 100" fill="#65584f">
              <ellipse cx="50" cy="75" rx="22" ry="18" />
              <ellipse cx="20" cy="55" rx="10" ry="13" />
              <ellipse cx="80" cy="55" rx="10" ry="13" />
              <ellipse cx="35" cy="40" rx="9" ry="11" />
              <ellipse cx="65" cy="40" rx="9" ry="11" />
            </svg>
          </div>
        )}

        {/* Change cover overlay — only in edit mode */}
        {editing && (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center transition-all"
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
                Change cover photo
              </span>
            </div>
          </button>
        )}

        {/* Gradient fade at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[80px] pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(245,241,232,0.6))" }}
        />
      </div>

      {/* ── White card panel ── */}
      <div
        className="mx-[12px] rounded-[20px] px-[20px] pt-[16px] pb-[20px]"
        style={{
          marginTop: -20,
          background: "white",
          boxShadow: "0 4px 24px rgba(101,88,79,0.10)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Avatar — overlapping banner */}
        <div
          className="absolute rounded-full border-[4px] border-white overflow-hidden flex items-center justify-center"
          style={{
            top: -54,
            left: 20,
            width: 100,
            height: 100,
            background: "linear-gradient(135deg, #d6c8ad 0%, #c4b49a 100%)",
            boxShadow: "0 4px 16px rgba(101,88,79,0.18)",
          }}
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt={displayNickname} className="w-full h-full object-cover" />
          ) : (
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12ZM12 14C8.67 14 2 15.68 2 19V21H22V19C22 15.68 15.33 14 12 14Z"
                fill="rgba(101,88,79,0.4)"
              />
            </svg>
          )}

          {/* Camera overlay — only in edit mode */}
          {editing && (
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              <Camera size={22} stroke="white" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Top-right action buttons */}
        <div className="flex justify-end gap-[8px]" style={{ minHeight: 40 }}>
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={pending}
                className="rounded-[10px] px-[12px] py-[9px] text-[13px] font-semibold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: "white",
                  border: "1.5px solid rgba(101,88,79,0.2)",
                  color: "#65584f",
                  fontFamily: M,
                }}
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={pending}
                className="rounded-[10px] px-[14px] py-[9px] text-[13px] font-semibold text-white flex items-center gap-1 transition-all active:scale-95 disabled:opacity-60"
                style={{ background: "#cd8188", fontFamily: M }}
              >
                <Check size={14} /> {pending ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-[10px] px-[16px] py-[9px] text-[13px] font-semibold text-white flex items-center gap-[6px] transition-all active:scale-95"
              style={{ background: "#cd8188", fontFamily: M }}
            >
              <Pencil size={13} /> Edit Profile
            </button>
          )}
        </div>

        {/* Name */}
        {editing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={60}
            className="w-full text-[28px] font-bold leading-tight outline-none rounded-[8px] px-[10px] py-[4px] -ml-[10px] mt-[4px]"
            style={{
              color: "#65584f",
              fontFamily: M,
              background: "rgba(214,200,173,0.25)",
              border: "1.5px solid rgba(205,129,136,0.4)",
            }}
          />
        ) : (
          <h1
            className="text-[32px] font-bold leading-tight"
            style={{ color: "#65584f", fontFamily: M, marginTop: 4 }}
          >
            {displayNickname}
          </h1>
        )}

        {/* Badges — blank if none */}
        <div className="flex gap-[8px] flex-wrap mt-[10px]" style={{ minHeight: 30 }}>
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full px-[14px] py-[5px] text-[12px] font-medium"
              style={{
                border: "1.5px solid rgba(101,88,79,0.25)",
                color: "#65584f",
                fontFamily: M,
                background: "transparent",
              }}
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
