# PAWJAI Financial Model - Source of Truth

**Reviewed:** 2026-09-03  
**Founder-supplied source:** `/Users/sudlabha/Library/Mobile Documents/com~apple~CloudDocs/Mac Downloads/PAWjai Projection FINAL.xlsx`  
**Workbook state:** Base scenario selected (`Assumptions!B2 = 1`)  
**Scope:** 120 monthly periods / 10 years

Use this note as the persistent context for future PAWJAI financial, budget, pitch, and scale work. The workbook remains the authoritative calculation file. This note records what it says; it does not turn assumptions into evidence.

## Authority and use rules

- Treat all financial figures below as projections, not current revenue, traction, contractual pricing, or audited actuals.
- Use the Base case unless the founder explicitly requests Best, Worst, or a new scenario.
- State the scenario and time period whenever presenting model outputs.
- Do not claim PAWJAI already holds a broker or insurer licence. Those are future phases in Model B.
- Do not claim the insurance conversion, premium, loss ratio, shelter growth, CAC, retention, CPM, or marketplace take rates have been validated unless separate evidence is supplied.
- Do not silently change workbook assumptions. Explain proposed changes and preserve a comparison to the founder-supplied Base case.
- This workbook is the source of truth for projections only. Current product, partner, user, dog-listing, and budget facts still require current operational evidence.

## Model structure

### Model A - ads and marketplace

Model A is the earlier revenue engine and is driven by active-user volume.

1. Advertising is live from the start.
2. Affiliate commerce starts in month 25.
3. PAWJAI's own marketplace starts in month 37.

### Model B - pet insurance

Model B is the later, adoption-driven revenue engine.

1. Insurance distribution begins in month 13.
2. An own broker-licence phase begins in month 25.
3. An own-insurer phase begins in month 37.

### Combined model

The Summary combines Model A and Model B and counts shared cloud cost once. Model B revenue first exceeds Model A in Year 5; Model B profit first exceeds Model A in Year 7.

## Active Base assumptions

### Model A - acquisition and engagement

| Assumption | Base value |
|---|---:|
| Marketing spend in month 1 | THB 10,000/month |
| Marketing-spend growth | 6% monthly, tapering as the market fills |
| Marketing ceiling | THB 200,000/month |
| CAC | THB 40/new user |
| Monthly retention | 60% |
| Viral coefficient | 0.55 organic new users/user/month |
| Addressable MAU ceiling | 300,000 |
| Sessions | 4/user/month |
| Dogs viewed | 30/session |

### Model A - monetization

| Assumption | Base value |
|---|---:|
| Ad frequency | 1 ad per 3 dogs |
| Fill rate | 70% |
| Direct-sold share | 20% |
| Direct/endemic CPM | THB 150 |
| Programmatic CPM | THB 25 |
| MAU ordering each month | 2% |
| Average basket | THB 800 |
| Affiliate start / take | Month 25 / 8% |
| Own marketplace start / take | Month 37 / 15% |
| Commerce running cost | 3% of sales |

### Model B - shelter supply

| Assumption | Base value |
|---|---:|
| Marketing spend in month 1 | THB 5,000/month |
| Marketing-spend growth | 5% monthly |
| Marketing ceiling | THB 40,000/month |
| Shelters at launch | 2 |
| Shelter sign-up growth | 12% monthly |
| Reachable-shelter ceiling | 60 |
| Current adoption baseline | 1.5/shelter/month |
| Annual adoption-rate growth | 15% |
| Maximum adoption rate | 4/shelter/month |

### Model B - conversion, ticket, and insurance economics

| Assumption | Base value |
|---|---:|
| Insurance start | Month 13 |
| Offer shown | 100% of adoptions |
| Accepted by underwriter | 80% |
| Purchase rate | 70% of accepted applicants |
| Annual attach-rate growth | 10%, capped at 100% |
| Blended monthly premium | THB 264 |
| Annual policy retention | 75% |
| Own broker-licence phase | Month 25 |
| Own-insurer phase | Month 37 |
| Referral take | 9% of premium |
| Broker take | 18% of premium |
| Loss ratio | 55% |
| Reinsurance ceded | 10% of premium |
| Claims handling and admin | 5% of premium |

### Costs and exclusions

| Assumption | Base value |
|---|---:|
| Shared cloud/hosting/API | THB 1,000/month |
| Shared field operations | THB 2,000/month |
| Insurance partnership/BD | THB 15,000/month once insurance is live |
| Compliance and actuarial | THB 25,000/month once licensed |
| One-off licence cost | THB 400,000 in Model B phase 2 |
| One-off product build | THB 600,000 in Model B phase 3 |

The model explicitly excludes salaries, development capex, and office costs. Add founder/team compensation and any missing operating costs before using it as an investor-grade financing requirement.

## Base-case outputs

### Model A

