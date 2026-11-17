"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, PawPrint, RotateCcw, Save, Search } from "lucide-react";
import sample from "@/data/rescue-dog-thailand-dogs.json";
import "./review.css";

type Dog = { id: string; name: string; photo: string; gender: string; breed: string; color: string; size: string; energy: string; social: string; notes: string; available: boolean; status: "draft" | "available" };
const KEY = "pawjai-review-prototype-v2";
const initial: Dog[] = sample.slice(0, 12).map((dog, i) => ({ id: `sample-${i}`, name: dog.name, photo: `https://media.pawjaipet.com/file/pawjai/${dog.coverMediaStoragePath}`, gender: i < 9 && i % 3 === 0 ? "" : dog.gender, breed: i < 9 && i % 3 === 1 ? "" : "Mixed breed", color: i < 9 && i % 3 === 2 ? "" : dog.coatColor, size: "Medium", energy: "", social: "", notes: "", available: i > 8, status: i > 8 ? "available" : "draft" }));
function missing(dog: Dog) { return [!dog.name.trim() && "Name", !dog.gender && "Gender", !dog.breed.trim() && "Breed", !dog.color.trim() && "Colour", !dog.size && "Size", !dog.available && "Availability"].filter(Boolean) as string[]; }

function DogMedia({ dog, portrait = false }: { dog: Dog; portrait?: boolean }) {
  return /\.(mp4|mov|webm)$/i.test(dog.photo)
    ? <video className={portrait ? "portrait" : "tile-video"} src={`${dog.photo}#t=0.1`} aria-label={dog.name} muted playsInline loop autoPlay={portrait} preload="metadata" />
    : <img className={portrait ? "portrait" : undefined} src={dog.photo} alt={dog.name} />;
}

function QuickReview({ dog, children }: { dog: Dog; children: React.ReactNode[] }) {
  const [questions] = useState(() => missing(dog));
  const [step, setStep] = useState(0);
  const [all, setAll] = useState(false);
  const labels = ["Name", "Gender", "Breed", "Colour", "Size", "Availability"];
  const question = questions[step];
  const prompts: Record<string, string> = { Name: "What's their name?", Gender: "Girl or boy?", Breed: "Which breed or mix?", Colour: "What colour is their coat?", Size: "How big are they?", Availability: "Ready to find a home?" };
  return <section className="quick-review">
    <div className="question-progress"><span>{question ? `Quick check ${step + 1} of ${questions.length}` : "Quick check complete"}</span><span>{6 - missing(dog).length}/6 essentials</span></div>
    <div className="step-dots" aria-hidden="true">{labels.map(label => <i key={label} className={!missing(dog).includes(label) ? "done" : ""} />)}</div>
    {question && !all ? <div className="question-body" key={question}><h2>{prompts[question]}</h2>{children[labels.indexOf(question)]}<div className="question-actions"><button disabled={step === 0} aria-label="Previous question" onClick={() => setStep(s => s - 1)}><ChevronLeft size={18} /></button><button onClick={() => setStep(s => s + 1)}>{missing(dog).includes(question) ? "Skip for now" : "Next"}<ArrowRight size={18} /></button></div></div> : !all ? <div className="review-ready"><CheckCircle2 size={40} /><h2>{missing(dog).length ? "A good start." : "Ready for a new chapter."}</h2><p>{missing(dog).length ? `${missing(dog).length} details still needed. You can save a draft.` : `${dog.name}'s essentials are complete.`}</p></div> : null}
    <button className="review-toggle" aria-expanded={all} onClick={() => setAll(v => !v)}>{all ? "Back to quick check" : "Review all details"}</button>
    {all && <div className="fields">{children}</div>}
  </section>;
}

