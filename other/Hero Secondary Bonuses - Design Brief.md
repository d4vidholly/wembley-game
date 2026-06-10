# Hero Secondary Bonuses — Design Brief

## Design Philosophy

Secondary bonuses define what makes each hero worth picking over another at the same price. They must feel grounded in FA Cup lore — a famous match, a known rivalry, a defining moment. The mechanic follows two proven templates from the live heroes:

**The Wembley/Round trigger** — Drogba, Cole, Beasant. Heroes who elevate on the big occasion.  
**The Match State trigger** — Gerrard, Haaland. Heroes who fire in a specific scoreline or matchup.

The design goal is to build two clear archetypes within each position:

- **The Underdog hero** — fires when facing a stronger team (fewer stars). Flips the Haaland principle.
- **The Match State hero** — fires based on the score or round, regardless of opponent.

No two heroes in the same position should share the same trigger.

---

## Design Constraints

- All primary chances remain at 80%.
- Secondary chances should sit between 35–90% depending on how specific the trigger is. Niche triggers can be more powerful; broad triggers should be kept modest.
- Mechanics stay within the current system: **reduce opposition goals (GK/DEF)** or **add goals (MID/STR)**. No new mechanic types for now.
- Heroes at the same price point should have roughly equivalent expected impact across a full cup run.

---

## Reference: Live Heroes

| Hero | Pos | Secondary Trigger | Chance | Effect |
|------|-----|-------------------|--------|--------|
| Beasant | GK | At Wembley vs a **higher-division** team | 100% | Reduce opp goals by 1 |
| Cole | DEF | At **Wembley** (any opponent) | 90% | Reduce opp goals by 1 |
| Gerrard | MID | After scoring, if **still losing by 1** | 20% | Score again |
| Drogba | STR | At **Wembley** (any opponent) | 100% | Score again |
| Haaland | STR | Facing a **lower-division** team | 50% | Score again |

---

## Proposed Secondaries

### GK — £5,000

All three locked GKs share Beasant's base concept — saving crucial goals — but with distinct triggers that prevent overlap.

---

**Cech**  
*Inspired by: Chelsea's defensive record, penalty save in the 2005 FA Cup Final vs Arsenal. A keeper who makes the saves that matter most when his side are under siege.*

> Secondary fires when the **opposition has scored 2 or more goals**.  
> Chance: **90%**  
> Effect: Reduce opposition goals by 1  
> Flavour: *"Cech refuses to let them score again!"*

Cech's niche is damage limitation. He's largely irrelevant when holding a clean sheet, but becomes the best GK in the game when conceding heavily. This represents his shot-stopping volume and Chelsea's ability to grind out results from bad positions.

---

**Schmeichel**  
*Inspired by: United's never-say-die mentality under Ferguson. The keeper who made saves that kept United alive long enough to find a winner.*

> Secondary fires when his **team is losing**.  
> Chance: **70%**  
> Effect: Reduce opposition goals by 1  
> Flavour: *"Schmeichel keeps United in the fight!"*

A comeback keeper. Useless when winning, valuable when chasing the game — which is when GK impact matters most anyway. Pairs well with Gerrard (stop one, then equalise).

---

**Seaman**  
*Inspired by: Arsenal's consistent FA Cup runs, David Seaman's reliability against top-flight opposition.*

> Secondary fires when facing a **3-star team**.  
> Chance: **85%**  
> Effect: Reduce opposition goals by 1  
> Flavour: *"Seaman stands firm against the best!"*

The elite-opposition stopper. His niche is the opposite of Beasant's — rather than the underdog GK, Seaman is the established keeper who raises his game against the very best. Most valuable in later rounds when top-division opponents appear.

---

### DEF — £10,000

Cole covers Wembley. Ward and Virgil take the remaining two archetypes: underdog and elite-opposition.

---

**Ward**  
*Joel Ward — Crystal Palace, 2016 FA Cup Final. A full-back who kept his side in matches against opposition they had no right to compete with.*

> Secondary fires when his **team has fewer stars than the opposition** (underdog position).  
> Chance: **90%**  
> Effect: Reduce opposition goals by 1  
> Flavour: *"Ward stands firm against the odds!"*

The defensive equivalent of Watson (see below). Ward is the underdog DEF — cheap, reliable, and at his best when the expected result is a heavy defeat. Fires in any round, not just Wembley.

---

**Virgil**  
*Virgil van Dijk — dominant against the best clubs in Europe, Ballon d'Or runner-up, the modern benchmark for elite defending.*

> Secondary fires when facing a **3-star team**.  
> Chance: **90%**  
> Effect: Reduce opposition goals by 1  
> Flavour: *"Van Dijk dominates the area!"*

