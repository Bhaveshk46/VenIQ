# VenIQ — Intelligent Stadium Concierge

**Repository:** [https://github.com/Bhaveshk46/VenIQ](https://github.com/Bhaveshk46/VenIQ)

**Live demo:** [https://veniq-792113099008.asia-south2.run.app](https://veniq-792113099008.asia-south2.run.app)

VenIQ is a mobile-first web app that helps fans navigate a stadium, plan travel to/from the venue, and get AI-powered assistance. It combines **Google AI (Gemini)**, **Google Maps APIs** (Places, Directions, Geocoding), and **Firebase** for auth and live data.

---

## Chosen vertical

**Stadium & venue technology** — match-day navigation, facilities discovery, and concierge-style help on a phone. The product is optimized for one-handed use, poor lighting, and intermittent connectivity typical inside venues.

---

## Approach and logic

1. **Single source of truth for the map** — All venue points (`VENUE_LOCATIONS` in `utils/directions.js`) use `top` / `left` percentages on a square viewport. The **live map** (`MapScreen`) and the **Directions “Stadium Layout Hint”** share the same background image (`/emerald_map.png`), the same edge mask, and the same percentage coordinates so the hint stays aligned with the core map.
2. **Progressive loading** — Route-level code splitting (`React.lazy`) keeps the initial bundle smaller.
3. **Context-aware AI** — The concierge receives match status, crowd context, and optional selected zone from `StadiumContext` so answers stay relevant.
4. **Travel planning** — Outside the stadium, Google Maps powers autocomplete, geocoding, and driving directions; inside, Gemini augments routing copy with a heuristic fallback.

---

## How the solution works

| Area | Behavior |
|------|----------|
| **Auth** | Google sign-in via Firebase Auth (`AuthContext`). |
| **Map** | Interactive markers from `VENUE_LOCATIONS`; tap opens `ZoneBottomSheet` with zone details, seating, and “Route here” into Directions. |
| **Directions — Inside** | Pick origin/destination from venue lists; optional Gemini route narrative with fallback heuristics; **layout hint** reuses the same map asset and coords as the Map tab. |
| **Directions — Travel** | Area search (Places), geocode, driving route (Directions API), illustrative cab/transit UI. |
| **Chat** | Gemini API with sanitized, length-limited input and cooldown to reduce abuse and cost. |
| **Tickets** | Deterministic demo ticket from user id + QR; deep link to map seat. |
| **Live data** | Firebase Realtime DB for crowd levels and match status (when configured). |

---

## Assumptions

- **Coordinates** — `top`/`left` values are a consistent model of the venue; they align to the map image when both use the same square frame and `object-fit: contain` / SVG `preserveAspectRatio="xMidYMid meet"`. Fine-tuning would require image-specific calibration if the artwork’s aspect ratio differs from the container.
- **Connectivity** — Users have enough signal for Maps and Firebase during the demo.
- **API keys** — Google and Gemini keys are supplied via environment variables (see `.env.example`); production should restrict keys by HTTP referrer or bundle for client-side Maps usage.
- **Crowd data** — Live occupancy is illustrative or fed from your Firebase schema.

---

## Evaluation focus areas (how we address them)

### Code quality

- Clear separation: screens, contexts, services (`services/gemini.js`, `services/firebase.js`), shared utils (`utils/directions.js`, `src/utils/mapLayout.js`).
- Reusable UI pieces (e.g. `StadiumLayoutHint.jsx` for map-consistent previews).

### Security

- Chat input sanitized and length-capped; API keys not committed; Firebase rules assumed for production data.

### Efficiency

- Lazy-loaded routes; memoized markers on the map; rate limiting on AI calls via cooldown.

### Testing

- `npm run test` — Vitest unit tests (e.g. `src/utils/directions.test.js`).

### Accessibility

- Semantic roles (`main`, `navigation`, `tablist` where used), `aria-label` on interactive map markers and hint preview, keyboard-capable controls for primary flows.

### Google services

- **Gemini** — Concierge chat and inside-stadium directions copy.
- **Maps JavaScript API** — Places autocomplete, Geocoding, Directions for travel planner.
- **Firebase** — Authentication and Realtime Database for live stadium signals.

---

## Local development

```bash
npm install
cp .env.example .env   # fill in keys
npm run dev
```

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run test` | Vitest |
| `npm run lint` | ESLint |

---

## License / submission

This repository contains the **complete project code** for evaluation. Use the **GitHub link** at the top as the public repository URL for submissions.