export default function ReviewPreview() {
  const [dogs, setDogs] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("draft");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Dog | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [reviewed, setReviewed] = useState<string[]>([]);
  const touch = useRef<number | null>(null);
  useEffect(() => {
    try { const saved = localStorage.getItem(KEY); if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed) && parsed.length === initial.length && parsed.every((d: Dog) => initial.some(x => x.id === d.id) && typeof d.name === "string" && typeof d.color === "string" && typeof d.breed === "string")) setDogs(parsed); } } catch { setError("Saved preview could not be restored. Starting with sample profiles."); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const filtered = dogs.filter(d => (view === "all" || d.status === view) && d.name.toLowerCase().includes(search.toLowerCase()));
  const drafts = dogs.filter(d => d.status === "draft").length;
  const position = active ? queue.indexOf(active.id) : -1;
  function open(dog: Dog) { setQueue(filtered.map(d => d.id)); setActive({ ...dog }); setDirty(false); setNotice(""); window.scrollTo(0, 0); }
  function change(patch: Partial<Dog>) { setActive(d => d ? { ...d, ...patch } : d); setDirty(true); setNotice(""); }
  function persist(next: Dog[]) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); setDogs(next); setError(""); return true; }
    catch { setError("Could not save on this device. Your changes are still here. Please try again."); return false; }
  }
  function move(direction: number) {
    if (dirty && !window.confirm("Leave without saving these changes?")) return;
    const next = dogs.find(d => d.id === queue[position + direction]);
    if (next) { setActive({ ...next }); setDirty(false); setNotice(""); window.scrollTo(0, 0); }
  }
  function save(draft: boolean) {
    if (!active) return;
    const saved = { ...active, status: (!draft && missing(active).length === 0 ? "available" : "draft") as Dog["status"] };
    if (!persist(dogs.map(d => d.id === saved.id ? saved : d))) return;
    setDirty(false); setActive(saved); setReviewed(ids => [...new Set([...ids, saved.id])]);
    setNotice(`${saved.name} saved ${saved.status === "available" ? "to Available" : "as a draft"}.`);
    if (!draft) { const next = dogs.find(d => d.id === queue[position + 1]); setActive(next ? { ...next } : null); window.scrollTo(0, 0); }
  }
  const field = (key: "name" | "breed" | "color", label: string) => active && <label className={!active[key].trim() ? "missing" : ""}>{label} <span aria-label="required">*</span><input value={active[key]} onChange={e => change({ [key]: e.target.value })} />{!active[key].trim() && <small>Needed before listing</small>}</label>;
  const choices = (key: "gender" | "size" | "energy" | "social", label: string, values: string[], required = false) => active && <fieldset className={required && !active[key] ? "missing" : ""}><legend>{label} {required ? <span aria-label="required">*</span> : <em>Optional</em>}</legend><div className="choices">{values.map(value => <button key={value} aria-pressed={active[key] === value} onClick={() => change({ [key]: active[key] === value ? "" : value })}>{active[key] === value && <Check size={14} />}{value}</button>)}</div>{required && !active[key] && <small>Needed before listing</small>}</fieldset>;
  return <div className="review-demo">
    <header><img src="/pawjai-logo.png" alt="PawJai" /><div><strong>Shelter workspace</strong><span>Demo shelter · Local preview</span></div><span className="sample-badge">Sample data</span></header>
    <main>
      {notice && <div className="notice" role="status"><CheckCircle2 size={20} />{notice}</div>}
      {error && <div className="error" role="alert">{error}</div>}
      {!active ? <>
        <div className="heading"><div><p>DOG LISTINGS</p><h1>A little time. A big difference.</h1><span>{drafts} profiles need a few details before they can be listed.</span></div><button className="primary" disabled={!loaded || !drafts} onClick={() => { const pending = dogs.filter(d => d.status === "draft"); setQueue(pending.map(d => d.id)); setActive({ ...pending[0] }); setDirty(false); }}><ClipboardCheck size={18} />Start reviewing</button></div>
        <div className="progress-row"><span><CheckCircle2 size={18} />{reviewed.length} reviewed this session</span><progress value={reviewed.length} max={dogs.length} /><span>{dogs.length - drafts} / {dogs.length} available</span></div>
        <div className="tools"><div className="tabs" role="tablist" aria-label="Dog status">{[["draft", "Needs information", drafts], ["available", "Available", dogs.length - drafts], ["all", "All dogs", dogs.length]].map(([id, label, count]) => <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(String(id))}>{label}<b>{count}</b></button>)}</div><label className="search"><Search size={18} /><input aria-label="Search dogs" placeholder="Find a dog" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
        <div className="dog-grid">{filtered.map(d => <button className="dog-tile" key={d.id} onClick={() => open(d)}><div className="photo"><DogMedia dog={d} /><span className={d.status === "available" ? "ready" : "pending"}>{d.status === "available" ? <Check size={14} /> : missing(d).length}{d.status === "draft" && " to fill"}</span></div><div className="tile-info"><strong>{d.name}</strong><span>{d.status === "available" ? "Available" : missing(d).slice(0, 2).join(" · ")}</span></div></button>)}</div>
        {!filtered.length && <div className="empty"><PawPrint /><h2>{view === "draft" && !search ? "All caught up" : "No dogs found"}</h2><p>{search ? "Try a different name." : "Your saved profiles are in Available."}</p></div>}
        <footer><span>Demo shelter · {dogs.length} sample profiles</span><button title="Reset sample profiles" aria-label="Reset sample profiles" onClick={() => { if (window.confirm("Reset all local sample edits?")) { if(persist(initial)) { setReviewed([]); setNotice(""); } } }}><RotateCcw size={16} /></button></footer>
      </> : <>
        <div className="review-nav"><button onClick={() => { if (!dirty || window.confirm("Leave without saving these changes?")) { setActive(null); setDirty(false); } }}><ArrowLeft size={18} />All dogs</button><span>{position + 1} of {queue.length}</span><div><button title="Previous dog" aria-label="Previous dog" disabled={position <= 0} onClick={() => move(-1)}><ChevronLeft /></button><button title="Next dog" aria-label="Next dog" disabled={position >= queue.length - 1} onClick={() => move(1)}><ChevronRight /></button></div></div>
        <div className="review-layout"><aside onTouchStart={e => { touch.current = e.touches[0].clientX; }} onTouchEnd={e => { if (touch.current === null) return; const delta = e.changedTouches[0].clientX - touch.current; if (Math.abs(delta) > 70 && ((delta < 0 && position < queue.length - 1) || (delta > 0 && position > 0))) move(delta < 0 ? 1 : -1); touch.current = null; }}><DogMedia dog={active} portrait /><div className="identity"><h1>{active.name || "Unnamed dog"}</h1><span>Demo shelter · {active.id.replace("sample-", "#")}</span><p className={missing(active).length ? "pending-text" : "ready-text"}>{missing(active).length ? `${missing(active).length} essentials left` : "Ready to list"}</p></div></aside>
        <section className="review-fields"><QuickReview key={active.id} dog={active}>{field("name", "Name")}{choices("gender", "Gender", ["female", "male"], true)}{field("breed", "Breed / mix")}{field("color", "Colour")}{choices("size", "Size", ["Small", "Medium", "Large"], true)}
        <label className="availability"><input type="checkbox" checked={active.available} onChange={e => change({ available: e.target.checked })} /><span><strong>Available for adoption *</strong><small>Our team confirms this dog can be listed.</small></span></label></QuickReview>
        <details><summary>Personality & care <span>Optional</span></summary>{choices("energy", "Energy", ["Low", "Medium", "High"])}{choices("social", "With other dogs", ["Friendly", "Selective", "Solo dog"])}<label>Care description<textarea rows={3} value={active.notes} onChange={e => change({ notes: e.target.value })} /></label></details>
        </section></div>
        <div className="save-bar"><span>{dirty ? "Unsaved changes" : "Saved on this device"}</span><button onClick={() => save(true)}><Save size={17} />Save draft</button><button className="primary" onClick={() => save(false)}>Save & next<ArrowRight size={18} /></button></div>
      </>}
    </main>
  </div>;
}