The mirror of Seaman in DEF. Fires specifically against top-division teams — which means he's most valuable in the Semi-Final and Final where 3-star opponents are most likely to appear.

---

### MID — £20,000

Three distinct triggers: match state (De Bruyne), underdog (Watson), round-specific (Giggs).

---

**De Bruyne**  
*Kevin De Bruyne — at his best in dominant performances, a player who creates more when his team is in control of the game.*

> Secondary fires when his **team is not losing** (drawing or winning) at the point of the roll.  
> Chance: **40%**  
> Effect: Score again  
> Flavour: *"De Bruyne picks his moment and adds another!"*

A momentum player. He rewards good teambuilding — put him in a strong team that scores goals and he becomes a goal machine. Put him in a struggling side and his secondary rarely fires. The 40% keeps him balanced given how often drawing or winning will be the match state.

---

**Watson**  
*Ben Watson — Wigan Athletic, 2013 FA Cup Final. Headed in a 91st-minute winner against Manchester City, who were Premier League champions. One of the greatest FA Cup upsets ever.*

> Secondary fires when his **team is losing AND has fewer stars than the opposition**.  
> Chance: **60%**  
> Effect: Score  
> Flavour: *"Watson heads home a stunning winner!"*

The most conditional secondary in the game — requiring both a losing position AND underdog status — but 60% is a strong reward for hitting that state. This is Watson's moment: the match looks lost, the opponent is bigger, and then he arrives.

---

**Giggs**  
*Ryan Giggs — his most famous FA Cup moment was a solo goal in the Semi-Final vs Arsenal, not the Final itself. A player who thrived on the cup run, not just the occasion.*

> Secondary fires in the **Semi-Final only**.  
> Chance: **60%**  
> Effect: Score again  
> Flavour: *"Giggs runs the show at the last hurdle!"*

A round-specific niche that mirrors Drogba (Final) but for the semi. Most powerful in a long cup run where reaching the Semi-Final is certain. Deliberately useless in the Final — this is Giggs, not Drogba.

---

### STR — £40,000

Vardy completes the STR trio alongside Drogba (Wembley) and Haaland (bully). He takes the remaining archetype: the underdog striker.

---

**Vardy**  
*Jamie Vardy — Leicester City, scores against the big clubs. His record against top-six sides during the title-winning season was remarkable. The anti-Haaland.*

> Secondary fires when his **team has fewer stars than the opposition** (underdog position).  
> Chance: **50%**  
> Effect: Score again  
> Flavour: *"Vardy punishes the big boys!"*

A direct inversion of Haaland. Where Haaland bullies lower-division teams, Vardy shows up when his side are the underdogs. 50% matches Haaland's secondary chance, keeping them equivalent in expected value despite opposite conditions.

---

## Full Trigger Map

| Hero | Pos | Price | Secondary Trigger | Chance |
|------|-----|-------|-------------------|--------|
| Beasant ✓ | GK | £5k | Wembley + vs higher-division | 100% |
| Cech | GK | £5k | Opposition scored 2+ goals | 90% |
| Schmeichel | GK | £5k | Team is losing | 70% |
| Seaman | GK | £5k | Facing a 3-star team | 85% |
| Cole ✓ | DEF | £10k | Wembley (any) | 90% |
| Ward | DEF | £10k | Team has fewer stars (underdog) | 90% |
| Virgil | DEF | £10k | Facing a 3-star team | 90% |
| Gerrard ✓ | MID | £20k | Losing by 1 after scoring | 20% |
| De Bruyne | MID | £20k | Team not losing (drawing/winning) | 40% |
| Watson | MID | £20k | Losing AND fewer stars (underdog) | 60% |
| Giggs | MID | £20k | Semi-Final only | 60% |
| Drogba ✓ | STR | £40k | Wembley (any) | 100% |
| Haaland ✓ | STR | £40k | Team has more stars | 50% |
| Vardy | STR | £40k | Team has fewer stars (underdog) | 50% |

---

## Remaining Questions

1. **Flavour text** — each hero needs two primary text variants (already done for live heroes) and one secondary text line. Do you want to write these, or should they be drafted as part of this task?

2. **Hero images** — Ward, Watson, Schmeichel, Seaman, Virgil, De Bruyne, Giggs, Vardy, Cech all need portrait images in `heroes/` (PNG preferred). Will you supply these or are they being sourced?

3. **Release order** — do all 9 unlock at once, or is there a preferred sequence? Cech and Vardy are most mechanically ready and could go first.

4. **Seaman vs Virgil overlap** — both fire vs 3-star teams, in different positions. This is intentional (they defend together) but worth flagging in case you'd prefer Virgil to have a different trigger.

---

*Brief updated May 2026 following design direction confirmed by David Holly.*
