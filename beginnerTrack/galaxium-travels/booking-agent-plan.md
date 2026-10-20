# BookingAgent Component — Plan

## Top-Level Overview

Add a **mock AI booking agent** component called `BookingAgent` to the Galaxium Travels frontend.
The component accepts a natural-language text input (e.g. `"cheapest route to Europa"`) and returns
the **top 3 matching `Flight` results** using pure client-side JavaScript logic — no real LLM, no API call.

The matching logic must handle two complementary signals extracted from the query:
- **Keyword matching** — destination/origin names found inside the query text
- **Intent detection** — price intent (`"cheap"`, `"budget"`, `"affordable"`, etc.) and speed intent (`"fast"`, `"quick"`, `"direct"`, etc.)

Results are ranked by a composite score and rendered as a compact list of flight cards inside the component.

The component is self-contained (its own `.tsx` + co-located `.css`), follows all existing project conventions (Tailwind + Framer Motion + Lucide React + `// Made with Bob`), and is surfaced on the **Home page** so it is immediately visible.

---

## Sub-Tasks

---

### Sub-Task 1 — Pure matching/ranking logic (`useBookingAgent` hook)

**Intent**
Isolate the AI-simulation logic in a custom hook so it can be tested and reused independently of the UI.

**Expected Outcomes**
- A file `src/hooks/useBookingAgent.ts` exports `useBookingAgent(flights: Flight[])`
- The hook exposes `{ query, setQuery, results, isThinking }` (mirroring existing hook patterns)
- Matching algorithm:
  1. Tokenise the query (lowercase, split on whitespace/punctuation)
  2. Score each flight by:
     - +3 for each token that substring-matches `destination` (case-insensitive)
     - +2 for each token that substring-matches `origin` (case-insensitive)
     - +2 if any **price-intent keyword** is present (`cheap`, `budget`, `affordable`, `low`, `inexpensive`, `deal`, `save`) — bonus applied inversely proportional to price rank (cheapest flight in the set gets the most bonus)
     - +2 if any **speed-intent keyword** is present (`fast`, `quick`, `express`, `direct`, `short`, `rapid`) — bonus applied inversely proportional to flight duration rank
  3. Sort by score descending; return top 3 flights with score > 0; if no score > 0, return []
- A 600 ms simulated async delay (`isThinking` true → false) to mimic agent "thinking"
- No external dependencies; uses only the `Flight` type from `src/types/index.ts`

**Todo List**
- [ ] Create `src/hooks/useBookingAgent.ts`
- [ ] Implement `tokenise(query)` helper (pure function, no side effects)
- [ ] Implement `detectIntents(tokens)` returning `{ wantsCheap, wantsFast }`
- [ ] Implement `scoreFlights(flights, tokens, intents)` returning `Array<{ flight, score }>`
- [ ] Implement `useBookingAgent` hook: `useState` for query + results + isThinking; `useEffect` that debounces via `setTimeout` 600 ms, calls score logic, sets top 3
- [ ] Add `// Made with Bob` comment at end of file

**Relevant Context**
- `src/types/index.ts` — `Flight` interface (fields: `flight_id`, `origin`, `destination`, `departure_time`, `arrival_time`, `price`, `seats_available`)
- `src/hooks/useUser.tsx` — hook pattern to follow (named export, no default export)
- `src/pages/Flights.tsx:31–56` — existing case-insensitive substring search pattern to mirror
- `src/utils/formatters.ts` — `calculateDuration` can be reused inside scoring for speed ranking

**Status**: [ ] pending

---

### Sub-Task 2 — `BookingAgent` UI component

**Intent**
Build the visual component that wraps the hook, renders the text input, a loading indicator, and the ranked result cards.

**Expected Outcomes**
- A file `src/components/BookingAgent/BookingAgent.tsx` with a named export `BookingAgent`
- A co-located `src/components/BookingAgent/BookingAgent.css` for any non-Tailwind styles needed
- Props: `flights: Flight[]` (passed in from the parent; no internal fetching)
- UI structure:
  - A labelled text input (reuses `Input` from `src/components/common`) with a `Bot` or `Sparkles` Lucide icon
  - Placeholder: `"Try: cheapest route to Mars..."`
  - A "thinking" indicator (animated `LoadingSpinner` or pulsing dots) shown while `isThinking === true`
  - Result list: up to 3 compact flight cards — destination, origin, price (via `formatCurrency`), duration (via `calculateDuration`), a "Book" button stub (calls `onBook` if provided)
  - Empty state when query is non-empty but results are empty: friendly "No matching routes found" message
  - Idle state when query is empty: subtle prompt text
