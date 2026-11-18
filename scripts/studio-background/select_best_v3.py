"""Pick, per dog, the newest reviewed v3.x render that meets the ship rule (verdict pass, or
realism >= 4 with only minor issues). Renders with known defects found later are excluded.
Writes review/v3/best-version.json (dog_id -> pipeline dir) and review/v3/qa-final.json."""
import json, os
ROOT = os.path.expanduser("~/PAWJAI-HQ/studio/white-background-study")
R = f"{ROOT}/review/v3"
rounds = [("studio-bg-v3.3", "qa-round4.json"), ("studio-bg-v3.2", "qa-round3.json"), ("studio-bg-v3.1", "qa-round2.json")]
# defects found after a render was reviewed (later reviewer or my own inspection)
EXCLUDE = {
    ("studio-bg-v3.1", "67c96c55-8740-44ee-92a0-f39e37bd7d7f"): "hard white block at the hip (bad tail-tuft add)",
    ("studio-bg-v3.2", "67c96c55-8740-44ee-92a0-f39e37bd7d7f"): "hard white block at the hip (bad tail-tuft add)",
    ("studio-bg-v3.1", "732285b0-3d60-4e4e-b739-d9b48f1c93f7"): "far hind leg missing, leash clip fragment",
    ("studio-bg-v3.2", "732285b0-3d60-4e4e-b739-d9b48f1c93f7"): "leash clip fragment",
}
def ok(r):
    serious = [i for i in r["issues"] if i["severity"] in ("major", "blocker")]
    return r["verdict"] == "pass" or (r["realism"] >= 4 and not serious)
by_round = {}
for ver, fn in rounds:
    p = f"{R}/{fn}"
    if os.path.exists(p):
        by_round[ver] = {r["dog_id"]: r for r in json.load(open(p))}
candidates = set(by_round.get("studio-bg-v3.3", {}))
best, final = {}, {}
for dog in sorted(candidates):
    chosen = None
    for ver, _ in rounds:
        r = by_round.get(ver, {}).get(dog)
        if r and ok(r) and (ver, dog) not in EXCLUDE and os.path.isdir(f"{ROOT}/outputs/{ver}/{dog}"):
            chosen = (ver, r); break
    latest = by_round["studio-bg-v3.3"][dog]
    if chosen:
        ver, r = chosen
        best[dog] = ver
        minor = "; ".join(i["problem"][:120] for i in r["issues"][:2])
        final[dog] = {"decision": "passed", "version": ver, "realism": r["realism"], "background": r.get("original_background", ""),
                      "notes": f"Independent review ({ver}): realism {r['realism']}/5, nothing visible at feed size." + (f" Minor: {minor}" if minor else "")}
    else:
        serious = [i for i in latest["issues"] if i["severity"] in ("major", "blocker")] or latest["issues"]
        final[dog] = {"decision": "failed", "realism": latest["realism"], "background": latest.get("original_background", ""),
                      "notes": "Rejected in review: " + "; ".join(f"{i['area']}: {i['problem'][:160]}" for i in serious[:2])}
json.dump(best, open(f"{R}/best-version.json", "w"), indent=1)
json.dump(final, open(f"{R}/qa-final.json", "w"), ensure_ascii=False, indent=1)
from collections import Counter
print(Counter(v["decision"] for v in final.values()), Counter(best.values()))