| Metric | Year 1 | Year 3 | Year 5 | Year 10 |
|---|---:|---:|---:|---:|
| End-of-year MAU | 8,889 | 81,614 | 101,349 | 107,248 |
| Revenue | THB 58,802 | THB 2,153,748 | THB 4,460,523 | THB 4,890,500 |
| Cost | THB 180,313 | THB 607,912 | THB 2,196,778 | THB 3,029,747 |
| Net profit | THB (121,511) | THB 1,545,836 | THB 2,263,745 | THB 1,860,753 |
| Cumulative cash | THB (121,511) | THB 1,510,736 | THB 6,320,899 | THB 15,604,365 |

- First profitable month: 17.
- Cash-payback month: 25.
- Year 10 MAU is 35.7% of the modeled 300,000 addressable ceiling.
- Year 10 revenue per active user per month is THB 3.80.

### Model B

| Metric | Year 1 | Year 3 | Year 5 | Year 10 |
|---|---:|---:|---:|---:|
| Shelters onboarded | 6.5 | 40.3 | 58.6 | 60.0 |
| Adoptions in year | 69.7 | 732.3 | 1,795.1 | 2,879.9 |
| Cumulative dogs rehomed | 69.7 | 1,064.6 | 4,194.3 | 17,464.8 |
| Active policies | 0 | 552.9 | 2,236.5 | 6,431.0 |
| Premium collected | THB 0 | THB 1,101,339 | THB 5,761,757 | THB 19,605,040 |
| Revenue | THB 0 | THB 198,241 | THB 5,761,757 | THB 19,605,040 |
| Cost | THB 115,586 | THB 1,172,672 | THB 5,029,230 | THB 14,719,528 |
| Net profit | THB (115,586) | THB (974,431) | THB 732,527 | THB 4,885,512 |
| Cumulative cash | THB (115,586) | THB (1,429,555) | THB (1,345,841) | THB 15,477,714 |

- First profitable month: 45.
- Cash-payback month: 71.
- Year 10 reaches the modeled cap of 4 adoptions/shelter/month, or about 240 adoptions/month across all shelters.
- Year 10 net insurance attach rate is 80%.
- Year 10 revenue per paying customer per month is THB 264 because the model is in its own-insurer phase and recognizes the full premium as revenue.

### Combined model

| Metric | Year 1 | Year 3 | Year 5 | Year 10 |
|---|---:|---:|---:|---:|
| Revenue | THB 58,802 | THB 2,351,989 | THB 10,222,280 | THB 24,495,540 |
| Cost, with shared costs counted once | THB 283,898 | THB 1,768,583 | THB 7,214,008 | THB 17,737,275 |
| Net profit | THB (225,096) | THB 583,405 | THB 3,008,272 | THB 6,758,265 |
| Model B share of revenue | 0.0% | 8.4% | 56.4% | 80.0% |

## Interpretation for future work

- Model A is the near-term commercialization case: audience growth, paid acquisition, advertising, then affiliate and marketplace commissions.
- Model B is the larger long-term case but carries much greater regulatory, underwriting, claims, capitalization, and adoption-throughput risk.
- The product strategy should not be described as a premium app-subscription model. This workbook models ads, commerce, and pet-insurance economics.
- The current adoption baseline embedded in the model is 1.5 adoptions per shelter per month, consistent with the founder's stated current range of roughly 1-2.
- At the modeled Year 10 endpoint, insurance contributes 80% of combined revenue. PAWJAI therefore becomes economically insurance-heavy even though the platform begins with adoption discovery and ads.

## Main sensitivities and cautions

1. **Insurance attach is aggressive.** The Base inputs imply an initial gross purchase rate of 56% of adoptions (`80% underwriter acceptance x 70% purchase`). The workbook itself notes a 15-35% UK point-of-adoption reference. Do not present 56% or the later 80% net attach as validated.
2. **Shelter throughput is the central unproven operating assumption.** Model B grows from 1.5 to the cap of 4 adoptions per shelter per month and nearly saturates 60 reachable shelters.
3. **Insurance accounting changes by phase.** Before the own-insurer phase, revenue is a referral/broker take. From month 37, the model recognizes gross premium as revenue and places losses, reinsurance, claims administration, and related costs below it. Explain this when comparing years.
4. **The model is bootstrapped and incomplete as a funding model.** It excludes salaries, development capex, and office costs and does not visibly model all capital/reserve requirements associated with becoming an insurer.
5. **Best case is an upper bound.** The workbook warns that Model A's Best case saturates its market by Year 3 and should not be presented as an operating plan.
6. **No assumption is evidence by itself.** Support investor or grant materials with current analytics, partner confirmations, supplier quotes, ad-platform benchmarks, legal/regulatory advice, and actual invoices where available.

## Workbook map

- `Summary!A1:F55`: headline outputs, combined model, reality checks, and usage notes.
- `Assumptions!A1:F59`: Base/Best/Worst inputs; active scenario in `B2`; active values in column `E`.
- `Model A!A1:DR47`: key outputs plus 120-month ads-and-marketplace model.
- `Model B!A1:DR52`: key outputs plus 120-month insurance model.

Inspection on 2026-09-03 found no spreadsheet formula errors. The workbook was read only and was not modified.
