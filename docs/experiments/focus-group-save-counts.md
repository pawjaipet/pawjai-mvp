# Focus-group save-count preview

Share `https://www.pawjaipet.com/?focus_group_counts=1` with focus-group participants. The page marks itself as a focus-group preview and states that save counts are sample data. The ordinary homepage at `https://www.pawjaipet.com/` shows genuine save counts.

The feed badge displays a deterministic pseudorandom digit from 0–9 per dog, including zero. It stays fixed across renders, refreshes and save clicks so the stimulus does not change mid-session. Actual save actions and account activity continue to use the real backend; the simulated number is never stored. This is a visual prototype, not a controlled A/B experiment. If participants need to use Save or sign up, use designated test accounts and exclude that activity from customer analytics.

The opt-in query parameter is part of the public URL, so anyone who has the link can see the preview. It is not an access control mechanism. Do not share it as an ordinary adoption link.