- Framer Motion entrance animations on result cards (stagger pattern matching `FlightCard`)
- Tailwind + existing custom classes (`glass-card`, `btn-primary`, theme colours)

**Todo List**
- [ ] Create directory `src/components/BookingAgent/`
- [ ] Create `BookingAgent.tsx` importing `useBookingAgent`, `Input`, `LoadingSpinner`, `formatCurrency`, `calculateDuration`, Lucide icons, Framer Motion
- [ ] Define `BookingAgentProps` interface (`flights: Flight[]`; optional `onBook?: (flight: Flight) => void`)
- [ ] Build input section with icon and placeholder
- [ ] Build animated results section (map over results, stagger with `transition={{ delay: index * 0.1 }}`)
- [ ] Build empty/idle states
- [ ] Create `BookingAgent.css` (minimal; only what Tailwind cannot handle)
- [ ] Add `// Made with Bob` comment at end of file

**Relevant Context**
- `src/components/common/` — `Input`, `LoadingSpinner`, `Card`, `Button` available for reuse
- `src/components/FlightCard.tsx` — compact card layout + Framer Motion pattern to mirror
- `src/utils/formatters.ts` — `formatCurrency`, `calculateDuration`
- Tailwind theme: `cosmic-purple`, `nebula-pink`, `alien-green`, `solar-orange`, `star-white`; classes `.glass-card`, `.btn-primary`, `.input-field`

**Status**: [ ] pending

---

### Sub-Task 3 — Barrel export

**Intent**
Make `BookingAgent` importable from the shared components barrel so the rest of the app follows the existing import convention.

**Expected Outcomes**
- `src/components/common/index.ts` gains a line: `export { BookingAgent } from '../BookingAgent/BookingAgent';`
- No other files are changed in this sub-task

**Todo List**
- [ ] Open `src/components/common/index.ts`
- [ ] Append the `BookingAgent` export line following the existing style

**Relevant Context**
- `src/components/common/index.ts` — existing barrel (Button, Card, Input, Modal, LoadingSpinner, Starfield)

**Status**: [ ] pending

---

### Sub-Task 4 — Surface on the Home page

**Intent**
Place the `BookingAgent` component on the Home page so users can interact with it immediately without navigating elsewhere.

**Expected Outcomes**
- `src/pages/Home.tsx` renders `<BookingAgent flights={flights} onBook={handleBook} />` in a logical position (below the hero section, before or replacing the existing featured-flights area)
- The Home page fetches flights if it does not already do so; if it does, the existing data is reused
- `handleBook` navigates to `/flights` (consistent with existing CTA buttons on the Home page)
- No layout regressions; the component sits within the existing page width constraints

**Todo List**
- [ ] Read `src/pages/Home.tsx` to understand current structure and whether flights are already fetched
- [ ] If flights are not fetched on Home: add `useState<Flight[]>` + `useEffect` calling `getFlights()` (pattern from `Flights.tsx:58–70`)
- [ ] Import `BookingAgent` and render it in the appropriate section
- [ ] Wire `onBook` to navigate to `/flights` using `useNavigate` (already used elsewhere)
- [ ] Add a section heading (e.g. `"AI Route Finder"`) with consistent typography

**Relevant Context**
- `src/pages/Home.tsx` — target page
- `src/pages/Flights.tsx:58–70` — data-fetching pattern
- `src/services/api.ts` — `getFlights()` function
- `src/App.tsx` — routing; `/flights` is the correct target path

**Status**: [ ] pending

---

## Implementation Notes

- The hook must not import React's `useEffect` before checking that the query is non-empty — an empty query should immediately short-circuit and set `results = []` without the delay.
- `calculateDuration(departure_time, arrival_time)` from `formatters.ts` returns a string like `"5h 30m"`; for speed scoring, parse hours+minutes back to total minutes for numeric comparison.
- The `onBook` prop on `BookingAgent` is optional; if omitted, the Book button in result cards is hidden (not disabled) — keeps the component usable in a demo/preview context without a booking flow.
- All new files must end with `// Made with Bob`.

<!-- Status: pending implementation -->
