"""Write inventory-2026-11-17/qa-decisions-v3.json from the v3 QA results.

Input: review/v3/qa-final.json  {dog_id: {"decision": "passed"|"failed", "notes": str}}
(the reviewed outcome for every rendered dog), plus the fixed keep-original reasons below.
"""
import json, os
ROOT = os.path.expanduser("~/PAWJAI-HQ/studio/white-background-study")
INV = f"{ROOT}/inventory-2026-11-17"
sources = json.load(open(f"{INV}/sources.json"))
cls = json.load(open(f"{INV}/classification.json"))
final = json.load(open(f"{ROOT}/review/v3/qa-final.json"))
v2 = json.load(open(f"{INV}/qa-decisions-v2.json"))
KEEP = {
    "Taengkwa": "background already clean and attractive (soft green foliage)",
    "Roselyn": "background already clean and attractive (tidy lawn, house and hedge)",
    "Tulip": "cannot be cut cleanly: another dog stands in front of her and covers part of her body",
    "Poo": "cannot be cut cleanly: a table edge hides the lower half of his body, so removing it would leave him cut off",
    "Sky": "cannot be cut cleanly: his front paws rest on a person; removing the person would misstate the scene",
    "วอน": "three dogs in the photo; it is not clear which one is วอน",
    "White Egg": "cover is a letterboxed screenshot with a pole in front of the dog",
    "Jessica": "cannot be cut cleanly: her ear lies over the dog behind her",
    "Tua-tom": "cannot be cut cleanly: another dog's head touches his ear",
    "ตัวแดง (Tua Daang)": "cannot be cut cleanly: wispy head fur and the open mouth sit over the event banner",
    "Marshmallow": "strong green light from the grass on the white coat cannot be removed with global adjustments",
    "Demi": "hard backlit midday sun on the dog cannot be matched to soft studio light without retouching",
    "แม่น้ำ (River)": "cannot be cut cleanly: her tail lies on the floor under her belly, mostly hidden",
    "Nam oi": "cannot be cut cleanly: her tail lies on patterned tile and tile shows between her legs",
    "Aurora": "cannot be cut cleanly: her white tail against the grass comes out semi-transparent",
}
FIXED = {"เฮงเฮง (hong hong)", "ยะลา (yala)", "Omega", "Gorya", "Butcher", "Tua-lheung"}
out = {}
for r in sources:
    dog, name = r["dog_id"], r["name"]
    c = cls.get(dog, {})
    bg = v2.get(dog, {}).get("background", "")
    if c.get("classification") == "existing_studio":
        continue  # genuine studio photos are listed separately as retained
    if r.get("adoption_status") != "available":
        out[dog] = {"decision": "not_selected", "reason": "adopted (not in the feed)"}
    elif r.get("cover_type") != "photo":
        out[dog] = {"decision": "not_selected", "reason": "video cover (the feed plays the video)"}
    elif name in KEEP:
        out[dog] = {"decision": "not_selected", "reason": KEEP[name]}
    elif dog in final:
        f = final[dog]
        out[dog] = {"decision": f["decision"], "cohort": "c1" if f["decision"] == "passed" else None,
                    "background": f.get("background") or bg, "notes": f.get("notes", ""),
                    "mask_fixed": name in FIXED}
    else:
        out[dog] = {"decision": "not_selected", "reason": "not processed"}
json.dump(out, open(f"{INV}/qa-decisions-v3.json", "w"), ensure_ascii=False, indent=1)
from collections import Counter
print(Counter(v["decision"] for v in out.values()))
