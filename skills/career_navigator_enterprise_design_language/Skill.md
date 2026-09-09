---
name: career-navigator-enterprise-design-language
description: 'The single source of truth for all Career Navigator user interface work:
  the core implementation principle (visual consistency, never redesign), the implementation
  workflow and design review process, scope protection rules, semantic design tokens,
  color, typography, spacing, radius, borders, shadows, motion, component standards,
  AI-experience patterns, accessibility requirements, cross-page consistency rules,
  a mandatory pre-merge visual QA checklist, and a definition of done. Use this skill
  for EVERY task that touches the UI — building a new page or screen, adding or modifying
  a component, styling, theming, restyling, fixing layout or spacing, adjusting colors
  or typography, implementing a design handoff, reviewing a pull request that changes
  markup or CSS, or writing any front-end code for Career Navigator. Use it even when
  the request sounds small ("just make this button bigger", "add a badge here", "make
  this look nicer", "polish this page"), even when no design file is provided, and
  even when the request is primarily about functionality but produces visible output.
  If the change is visible to a user, this skill applies. Consult it BEFORE writing
  code, not after — it defines both what to build and what you are not permitted to
  change.'
enabled: true
---

# CAREER NAVIGATOR — ENTERPRISE DESIGN LANGUAGE
Internal Enterprise Product Design Standard · Applies to every surface, every page,
every release.

This document is normative. Where this standard and a personal preference disagree,
this standard wins. Where this standard and an existing production page disagree,
raise it — do not silently invent a third option.

Sections 00–06 govern HOW work is carried out. Sections 1–16 govern WHAT is built.
Both are binding. When they appear to conflict, Sections 00–06 win: a visually
superior result produced outside the requested scope is a defect, not an improvement.

────────────────────────────────────────────────────────────────────────
## 00. CORE IMPLEMENTATION PRINCIPLE
────────────────────────────────────────────────────────────────────────

**This Design Language exists for visual enhancement and consistency. It is not a
mandate to redesign anything.**

Its purpose is to make existing screens more consistent, more legible, more
accessible, and more maintainable — while leaving their structure, behavior, and
architecture exactly as they are. Applying this standard to a page should change how
that page looks and feels, not how it works or how it is organized.

Unless a task **explicitly and specifically requests a redesign**, you must NEVER:

- **Change layouts** — no altering grids, column counts, container arrangements,
  alignment strategy, or the position of regions on the page.
- **Move components** — no relocating buttons, filters, toolbars, panels, actions, or
  any element from where it currently sits.
- **Change page structure** — no adding, removing, merging, splitting, or reordering
  sections, regions, or containers.
- **Change information hierarchy** — no promoting or demoting content, no re-ranking
  what appears first, no changing what is emphasized versus de-emphasized.
- **Change navigation** — no altering nav items, labels, ordering, grouping, depth,
  breadcrumbs, tab sets, or navigation behavior.
- **Change workflows** — no altering step order, step count, entry points, exit
  points, confirmation flows, or how a user progresses through a task.
- **Change business logic** — no touching calculations, validation rules, permissions,
  state machines, or conditional behavior.
- **Change APIs** — no new endpoints, altered request or response shapes, changed
  parameters, or modified data contracts.
- **Change routing** — no changes to URLs, route names, navigation targets,
  redirects, or deep links.
- **Change responsive behavior** — no altering breakpoints, collapse strategies,
  stacking order, or how the interface adapts across viewports.

**Visual consistency always takes precedence over structural redesign.** A page that
is internally coherent and matches its neighbors is more valuable than a page that is
individually optimal. If you believe a structural change would materially improve the
product, do not make it — describe it, propose it, and wait for it to be requested.

If a task is ambiguous about whether redesign is in scope, treat it as **not** in
scope and ask.

────────────────────────────────────────────────────────────────────────
## 01. IMPLEMENTATION WORKFLOW
────────────────────────────────────────────────────────────────────────

Every UI task follows these seven steps in order. No step is optional, and no step is
skipped because a task looks small.

**Step 1 — Understand the requested scope.**
Restate the task in one sentence, then write down explicitly what is in scope and what
is out of scope. Identify the exact files, components, and screens involved.
Distinguish clearly between what was asked for and what you happen to notice while
looking. If the scope is unclear, ask before writing code; do not resolve ambiguity by
doing more.

**Step 2 — Inspect similar existing pages.**
Open at least two comparable screens already in production. Read how they are built:
which components they use, which tokens they reference, how they space and align
content, how they place actions, how they handle loading, empty, and error states.
The product as it exists is the primary reference — this document explains the
reasoning, but existing screens define current practice.

**Step 3 — Reuse existing components.**
Build from the component library. Compose from existing primitives before extending
one; extend before creating. Copying a component to modify it locally is prohibited —
if a variant is needed, add a documented variant to the shared component. If you
believe the library is missing something, stop and propose it (Section 04).

**Step 4 — Apply existing semantic tokens.**
Every color, size, space, radius, shadow, and duration comes from the token layer,
referenced by meaning rather than appearance. No literal values. If you cannot find a
token for something you need, that is a signal to re-examine the approach, not a
licence to hard-code.

**Step 5 — Apply only visual improvements.**
Change styling, spacing, typography, color usage, states, and accessibility
attributes. Do not change markup structure beyond what styling genuinely requires,
and never in ways that alter reading order, semantics, or DOM order. Leave logic,
data flow, props contracts, routing, and API calls untouched.

**Step 6 — Run the Visual QA checklist.**
Complete Section 14 in full. Every item is checked or explicitly waived with a written
reason. A partially completed checklist means the task is not finished.

**Step 7 — Verify consistency with neighboring pages before completion.**
Place the changed screen side by side with the pages a user would reach immediately
before and after it. Confirm that headings, spacing, buttons, cards, forms, states,
and terminology match. Anything that now looks different must either be corrected or
reported as a product-wide inconsistency — never left as a local divergence.

Finally, report what you changed, what you deliberately did not change, and anything
you noticed but left alone.

────────────────────────────────────────────────────────────────────────
## 02. DESIGN REVIEW PROCESS
────────────────────────────────────────────────────────────────────────

Every UI task — from a one-line style fix to a new screen — passes through this
sequence:  What each stage requires:

1. **Review existing UI.** Look at the current screen and its neighbors before forming
   any opinion. Understand why it is built the way it is.
2. **Compare with Enterprise Design Language.** Check the screen against this
   document — tokens, type roles, spacing scale, component standards, states,
   accessibility.
3. **Identify inconsistencies.** Write them down as a list. Separate them into those
   inside the requested scope and those outside it. Outside-scope findings are
   reported, not fixed.
4. **Reuse existing design patterns.** For each in-scope item, find the established
   pattern that resolves it. Reuse beats extension; extension beats invention.
5. **Implement only the requested scope.** Fix the in-scope list. Nothing else,
   however tempting.
6. **Run Visual QA.** Section 14, completely.
7. **Verify cross-page consistency.** Section 13. Confirm neighboring pages still
   agree with the changed one, and that the change did not create a new outlier.

The output of a review is always two things: the change itself, and a short written
list of the inconsistencies found but intentionally left alone.

────────────────────────────────────────────────────────────────────────
## 03. SCOPE PROTECTION
────────────────────────────────────────────────────────────────────────

Scope creep in a mature product is a source of regressions, review burden, and merge
conflict — not of quality. Visual work stays visual and stays small.

Unless explicitly requested, visual work must **never** include:

- **Refactoring** — no restructuring code, renaming props, extracting hooks, splitting
  files, reorganizing directories, changing state management, or "cleaning up" code
  that is merely unfamiliar.
- **Component rewrites** — no replacing a working component with a new implementation,
  no swapping the underlying element or library, no changing a component's public API.
- **Layout redesign** — no new grids, no relocated regions, no changed density
  strategy, no altered page anatomy.
- **New design patterns** — no novel interaction models, no new component types, no
  invented variants (see Section 04).
- **New dependencies** — no packages, icon sets, fonts, CSS frameworks, animation
  libraries, or utilities added to the project.
- **Architecture changes** — no new abstractions, no changes to routing or data
  fetching strategy, no build or tooling configuration changes.

Operating rules:

- The requested scope is a ceiling, not a starting point.
- Adjacent problems are documented, not solved. Write them down and hand them back.
- "While I was in there" is not a justification. Every additional change must be
  separately requested and separately reviewed.
- If completing the requested task genuinely requires something on the prohibited
  list, stop and say so, explain why, and propose it as its own piece of work.
- When in doubt, do less and report more.

────────────────────────────────────────────────────────────────────────
## 04. CONSISTENCY BEFORE CREATIVITY
────────────────────────────────────────────────────────────────────────

In a mature enterprise product, the value of a pattern comes largely from its
repetition. A slightly better button that exists in one place is worse than an
adequate button that exists everywhere, because users pay the learning cost and the
team pays the maintenance cost.

**Always prioritize consistency over inventing a visually better component.**

- Match what exists, even when you can see a more elegant alternative.
- A local improvement that diverges from the system is a regression, no matter how it
  looks in isolation.
- Novelty is not a design goal. Recognition, predictability, and reuse are.

**When you discover a genuinely better pattern**, follow this path — in this order:

1. **Do not implement it locally.** Complete the current task using the existing
   pattern.
2. **Write the proposal.** Describe the problem with the current pattern, the proposed
   replacement, the tokens and states it requires, its responsive and accessibility
   behavior, and every place in the product it would affect.
3. **Get it adopted as a shared standard.** It is added to this document and to the
   component library, with documentation.
4. **Migrate deliberately.** Once it is a standard, existing usages are migrated as
   planned work — not opportunistically, and never leaving the product half-migrated
   without a tracked plan.

Until a pattern has completed that path, it does not exist. Creativity is spent on
proposals; implementation is spent on consistency.

────────────────────────────────────────────────────────────────────────
## 05. ENTERPRISE MINDSET
────────────────────────────────────────────────────────────────────────

Approach every task as a **Senior Product Designer and Senior Frontend Engineer
working on a mature enterprise product** with many existing screens, many users who
depend on muscle memory, a long support horizon, and a team that will maintain this
code long after the task is forgotten.

That means:

- You are editing a system, not producing an artifact. The question is never "is this
  screen good?" but "is the product more coherent than before?"
- You inherit decisions you did not make. Assume they had reasons. Investigate before
  overriding, and prefer to ask.
- The code you write will be read many more times than it is written, and copied more
  often than it is read. Whatever you do here will be duplicated elsewhere — make it
  worth duplicating.
- Users of enterprise software value predictability over delight. Surprising them is
  a cost, even when the surprise is pleasant.
- Small, reviewable, reversible changes beat large, impressive ones.

Every decision optimizes for, in this order:

1. **Consistency** — does this match the rest of the product?
2. **Readability** — can a user scan and understand it under real conditions, with
   real data, at speed, repeatedly?
3. **Maintainability** — can the next engineer change it safely without reading
   everything?
4. **Accessibility** — does it work for every user, by keyboard, at zoom, with
   assistive technology, without color?
5. **Scalability** — does it hold up at 10 items and 10,000, with long strings,
   empty values, and future variants?

**Visual novelty is not on that list.** It is never a tiebreaker and never a
justification.

────────────────────────────────────────────────────────────────────────
## 06. WORKING METHOD AT A GLANCE
────────────────────────────────────────────────────────────────────────

Before writing any UI code:
1. Identify the closest existing page or component in the product. Open it. Read it.
2. Reuse it. Extension beats duplication; duplication beats invention.
3. Map every visual value you need to an existing token. If no token exists, you are
   probably solving the problem the wrong way.
4. Build. Then run the Visual QA Checklist (Section 14) before you call it done.
5. Obey the Rules (Section 15) without exception, and confirm the Definition of Done
   (Section 16) before reporting completion.

Career Navigator is one product, not a portfolio of pages. A user should be able to
move from onboarding to profile to skills mapping to job matching to analytics and
never feel that they crossed a border.

────────────────────────────────────────────────────────────────────────
## 1. DESIGN PHILOSOPHY
────────────────────────────────────────────────────────────────────────

Career Navigator is an enterprise system that people use to make consequential
decisions about their careers and their workforce. The interface must feel like
infrastructure, not marketing.

**Enterprise-first.** Design for the daily operator, not the first-time visitor.
Density, scannability, keyboard efficiency, and predictable placement outrank
delight. Screens are used for hours, not seconds. Every pixel of decoration is a
pixel of cognitive load charged to someone doing their job.

**Professional.** The tone is composed and unhurried. No exclamation marks in UI
copy, no mascots, no confetti, no playful illustration in core workflows. Restrained
confidence reads as competence.

**Trustworthy.** The product handles career data, assessments, and machine-generated
recommendations. Trust is built visually through consistency, legible hierarchy,
honest states, visible provenance, and never hiding uncertainty. If the system is
guessing, the interface says so. If data is stale, the interface says when.

**AI-powered.** Machine intelligence is a first-class part of the product, so it gets
a first-class, clearly-marked visual language — but it never fragments the system.
AI surfaces are recognizable within one second and still unmistakably Career
Navigator. AI is presented as a capable assistant offering evidence, never as an
oracle issuing verdicts.

**Clean.** One dominant surface, generous alignment, few rules on the page. Structure
is expressed through alignment and whitespace first, through a hairline second, and
through elevation only as a last resort.

**Modern.** Contemporary without being fashionable. We avoid trends with a short
half-life (heavy gradients, glassmorphism, neon, oversized rounded blobs, decorative
3D, animated backgrounds). Modernity comes from precision, spacing, and responsive
behavior — not from effects.

**Minimal.** The default answer to "should we add something?" is no. Remove borders
before adding them. Remove colors before adding them. A screen is finished when
nothing further can be removed without losing meaning.

**Accessible.** Accessibility is a functional requirement, not a review stage.
WCAG 2.2 AA is the floor for every screen we ship, including internal admin tooling.

────────────────────────────────────────────────────────────────────────
## 2. DESIGN PRINCIPLES
────────────────────────────────────────────────────────────────────────

**2.1 Visual hierarchy.** Every screen must answer three questions instantly: where
am I, what matters most here, what can I do next. Establish hierarchy in this order —
(1) position and grouping, (2) type size and weight, (3) color contrast between
primary and secondary ink, (4) surface change, (5) accent color. Reach for the
cheapest tool that works. Exactly one primary action per view; everything else is
secondary, tertiary, or ghost. If two things scream, nothing is heard.

**2.2 Consistency.** The same concept looks the same everywhere. A destructive action
looks identical in a table row, a modal, and a drawer. A required field is marked the
same way on every form. Consistency is more valuable than any individual improvement;
a better button that exists on one page only is a regression.

**2.3 Simplicity.** Prefer the plainest solution that communicates. One column beats
two. A list beats a grid of cards when items are homogeneous. A sentence beats an
icon that needs a legend. Progressive disclosure over dense-by-default: show the
decision, hide the derivation behind an expand, a drawer, or a details view.

**2.4 Restraint.** Color, elevation, motion, and iconography are budgets, not
supplies. Spend accent color on the single most important action in view. Spend
elevation only where something genuinely floats above the page. Spend motion only to
explain a change of state. Decoration that carries no information is deleted.

**2.5 Semantic design tokens.** Never write a raw value into a component. Reference
tokens by meaning, not appearance: use the danger token because the action is
destructive, not because it should be red. Semantic naming is what allows themes,
density modes, and future rebrands to happen without touching components. Any literal
hex, px font-size, or ad-hoc shadow in a component is a defect.

**2.6 Component reuse.** The component library is the product's vocabulary. Compose
from it. If a design needs something the library lacks, first try composition; then
try extending an existing component with a documented variant; only then propose a
new primitive — and a new primitive must ship with tokens, states, responsive
behavior, accessibility notes, and documentation before it is used on a page.

**2.7 Enterprise UX.** Honor the conventions of professional software: persistent
navigation, breadcrumbs for depth, predictable action placement, keyboard shortcuts
and full tab operability, bulk selection and bulk actions on collections, filters
that persist, tables that sort and paginate, forms that preserve input on error,
undo instead of confirmation where possible and explicit confirmation where undo is
impossible, empty states that teach, and error states that name the fix. Never lose
a user's work. Never block the interface without saying why.

────────────────────────────────────────────────────────────────────────
## 3. COLOR SYSTEM
────────────────────────────────────────────────────────────────────────

### 3.1 Philosophy

Career Navigator is a neutral product with a narrow chromatic budget. Roughly 90% of
any screen is white, near-white, and ink. Color appears only where it carries
meaning: the primary action, an AI-generated surface, or a status. Color is never
decorative and never the only carrier of meaning (Section 12).

Two accents exist and only two: **Brand Primary** for user intent and navigation, and
**AI Accent** for machine-generated content. They are never mixed in the same
element. Everything else is neutral or semantic.

### 3.2 Token layer (semantic names are the only names components may use)

```css
:root {
  /* Brand primary — interaction and intent */
  --cn-primary:            #1F4FD8;
  --cn-primary-hover:      #1A44BC;
  --cn-primary-active:     #14349A;
  --cn-primary-subtle:     #EEF3FF;  /* tinted background only */
  --cn-primary-border:     #C3D3FA;
  --cn-on-primary:         #FFFFFF;

  /* AI accent — machine-generated content */
  --cn-ai:                 #6E4BE0;
  --cn-ai-hover:           #5C3CC4;
  --cn-ai-subtle:          #F4F0FF;
  --cn-ai-border:          #DCD0FA;
  --cn-on-ai:              #FFFFFF;

  /* Neutral surfaces */
  --cn-canvas:             #FFFFFF;  /* default page and card background */
  --cn-surface-sunken:     #F6F7F9;  /* app background behind cards, table zebra */
  --cn-surface-raised:     #FFFFFF;  /* cards, modals, drawers, popovers */
  --cn-surface-muted:      #EDEFF3;  /* disabled fills, skeletons, inert chips */
  --cn-surface-inverse:    #12151B;  /* tooltips, dark utility bars */
  --cn-surface-inverse-2:  #1C212A;

  /* Borders */
  --cn-border-subtle:      #E3E6EB;  /* default hairline: cards, dividers, rows */
  --cn-border-default:     #CBD1DA;  /* inputs, controls at rest */
  --cn-border-strong:      #9AA3AF;  /* hover on controls, emphasis rules */

  /* Ink */
  --cn-ink:                #14181F;  /* headings, primary body, table data */
  --cn-ink-secondary:      #4A5261;  /* supporting copy, labels, meta */
  --cn-ink-tertiary:       #6E7683;  /* helper text, captions, placeholders */
  --cn-ink-disabled:       #9AA3AF;
  --cn-ink-inverse:        #FFFFFF;
  --cn-ink-link:           var(--cn-primary);

  /* Semantic status */
  --cn-success:            #0E7C4A;
  --cn-success-subtle:     #E8F6EF;
  --cn-success-border:     #B7E2CD;

  --cn-warning:            #B26205;  /* text/icon-safe warning */
  --cn-warning-subtle:     #FFF5E6;
  --cn-warning-border:     #F5D9AC;

  --cn-error:              #C21F32;
  --cn-error-hover:        #A5192A;
  --cn-error-subtle:       #FDEDEF;
  --cn-error-border:       #F5C2C8;

  --cn-info:               #1F4FD8;  /* intentionally the brand hue; see 3.9 */
  --cn-info-subtle:        #EEF3FF;
  --cn-info-border:        #C3D3FA;

  /* Focus */
  --cn-focus-ring:         #1F4FD8;
  --cn-focus-ring-inverse: #FFFFFF;
}
```

Components reference these tokens only. Palette-level values (raw hexes, numbered
scales) never appear in component code, inline styles, utility overrides, or charts.

### 3.3 Primary brand color

**Use for:** the single primary button in a view; text links; the active state of
navigation items; selected tab underline; focus rings; selected checkbox, radio, and
toggle fills; the active step in a progress tracker; the fill of a determinate
progress bar; small key-figure emphasis in analytics.

**Never use for:** large background panels or hero fills; card backgrounds; body
text; section headings; iconography that is not interactive; more than one button in
the same view; decorative dividers; hover backgrounds on rows (use the sunken
surface); status communication (use semantic tokens); AI-generated content (use the
AI accent). If a screen has two primary-colored buttons, one of them is wrong.

### 3.4 Neutral surfaces

**Use for:** everything. The application background is the sunken surface; cards,
tables, modals, and drawers sit on it as white raised surfaces separated by hairlines.
Section rhythm is created by alternating white and sunken bands, not by color blocks.
The muted surface fills disabled controls and skeleton placeholders. The inverse
surface is reserved for tooltips, keyboard-shortcut hints, and thin utility strips.

**Never use for:** conveying status; large inverted panels in core workflows; more
than two neutral steps in a single visual grouping (canvas + one contrast step is the
limit — three greys stacked reads as a bug); dark-on-dark nesting.

### 3.5 AI accent

**Use for:** the border, subtle background tint, and icon of AI-generated panels,
insight cards, summaries, and suggestions; the AI assistant entry point; streaming
and "thinking" indicators; AI-authored chips and inline suggestion markers;
confidence indicators attached to model output.

**Never use for:** primary buttons and other user-intent actions; navigation; status;
any content a human authored or a deterministic rule produced; charts; decorative
accenting to "make a page feel modern." Overuse destroys its entire function, which
is to let a user tell instantly what the machine wrote. If more than roughly a quarter
of a screen carries the AI accent, the screen is mislabeled.

### 3.6 Success

**Use for:** completion confirmations, passing validation, positive status badges
(Verified, Complete, Active, On track), upward-trend indicators paired with an arrow
glyph, success toasts.

**Never use for:** primary buttons (a "Save" button is primary, not green); large
fills; general positive tone; unlabeled color coding in charts.

### 3.7 Warning

**Use for:** conditions that need attention but are not failures — expiring items,
incomplete profiles, degraded data freshness, approaching limits, actions with
side effects the user should read before confirming.

**Never use for:** errors (use error); pure information; button backgrounds; large
areas. Warning is the hardest hue to keep accessible: never place warning color on a
light fill as small text. Use the darkened warning token for text and icons and the
subtle token only as a background.

### 3.8 Error

**Use for:** failed validation, failed operations, destructive-action confirmation,
error banners and toasts, the destructive button variant, required-field violation
messaging and the accompanying inline text.

**Never use for:** neutral negative numbers (a decline in a metric is a trend, not an
error — use ink with a directional glyph); emphasis; required-field asterisks alone
without a text label; long passages of body copy.

### 3.9 Information

**Use for:** neutral system messages, contextual explanations, "what changed" notices,
inline callouts, informational badges and banners.

Information intentionally shares the brand hue so the palette stays narrow. Because of
that, informational elements carry two obligatory safeguards: they always include the
info icon, and they are never styled as interactive. An informational banner has no
hover state, no pointer cursor, and no button-like fill.

**Never use for:** anything actionable-looking; success or error; persistent
decoration that users learn to ignore.

### 3.10 Universal color rules

- Contrast minimums: 4.5:1 for text, 3:1 for large text and for meaningful UI borders,
  icons, and graph elements. Verify, do not estimate.
- Color never carries meaning alone. Status = color + icon + text label. Chart series
  = color + direct label or pattern.
- Charts use a documented, colorblind-safe categorical ramp with a fixed order; never
  pick chart colors ad hoc, never use the semantic tokens for categorical series.
- Gradients are prohibited except a single documented, near-imperceptible tint behind
  AI panels. No gradient text, no gradient buttons, no gradient backgrounds.
- Any dark theme is derived by remapping these semantic tokens. Components must not
  contain theme conditionals.

────────────────────────────────────────────────────────────────────────
## 4. TYPOGRAPHY
────────────────────────────────────────────────────────────────────────

### 4.1 Philosophy

One typeface carries the entire product. Hierarchy comes from size, weight, color,
and spacing — never from a second family, never from italics, never from all-caps
letterspacing. A single neutral humanist sans-serif with true tabular figures and at
least four weights (light/regular/medium/semibold) is the system face; a monospaced
face is permitted only for code, identifiers, and API keys.

```css
--cn-font-sans: "Navigator Sans", system-ui, sans-serif;
--cn-font-mono: "Navigator Mono", ui-monospace, monospace;
```

Guiding rules:

- **Weight moves inversely to size.** Large type is set light or regular; small type
  is set medium or semibold. A 48px heading at semibold shouts; at regular it carries
  authority. Never set display type above 600 weight. Never set 12px type below 400.
- **Line height moves inversely to size.** Display sizes sit near 1.15–1.25; body sits
  near 1.5; dense table rows near 1.4. Long-form copy is never tighter than 1.5.
- **Tracking is near zero.** Slight negative tracking on display sizes; zero on body;
  never all-caps with wide tracking for eyebrows or labels — sentence case, always.
- **Measure is limited.** Reading copy caps at roughly 70–80 characters per line.
  Helper text and descriptions inside forms cap near 60.
- **Numbers align.** Every numeric column, metric, currency, and timestamp uses
  tabular figures. Never let digits shift when data refreshes.
- **Truncate honestly.** Single-line ellipsis with the full value available via
  tooltip or details view; never clip mid-word without an indicator.
- Type sizes come from the type-scale tokens only. Never set a size, weight, or
  line-height inline.

### 4.2 Roles

| Role | Purpose | Treatment |
|---|---|---|
| **Display** | Marketing surfaces, onboarding milestones, empty-state hero moments. At most one per page, and never inside the application shell. | Largest step, light/regular weight, tight leading, negative tracking, primary ink. |
| **Page title** | The name of the current screen; appears once, in the page header, matching the navigation label and the browser title. | Large step, regular/medium weight, primary ink. Never colored, never accented. |
| **Section heading** | Divides a page into named regions; the primary scanning target. | Medium-large step, semibold, primary ink, generous space above and roughly half that below so the heading binds to its content. |
| **Card title** | Names a single card, panel, drawer, or modal. | One step above body, semibold, primary ink, always the first element in the container. Never wraps past two lines. |
| **Body** | Default reading text, descriptions, table cell content. | Base step, regular, primary ink for content and secondary ink for supporting prose. |
| **Label** | Form field labels, table column headers, metric captions, definition terms. | One step below body, medium/semibold, secondary ink, sentence case. Always visible — a placeholder is never a label. |
| **Helper text** | Field hints, character counters, timestamps, provenance, footnotes. | Smallest step, regular, tertiary ink — switching to error ink when it becomes a validation message. Never smaller than 12px. |
| **Button** | All interactive labels: buttons, tabs, menu items, navigation. | One step below body, medium/semibold, sentence case, no wrapping, no ellipsis. Verb-first and specific ("Save profile", not "OK"). |

### 4.3 Responsive type

Display and page titles step down at tablet and mobile; body, label, helper, and
button sizes never shrink below their desktop values. Reading text is never below
16px on touch devices. Heading hierarchy is preserved when it scales — if display and
page title collapse to the same size, the scale is wrong.

────────────────────────────────────────────────────────────────────────
## 5. SPACING
────────────────────────────────────────────────────────────────────────

A strict 4px base unit governs every dimension: padding, margin, gaps, icon sizes,
control heights, grid gutters.

```css
--cn-space-1: 4px;    --cn-space-2: 8px;    --cn-space-3: 12px;
--cn-space-4: 16px;   --cn-space-5: 24px;   --cn-space-6: 32px;
--cn-space-7: 48px;   --cn-space-8: 64px;   --cn-space-9: 96px;
```

Rules:

- Every spacing value is a token. No 5px, no 15px, no 30px, no "magic numbers" to
  nudge alignment. If something looks misaligned, the structure is wrong.
- **Proximity encodes relationship.** Related elements sit at 4–8px, elements within a
  group at 12–16px, groups within a section at 24–32px, sections at 48–64px, major page
  bands at 96px. If two things are equally spaced, users read them as equally related.
- **Space above a heading is roughly double the space below it.** Headings belong to
  what follows them.
- **Container padding is standardized:** compact cells and chips 8–12px; standard cards
  and panels 24px; modals, drawers, and page containers 24–32px; full-bleed marketing
  bands 48–96px vertical. Never vary card padding within one grid.
- **Vertical rhythm is owned by the parent.** Use gap on the container; do not stack
  margins on children. Never use margins to fake alignment across siblings.
- **The page grid is 12 columns** with a token gutter, a max content width, and
  symmetric page margins. Content aligns to the grid; nothing floats off it.
- Density variants (comfortable / compact) change the spacing token mapping only —
  never the type scale, never the radius, never the color.

────────────────────────────────────────────────────────────────────────
## 6. BORDER RADIUS
────────────────────────────────────────────────────────────────────────

Career Navigator's geometry is near-square and precise. Radius exists to soften
functional edges, never to create personality.

```css
--cn-radius-none: 0;      --cn-radius-xs: 2px;    --cn-radius-sm: 4px;
--cn-radius-md:   8px;    --cn-radius-full: 9999px;
```

| Token | Applies to |
|---|---|
| **none** | Application shell: header, sidebar, tab strips, table cells and headers, dividers, full-bleed bands, inline banners that span the content width, sticky footers. |
| **xs** | Checkboxes, small inline indicators, progress-bar segments. |
| **sm** | The default control radius: buttons, inputs, selects, textareas, chips, badges, menu items, tooltips, date cells. |
| **md** | The default container radius: cards, modals, popovers, toasts, empty-state containers, AI panels, image and chart frames. |
| **full** | Avatars, status dots, counters on icons, toggle knobs, skeleton lines. Filter chips may use full only where already established — never mix pill and square chips in the same view. |

Rules:
- One component, one radius. Never mix corner values within a single element.
- Nested surfaces step down one level (an md card containing an sm input). A nested
  element never has a larger radius than its parent.
- Drawers and any panel flush to a viewport edge keep square corners on the flush side.
- No radius above md anywhere in the application shell. Large, soft, pill-shaped
  containers are off-brand.

────────────────────────────────────────────────────────────────────────
## 7. BORDERS
────────────────────────────────────────────────────────────────────────

Borders are the primary structural tool. Career Navigator separates content with
hairlines and surface change rather than with elevation.

- **One weight: 1px.** A 2px line is reserved for state — focus rings, the selected
  tab underline, the active navigation indicator, an invalid field's emphasis. Seeing
  2px means "something is happening here."
- **Three strengths, used deliberately:** subtle for structural separation (card
  outlines, dividers, table row rules); default for interactive control outlines at
  rest; strong for control hover and for the rare emphatic rule.
- **Prefer no border at all.** Alignment and whitespace separate content first. Add a
  hairline only when whitespace alone leaves the grouping ambiguous.
- **Never double up.** A bordered card inside a bordered container inside a bordered
  section produces visual noise. One boundary per boundary.
- **Never combine a visible border with a shadow** except on floating overlays, where
  a subtle hairline improves definition on light backgrounds.
- Dividers are full-bleed within their container and use the subtle token; they never
  carry margins that break alignment with content edges.
- Dashed borders appear only for drop zones and placeholder slots. Nothing else in the
  system is dashed.
- Left-edge accent bars (3–4px) are permitted on inline banners and callouts to carry
  the semantic color — this is a documented pattern, not an invitation to accent other
  containers.

────────────────────────────────────────────────────────────────────────
## 8. SHADOWS
────────────────────────────────────────────────────────────────────────

Shadow means "this element floats above the page and can be dismissed." It is not a
styling flourish and never conveys importance.

```css
--cn-shadow-none: none;
--cn-shadow-sm:   0 1px 2px rgba(20,24,31,.06), 0 1px 3px rgba(20,24,31,.04);
--cn-shadow-md:   0 4px 8px rgba(20,24,31,.08), 0 2px 4px rgba(20,24,31,.04);
--cn-shadow-lg:   0 12px 24px rgba(20,24,31,.12), 0 4px 8px rgba(20,24,31,.06);
```

| Level | Where |
|---|---|
| **none** | Cards, panels, tables, form sections, banners, tabs, and every static container. This is the default and covers the large majority of the product. |
| **sm** | Sticky headers and toolbars once content scrolls beneath them; hovered rows in interactive collections where the card itself is clickable. |
| **md** | Transient overlays anchored to a trigger: dropdown menus, popovers, comboboxes, date pickers, tooltips on light surfaces. |
| **lg** | Viewport-level overlays: modals and drawers, above a scrim. |

Rules:
- Static cards never carry shadow. Hierarchy among cards comes from surface change
  and hairlines.
- Shadows are always neutral, always downward, never colored, never tinted with brand
  or AI hues, never used to create a glow.
- Never animate a shadow on hover in a way that shifts layout; if a card must respond
  to hover, change the border strength or the surface, or move it by at most 1px.
- Elevation is monotonic: a modal is always above a drawer's content, a menu is always
  above a card, a toast is always above a modal.

────────────────────────────────────────────────────────────────────────
## 9. MOTION
────────────────────────────────────────────────────────────────────────

Motion explains change. If a user cannot say what a transition told them, it should
not exist.

```css
--cn-duration-instant: 80ms;   --cn-duration-fast:  150ms;
--cn-duration-normal:  220ms;  --cn-duration-slow:  320ms;
--cn-ease-standard: cubic-bezier(.2,0,.38,.9);
--cn-ease-entrance: cubic-bezier(0,0,.38,.9);
--cn-ease-exit:     cubic-bezier(.2,0,1,.9);
```

Principles:

- **Duration scales with distance and size.** Hover and focus feedback is instant to
  fast; expanding panels, tabs, and menus are normal; modals, drawers, and page-level
  transitions are slow. Nothing in the product animates for longer than 400ms.
- **Enter gently, exit quickly.** Entrances use the entrance curve at normal-to-slow
  duration; exits use the exit curve, roughly one step faster. Never a linear curve
  except for continuous indeterminate loaders.
- **Animate only opacity and transform.** Never animate width, height, top, left, or
  colors that force layout. Layout must never shift as a result of decoration.
- **Movement is small and directional.** Overlays translate 4–8px along the axis that
  explains their origin: menus from their trigger, drawers from their edge, toasts
  from the corner they occupy.
- **No idle motion.** Nothing loops, pulses, bounces, or floats when the user is not
  waiting on the system. The only continuous animations permitted are indeterminate
  loaders, skeleton shimmer, and AI streaming indicators — all of which stop the
  moment content arrives.
- **Motion never gates interaction.** A user can click through an entering element.
  Animations never delay data.
- **Reduced motion is a hard requirement.** Under `prefers-reduced-motion: reduce`,
  all transforms are removed and transitions collapse to an opacity change of 80ms or
  to nothing. Skeletons stop shimmering and render as static muted surfaces. State
  changes remain fully perceivable without motion.

────────────────────────────────────────────────────────────────────────
## 10. COMPONENTS
────────────────────────────────────────────────────────────────────────

Universal requirements for every component: all five states defined (rest, hover,
active, focus-visible, disabled) plus loading and error where applicable; a minimum
interactive target of 24×24px on pointer devices and 44×44px on touch; a visible
focus ring; a name exposed to assistive technology; full keyboard operability; and no
value that is not a token.

**10.1 Buttons.** Four variants and one modifier. *Primary* — solid brand fill, white
label; exactly one per view, reserved for the main forward action. *Secondary* —
white fill, default border, primary ink; the workhorse for everything else.
*Tertiary/ghost* — no fill, no border, brand ink label; for low-emphasis and in-table
actions. *Destructive* — solid error fill, or a ghost with error ink inside
confirmation flows; always paired with a confirmation step when the action is
irreversible. Modifier: icon-only, which requires an accessible label and a tooltip.
Sizes: small, medium (default), large. Labels are sentence case, verb-first,
never wrapped, never truncated. Icons sit left of the label at 16px with 8px gap;
a right-side icon is reserved for menus (chevron) and external links. Loading state
replaces the icon with a spinner, keeps the label, preserves the button's width, and
disables interaction. Disabled buttons use the muted surface and disabled ink and
never carry a tooltip explaining nothing — if a button is disabled, say why nearby.
Button groups order actions primary-last on the right in dialogs and
primary-first on the left in page toolbars; whichever convention a surface uses, it
uses it everywhere.

**10.2 Inputs.** Every field has a persistent visible label above it, optional helper
text below, and, where relevant, a character counter. Placeholders show format
examples only and never replace labels. At rest: white surface, default border,
control radius. Hover strengthens the border. Focus applies the 2px focus ring with a
2px offset. Invalid state applies the error border, an error icon, and error helper
text that states what is wrong and how to fix it — never a bare "Invalid input".
Disabled uses the muted surface; read-only removes the border and renders as text.
Required fields are marked with both an asterisk and an accessible indication;
alternatively, mark optional fields — pick one convention product-wide. Validation
runs on blur and again on submit, never on every keystroke, except for live
availability and strength checks. Field widths are proportional to expected content:
a postal code field is never full width. This applies equally to selects, comboboxes,
textareas (resizable vertically only), date pickers, checkboxes, radios, toggles, and
file uploads. Checkboxes are for multi-select and toggles are for immediate settings
changes — never a toggle inside a form that has a Save button.

**10.3 Cards.** White raised surface, hairline border, container radius, 24px padding,
no shadow. Structure is fixed: optional eyebrow, card title, optional supporting text,
content, optional footer action row. Cards in a grid are equal height with content
aligned to the top and actions pinned to the bottom. A card is not a decoration for a
paragraph — if it holds one sentence and no action, delete the card and keep the
sentence. Clickable cards have a single obvious target, a hover treatment, a focus
ring on the whole card, and no nested interactive elements competing with the card
target. Never nest a card inside a card.

**10.4 Tables.** Tables are the backbone of the product and get the most rigor.
Column headers are label-styled, sticky on vertical scroll, left-aligned for text and
right-aligned for numbers with tabular figures. Rows use a hairline bottom rule, no
vertical rules; zebra striping is optional and uses the sunken surface — never both
zebra and row rules. Row height follows the density mode and is constant. Hover
highlights the whole row; selection uses a checkbox in the first column plus a subtle
brand tint, and reveals a bulk action bar that replaces the toolbar without shifting
the layout. Sortable columns show their state with an arrow and expose it to
assistive technology. Row actions live in a right-aligned column: at most two icon
buttons, then an overflow menu. Long values truncate with a tooltip. Empty results
render the empty state inside the table body, keeping headers visible. Loading
renders skeleton rows matching the real row height and column widths. Pagination and
row counts sit below, consistently. Below the tablet breakpoint, tables become
stacked cards or a horizontally scrollable region with a pinned first column — never
a squeezed, illegible grid.

**10.5 Modals.** For focused, blocking decisions only. Centered, container radius,
large elevation, above a scrim of ink at low opacity. Anatomy: title, optional short
description, content, right-aligned action row with the primary action last. Widths
come from three fixed sizes (small, medium, large) — never arbitrary. Focus moves
into the modal on open, is trapped while open, and returns to the trigger on close.
Escape and the scrim close non-destructive modals; destructive and data-entry modals
require explicit dismissal and warn about unsaved changes. Content never scrolls the
page behind it. Never nest modals; never put a multi-step workflow in a modal — use a
drawer or a page.

**10.6 Drawers.** For contextual detail, filtering, editing, and inspection alongside
retained page context. Anchored to the right edge by default (left is reserved for
navigation), square on the flush edge, large elevation, fixed width tiers. Header
contains the title and a close control; footer holds actions and stays pinned while
the body scrolls. Same focus-trap and dismissal rules as modals. Prefer a drawer over
a modal whenever the user benefits from seeing the underlying context. On mobile, a
drawer becomes a full-screen sheet.

**10.7 Sidebar.** The primary navigation surface: fixed left, sunken or white surface,
right hairline, square geometry, full height. Items pair a 20px icon with a label,
grouped into at most three labeled sections. The active item is marked with a brand
left indicator, a brand-tinted background, and semibold ink — all three, never color
alone. Hover uses a neutral surface change only. Depth is limited to two levels;
anything deeper belongs in a page-level nav or a landing page. Collapsible to an
icon-only rail that shows tooltips on hover and remembers the user's choice. Below
the tablet breakpoint it becomes an off-canvas panel with a scrim. The sidebar's
structure is identical on every page — it never gains, loses, or reorders items
contextually.

**10.8 Header.** Fixed top bar, white surface, bottom hairline, square, constant
height, present on every application page. Left: product mark and, where depth
requires it, breadcrumbs. Center or left-of-center: global search. Right: AI assistant
entry point, notifications, help, and the user menu, in that fixed order. The header
never carries page-specific actions — those belong to the page header. It gains a
small shadow only when content scrolls beneath it.

**10.9 Navigation.** Every page uses the same page-header pattern directly below the
global header: breadcrumbs (three levels or fewer), page title, optional one-line
description, and a right-aligned action cluster with at most one primary action. The
current location must be unambiguous in the sidebar, the breadcrumbs, the page title,
and the document title simultaneously. Tabs switch views within one page and never
navigate away from it. Back navigation never loses filters, scroll position, or
unsaved input.

**10.10 Forms.** Single column by default; two columns only for genuinely short,
paired fields, and never on mobile. Group related fields under section headings with
a one-line description. Long forms are split into steps with a progress tracker, or
into sections with anchored navigation — never one endless scroll. Actions are pinned
in a footer for long forms: primary submit, secondary cancel, and nothing else. On
submit failure, show a summary banner at the top listing each error as a link to its
field, move focus to the first invalid field, and preserve every entered value.
Autosave, where used, shows an explicit and honest status ("Saved 2 minutes ago").
Destructive form actions require typed or explicit confirmation. Never surprise the
user with an immediate save when a Save button is present.

**10.11 Tabs.** Horizontal strip, square, bottom hairline spanning the full width,
label-styled items with generous horizontal padding. The selected tab is marked with a
2px brand underline and semibold primary ink; unselected tabs use secondary ink.
Between four and six tabs maximum; more means the information architecture is wrong.
Tabs never reorder, never disappear based on state, and always show all options even
when some are empty. Keyboard: arrow keys move between tabs, Home/End jump to the
ends, and the tab panel is properly associated. Tab state belongs in the URL so views
are linkable and survive refresh. Tabs never trigger a full page navigation, and never
appear inside a modal or a card.

**10.12 Badges.** Compact, non-interactive status markers. Subtle semantic background,
matching semantic border, dark semantic ink, small radius, 2–8px padding, label-styled
text in sentence case, optional 12px leading icon. Always paired with text — a bare
colored dot is never sufficient. Badges are read-only: they never contain a close
button, never open a menu, and never act as filters. Keep the vocabulary short and
product-wide (Active, Draft, Pending, Verified, Expired, Failed) and map each label to
exactly one semantic color everywhere.

**10.13 Chips.** Interactive, user-controlled tokens: applied filters, selected
skills, recipients, tags. Neutral surface with a default border at rest; selected
chips take the subtle brand tint, the brand border, and a check icon; removable chips
carry a trailing close control with its own accessible label and its own focus ring.
Chips wrap to multiple lines rather than scrolling horizontally on desktop. A chip
group always offers a "Clear all" when more than two are applied. AI-suggested chips
use the AI accent and are visually distinct from user-applied chips until accepted, at
which point they become ordinary chips.

**10.14 Toasts.** Brief, non-blocking confirmations. Fixed position — one corner,
product-wide, never variable. Container radius, medium-to-large elevation, semantic
icon, one line of text, one optional action such as Undo, and a close control.
Auto-dismiss after four to six seconds; error toasts and toasts with actions persist
until dismissed. Stack a maximum of three, oldest first, collapsing the rest. Toasts
announce themselves through a polite live region, and an assertive one for errors.
Toasts never carry information the user needs to keep, never contain forms or long
text, and never replace inline validation.

**10.15 Tooltips.** Short clarifying text only, on the inverse surface with inverse ink,
small radius, medium elevation, offset 8px from the trigger with an arrow. Appear
after roughly 300ms hover and immediately on keyboard focus. Maximum around 120
characters — anything longer belongs in helper text or a popover. Tooltips are never
the only place critical information lives, never contain interactive elements, and are
mandatory on every icon-only control. They must be reachable and dismissible by
keyboard.

**10.16 Empty states.** Every collection, table, search, dashboard widget, and filter
result defines one. Structure: a simple, restrained neutral or line illustration or
icon; a short heading naming the situation; one or two lines of body explaining what
belongs here; and a primary action that resolves it. Distinguish the three kinds
clearly — nothing created yet (teach and invite creation), no results for a filter or
query (offer to clear or broaden), and nothing permitted (explain access, offer to
request it). Empty states are centered within their container, keep surrounding
structure such as table headers and toolbars visible, and never render as a bare
"No data" string.

**10.17 Loading states.** Match the shape of what is coming. Initial page and content
loads use skeletons that mirror the real layout's dimensions so nothing shifts when
data arrives. In-place updates use a subtle inline spinner or a progress bar without
destroying already-visible content. Button-level actions show the in-button spinner.
Never use a full-screen blocking spinner. Never let layout jump between skeleton and
content. Anything expected to exceed roughly ten seconds shows determinate progress
and a plain-language description of the step. Loading regions are announced to
assistive technology as busy. Prefer optimistic updates with a clean rollback path
where the operation is safe.

**10.18 Error states.** Three scopes, each with a defined pattern. *Field-level* —
inline error text below the input with the error border and icon. *Section-level* — an
inline banner at the top of the affected region with the error accent bar, a plain
description, and a retry action, leaving the rest of the page usable. *Page-level* — a
centered container with a short heading, a description of what failed, a retry action,
and a secondary escape route back to a known-good page. Every error message names
what happened, why if known, and what to do next, in plain language and without
blame. Never surface raw exceptions, stack traces, or status codes as the user-facing
message; include a copyable correlation ID for support instead. Never leave a failure
silent, and never lose the user's input to an error.

────────────────────────────────────────────────────────────────────────
## 11. AI COMPONENTS
────────────────────────────────────────────────────────────────────────

AI-generated content must be identifiable at a glance and still feel native. It is
differentiated by a consistent, narrow signature — never by a different design system.

**11.1 The AI signature.** Exactly four ingredients, always used together and never
used apart: the AI accent border, the AI subtle background tint, the AI glyph in the
container's top-left, and an explicit text label such as "AI insight" or "Suggested by
Career Navigator AI". Everything else — radius, spacing, typography, buttons, focus
rings, motion — is identical to the rest of the system. There is no separate AI type
scale, no separate AI spacing, no gradient, no glow, no animated background.

**11.2 Where the signature applies.** AI insight and summary panels; inline
suggestions within forms and editors; recommendation cards; conversational assistant
surfaces; generated draft content; match and fit scores derived from a model. It does
not apply to deterministic calculations, rules-based validation, human-authored
content, or ordinary search results — labeling those as AI erodes the signal.

**11.3 Transparency is a visual requirement.**
- Every AI surface states its origin in text, not only through color.
- Confidence is shown when it is known, as a labeled qualitative band (High / Medium /
  Low) with a short explanation on hover — never as a false-precision percentage.
- Provenance is shown: which inputs, documents, or profile fields produced the output,
  linked where possible.
- Freshness is shown: when the output was generated.
- Model output is always framed as a suggestion, never as a fact, and never as a
  decision already made.

**11.4 The user stays in control.** Every AI suggestion offers, at minimum, accept,
edit, and dismiss. Accepted content becomes ordinary content and loses the AI
signature — the tint is a marker of unreviewed machine output, not a permanent badge.
AI never auto-applies changes to a user's data without an explicit action, and every
applied change is reversible. A visible, consistent feedback control (helpful / not
helpful) appears on every generated output.

**11.5 Streaming and waiting.** Generation shows a labeled indeterminate indicator
using the AI accent with the same restraint as any loader — no typing sounds, no
bouncing dots larger than 6px, no synthetic personality. Streamed text renders into a
container that is already sized, so the page does not jump. A stop control is always
available during generation. Under reduced motion, streaming indicators become static
text.

**11.6 Failure and uncertainty.** When a model cannot answer, the surface says so
plainly and offers the manual path — it never fabricates, never fills with filler, and
never silently returns an empty panel. Low-confidence output is shown with its caveat
visible before the content, not buried beneath it.

**11.7 Density.** AI surfaces are guests on the page. At most one AI panel per screen
region, and never more AI-accented area than the content it comments on.

────────────────────────────────────────────────────────────────────────
## 12. ACCESSIBILITY
────────────────────────────────────────────────────────────────────────

WCAG 2.2 AA is the minimum for every screen, including internal tools. Accessibility
defects are functional defects and block release.

**12.1 Focus states.** Every interactive element has a visible focus indicator: a 2px
solid focus-ring token with a 2px offset, following the element's radius, rendered
above adjacent content and never clipped by overflow. On dark and colored surfaces,
switch to the inverse focus token so the ring never disappears. `outline: none` is
prohibited unless an equally visible replacement is applied in the same rule. Focus is
managed deliberately: it moves into overlays on open, is trapped for their duration,
and returns to the trigger on close. Focus is never stolen while a user is typing.

**12.2 Keyboard navigation.** Every feature is fully operable without a pointer. Tab
order follows visual order; DOM order is the source of truth and positive tabindex is
prohibited. Composite widgets (menus, tabs, tables, comboboxes, trees) follow standard
arrow-key patterns with Home/End support. Escape closes the topmost dismissible layer.
Enter and Space activate controls appropriately. A skip-to-content link is the first
focusable element on every page. Custom controls are built from native elements
wherever possible; where they are not, they carry the correct role, state, and
properties. Nothing is reachable only by hover.

**12.3 Contrast.** 4.5:1 minimum for body text and 3:1 for large text; 3:1 for
interactive borders, icons, focus indicators, and chart elements that carry meaning.
Disabled elements should still be legible enough to read. Text over images always sits
on a scrim. Contrast is measured against the actual background token, including subtle
tints — this is the most common failure in review.

**12.4 Reduced motion.** Honor `prefers-reduced-motion: reduce` product-wide by
removing transforms, parallax, auto-advancing carousels, and shimmer, and by reducing
transitions to a short opacity change or none. No information is conveyed by motion
alone. Nothing flashes more than three times per second, ever.

**12.5 Semantic colors and meaning.** Color never carries meaning alone: status is
color + icon + text; charts are color + label or pattern; required fields are marker +
text; errors are color + icon + message. Semantic tokens keep their meaning
everywhere — error is never used for emphasis, success is never used for branding.
Every interface must remain fully usable in greyscale; this is a fast, mandatory
self-test.

**12.6 Structure and assistive technology.** One h1 per page matching the page title,
with no skipped heading levels. Landmarks on every region. Every input has a
programmatically associated label. Every image has appropriate alt text, and
decorative images are hidden. Icon-only buttons have accessible names. Dynamic
updates are announced through appropriately polite live regions. Text supports 200%
zoom and 400% reflow at 320px without horizontal scrolling or loss of function.

────────────────────────────────────────────────────────────────────────
## 13. CROSS-PAGE CONSISTENCY
────────────────────────────────────────────────────────────────────────

Career Navigator has one design language. No page, feature, squad, or release
introduces its own visual style.

### 13.1 No page may introduce its own

This list is absolute. A page that diverges on any of these is non-conformant,
regardless of how well the divergence works in isolation:

- **Button style** — no page-specific variants, sizes, fills, shapes, icon
  conventions, or button ordering.
- **Heading style** — no local type sizes, weights, colors, casing, or heading
  hierarchies outside the defined roles.
- **Card style** — no local padding, borders, radius, elevation, header structure, or
  card anatomy.
- **Form style** — no local label placement, validation timing, error presentation,
  field sizing, spacing, or action placement.
- **AI styling** — no alternative AI signature, tint, glyph, label, confidence
  display, or streaming treatment.
- **Typography hierarchy** — no reassigning what display, page title, section
  heading, card title, body, label, helper, and button mean.
- **Navigation behavior** — no page-specific navigation patterns, tab semantics,
  breadcrumb rules, back behavior, or state persistence.
- **Colors** — no values outside the semantic token layer, and no reassigning what a
  semantic token means.
- **Shadows** — no local elevation values or elevation used for anything other than
  floating overlays.
- **Radius** — no corner values outside the radius scale and no category-specific
  exceptions.
- **Motion** — no local durations, curves, or animated behaviors outside the motion
  tokens and principles.

**All reusable improvements become shared standards.** If a page needs something
better, it is proposed, documented, added to the token layer and component library,
and then adopted product-wide (Section 04). A local improvement is a divergence; a
shared improvement is progress. Nothing stays local.

### 13.2 Every application page has the same anatomy

Global header → sidebar → page header (breadcrumbs, page title, optional description,
right-aligned actions) → optional tabs or filter toolbar → content region on the
sunken surface → optional pagination or footer actions. Regions may be omitted; they
are never reordered, restyled, or replaced.

### 13.3 Fixed conventions across all pages

- Primary action: top-right of the page header. One per page.
- Filters and search: left of the toolbar; applied filters shown as removable chips
  below it; filter state persists in the URL.
- Bulk actions: replace the toolbar when a selection exists, in place, without shifting
  layout.
- Row and item actions: right-aligned, two icon buttons maximum, then an overflow menu.
- Detail inspection: right drawer. Focused decisions: modal. Multi-step work: a page.
- Confirmation of destructive actions: modal with the destructive variant on the right.
- Save feedback: toast in the fixed corner. Validation feedback: inline.
- Timestamps, currency, units, and empty values ("—") use one shared format everywhere.
- Terminology is fixed: one concept, one word, product-wide, matching the navigation
  label and the page title.

### 13.4 New pages are assembled, not designed

Before building, open two comparable existing pages and match them. If a new page
needs something none of them has, the answer is a new reusable standard added to this
document — not a local exception.

### 13.5 Marketing and onboarding surfaces

These may use the display type role and wider vertical rhythm, but they use the same
tokens, components, and geometry as the application. The transition from marketing to
product must feel like walking into the next room, not into a different building.

────────────────────────────────────────────────────────────────────────
## 14. VISUAL QA CHECKLIST
────────────────────────────────────────────────────────────────────────

Run this before every UI change is submitted. Every item must be checked or explicitly
waived with a reason.

**Scope**
- [ ] Only the requested scope was changed; nothing adjacent was "improved."
- [ ] No layout, structure, hierarchy, navigation, workflow, logic, API, routing, or
      responsive-behavior changes were made.
- [ ] Out-of-scope inconsistencies were documented and reported, not fixed.

**Tokens**
- [ ] No raw hex, rgb, px font-size, ad-hoc shadow, or magic-number spacing anywhere.
- [ ] Every value maps to a semantic token used for its intended meaning.

**Layout and spacing**
- [ ] All spacing is on the 4px scale; related elements are closer than unrelated ones.
- [ ] Content aligns to the page grid; nothing is nudged by hand.
- [ ] Container padding matches the standard for that container type.
- [ ] No layout shift between loading, empty, populated, and error states.

**Typography**
- [ ] Roles are used correctly; exactly one page title; no skipped heading levels.
- [ ] Numeric columns use tabular figures and are right-aligned.
- [ ] No all-caps tracked labels; sentence case throughout.
- [ ] Line length stays within measure; nothing truncates without a tooltip.

**Color**
- [ ] Exactly one primary action in view.
- [ ] Semantic colors carry only their assigned meaning.
- [ ] AI accent appears only on machine-generated content, with the full signature.
- [ ] Screen remains fully understandable in greyscale.

**Geometry and depth**
- [ ] Radius matches the element's category; no mixed corners; nested radii step down.
- [ ] Borders are 1px except for genuine state indicators.
- [ ] No shadow on static containers; overlays use the correct elevation level.

**Components**
- [ ] Built from existing library components; no new one-off patterns.
- [ ] All states implemented: rest, hover, active, focus-visible, disabled, loading,
      empty, error.
- [ ] Buttons, labels, and messages use product-wide terminology.

**Motion**
- [ ] Only opacity and transform animate; all durations from tokens; nothing over 400ms.
- [ ] No idle or looping animation; reduced-motion path verified.

**Accessibility**
- [ ] Full keyboard pass: reach, operate, and escape every element in logical order.
- [ ] Visible focus ring on everything focusable, including on tinted surfaces.
- [ ] Contrast verified against actual backgrounds for text, icons, and borders.
- [ ] Labels, alt text, accessible names, and live-region announcements present.
- [ ] Usable at 200% zoom and at 320px width without horizontal scrolling.

**Responsiveness**
- [ ] Verified at mobile, tablet, desktop, and wide; no clipping or overflow.
- [ ] Touch targets meet 44×44px; tables degrade to the documented mobile pattern.
- [ ] Existing breakpoints and collapse behavior are unchanged.

**Consistency**
- [ ] Compared side by side against at least two existing pages.
- [ ] Page anatomy, action placement, and formats match product conventions.
- [ ] Nothing on the Section 13.1 list was introduced locally.

**Content and integrity**
- [ ] Long strings, empty values, zero, large numbers, and error text all handled.
- [ ] No business logic, API call, route, or data shape was altered by this change.

────────────────────────────────────────────────────────────────────────
## 15. RULES
────────────────────────────────────────────────────────────────────────

These are absolute. Violating one is a defect regardless of how good the result looks.

1. **Never redesign layouts unless explicitly requested.** Styling work changes
   styling. Do not reorganize sections, move controls, change information hierarchy,
   or "improve" structure that was not in scope.
2. **Never change business logic.** No edits to calculations, validation rules,
   permissions, state machines, or conditional behavior while doing UI work.
3. **Never change APIs.** No new endpoints, no altered request or response shapes, no
   changed query parameters, no modified data contracts.
4. **Never change routing.** URLs, route names, navigation targets, redirects, and
   deep links stay exactly as they are.
5. **Never create new visual patterns without establishing them as reusable
   standards.** A new pattern requires tokens, all states, responsive behavior,
   accessibility notes, documentation in this standard, and a home in the component
   library — before it appears on any page.
6. **Always compare changes against existing pages.** Open at least two comparable
   screens and match spacing, type, geometry, and action placement. Flag any
   inconsistency you find rather than propagating or silently "fixing" it.
7. **Preserve responsiveness.** Every change is verified at all breakpoints. No fixed
   pixel widths on content containers, no horizontal scrolling, no clipped controls,
   no desktop-only interactions, and no changes to existing breakpoints or collapse
   behavior.
8. **Preserve accessibility.** Never remove a focus outline, a label, an alt
   attribute, an ARIA relationship, a keyboard handler, or semantic markup. A change
   that reduces the accessibility of a screen is rejected.
9. **Tokens only.** No hard-coded colors, sizes, spacing, radii, shadows, or durations
   in components, inline styles, or overrides.
10. **No new dependencies, fonts, icon sets, CSS frameworks, or animation libraries**
    without explicit approval. The existing icon family and typeface are the only ones.
11. **Never delete or repurpose an existing token.** Add and deprecate; never redefine
    a token's meaning underneath the components that depend on it.
12. **Never ship a state you have not built.** Loading, empty, error, disabled, and
    no-permission states are part of the feature, not follow-up work.
13. **Never use color, icon, or motion as the sole carrier of meaning.**
14. **Never introduce a third accent color** or use the AI accent for non-AI content.
15. **Never let content jump.** Reserve space for asynchronous content and preserve
    scroll position across state changes.
16. **Never expand scope silently.** Refactors, rewrites, new patterns, new
    dependencies, and architecture changes require an explicit request (Section 03).
17. **Never choose novelty over consistency.** A better pattern becomes a proposal,
    not a local implementation (Section 04).
18. **When this standard is silent, choose the option most consistent with existing
    production screens — then propose the rule you had to invent** so the next person
    does not have to invent it differently.

────────────────────────────────────────────────────────────────────────
## 16. DEFINITION OF DONE
────────────────────────────────────────────────────────────────────────

A UI task is complete only when every one of these is true. If any is unmet, the task
is unfinished — regardless of how the screen looks.

✓ **Visual consistency maintained** — the change matches the established design
  language and the surrounding product.

✓ **No layout changes** — structure, positioning, hierarchy, navigation, and workflow
  are exactly as they were, unless redesign was explicitly requested.

✓ **No functional regressions** — behavior, logic, data, APIs, and routing are
  unchanged and verified.

✓ **Accessibility preserved** — focus, keyboard operability, contrast, semantics,
  labels, and reduced-motion support are intact or improved, never reduced.

✓ **Responsive behavior preserved** — every breakpoint verified; breakpoints and
  collapse strategies unchanged.

✓ **Shared design language followed** — tokens, components, and documented patterns
  only; nothing invented locally.

✓ **Visual QA checklist passed** — Section 14 completed in full, with any waiver
  written down and justified.

✓ **Existing pages remain visually consistent** — neighboring screens were compared
  after the change and no new outlier was created.

Report at completion: what changed, what was deliberately left unchanged, any
inconsistencies observed but not fixed, and any pattern worth proposing as a shared
standard.  
