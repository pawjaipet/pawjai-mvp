"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

const M = "Montserrat, sans-serif";

type Msg = { id: number; text: string; from: "me" | "shelter"; time: string };

const SHELTER_NAMES: Record<string, string> = {
  "1": "Soi Dog Foundation",
  "2": "Ban Rak Nong Shelter",
  "3": "Happy Paws Bangkok",
};

const INITIAL_MESSAGES: Record<string, Msg[]> = {
  "1": [
    { id: 1, text: "Hi! I'm interested in adopting one of your dogs.", from: "me", time: "10:21" },
    { id: 2, text: "Hello! Thank you for reaching out. Which dog caught your eye?", from: "shelter", time: "10:35" },
    { id: 3, text: "I've been looking at Mochi 🐾 She looks absolutely wonderful.", from: "me", time: "10:36" },
    { id: 4, text: "Mochi is a sweetheart! She's great with kids and very playful. Would you like to schedule a visit?", from: "shelter", time: "10:40" },
    { id: 5, text: "Thank you for your interest! We'd love to meet you.", from: "shelter", time: "10:41" },
  ],
  "2": [
    { id: 1, text: "Mochi is doing great today 🐾", from: "shelter", time: "Yesterday" },
  ],
  "3": [
    { id: 1, text: "Hi, I booked an appointment for next Saturday. Is that still confirmed?", from: "me", time: "3 days ago" },
    { id: 2, text: "Your appointment is confirmed for next Saturday.", from: "shelter", time: "3 days ago" },
  ],
};

export default function ChatThreadPage() {
  const { id } = useParams<{ id: string }>();
  const shelterName = SHELTER_NAMES[id] ?? "Shelter";
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES[id] ?? []);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    setMessages((prev) => [...prev, { id: Date.now(), text, from: "me", time }]);
    setInput("");
    // Simulate shelter response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: "Thanks for your message! We'll get back to you shortly.", from: "shelter", time },
      ]);
    }, 1200);
  }

  return (
    <div
      className="flex flex-col"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto", height: "100dvh", background: "#F5F1E8", fontFamily: M }}
    >
      {/* Header */}
      <div className="flex items-center gap-[12px] px-[16px] py-[14px] shrink-0" style={{ background: "#d6c8ad" }}>
        <Link href="/messages" className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0" style={{ background: "rgba(101,88,79,0.15)" }}>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7L7 13" stroke="#65584f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(101,88,79,0.15)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#65584f" fillOpacity="0.35" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-[#65584f] truncate" style={{ fontFamily: M }}>{shelterName}</p>
          <p className="text-[11px] text-[#65584f]/50" style={{ fontFamily: M }}>Partner shelter</p>
        </div>
        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center" style={{ background: "rgba(101,88,79,0.15)" }}>
          <Link href="/swipe" className="block">
            <div className="w-[36px] h-[36px] relative">
              <Image src="/pawjai-logo.png" alt="PawJai" fill className="object-contain" />
            </div>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-[16px] py-[16px] space-y-[10px]" style={{ scrollbarWidth: "none" }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>

        {/* Date divider */}
        <div className="flex items-center gap-[8px] py-[4px]">
          <div className="flex-1 h-[1px]" style={{ background: "rgba(101,88,79,0.15)" }} />
          <p className="text-[11px] text-[#65584f]/40" style={{ fontFamily: M }}>Today</p>
          <div className="flex-1 h-[1px]" style={{ background: "rgba(101,88,79,0.15)" }} />
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
            {msg.from === "shelter" && (
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 mr-[8px] self-end" style={{ background: "#d6c8ad" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#65584f" fillOpacity="0.4" />
                </svg>
              </div>
            )}
            <div className="max-w-[72%]">
              <div
                className="rounded-[18px] px-[14px] py-[10px] text-[14px]"
                style={{
                  background: msg.from === "me" ? "#cd8188" : "white",
                  color: msg.from === "me" ? "white" : "#65584f",
                  fontFamily: M,
                  borderBottomRightRadius: msg.from === "me" ? 4 : 18,
                  borderBottomLeftRadius: msg.from === "shelter" ? 4 : 18,
                }}
              >
                {msg.text}
              </div>
              <p className={`text-[10px] mt-[3px] text-[#65584f]/40 ${msg.from === "me" ? "text-right" : "text-left"}`} style={{ fontFamily: M }}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-[16px] py-[12px] flex items-center gap-[10px]" style={{ background: "white", borderTop: "1px solid rgba(214,200,173,0.5)", paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          className="flex-1 rounded-full px-[16px] py-[10px] text-[14px] text-[#65584f] outline-none border-none"
          style={{ background: "#F5F1E8", fontFamily: M }}
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-40"
          style={{ background: "#cd8188" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
