# Pugna — frontend/backend contract (mobile repo)

This document is deliberately duplicated (same content, adapted per-repo specifics) at
`D:\pugna\docs\contract.md` and `D:\pugna-mobile\docs\contract.md`. The **Canonical** sections
below are meant to read identically in both copies — that's the actual contract. The sections
above them describe what's true specifically in *this* repo today.

## 1. Auth (this repo)

- Context: `src/auth/AuthContext.tsx`. Email+password **and real Google OAuth** — `login`/
  `signup`/`loginWithGoogle` call `POST /api/auth/login` / `/signup` / `/google`. Session
  bootstrap on mount: `GET /api/auth/me`.
- Google is genuinely wired, not a stub: `src/components/GoogleSignInButton.tsx` uses
  `expo-auth-session/providers/google` (`Google.useIdTokenAuthRequest`) + `expo-web-browser`.
  `onPress` calls `promptAsync()` if any client-id env var is configured, else surfaces
  `t('login.googleNotConfigured')`. Extracts `response.params.id_token`, calls
  `loginWithGoogle(idToken, role, homeLocation)` → `POST /api/auth/google`.
- Token: bearer string, `Authorization: Bearer <token>` header (`src/lib/api.ts:29`). Storage
  key **`pugna_token`** (`src/lib/api.ts:6`) — same key name as web. Native (iOS/Android):
  `expo-secure-store`. Web build (`Platform.OS === 'web'`): `@react-native-async-storage/
  async-storage` (SecureStore has no web backing).
- Env vars (`.env` / `.env.example`): `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB`
  / `_IOS` / `_ANDROID`. `.env.example`'s own comment says the backend must set the matching
  `GOOGLE_CLIENT_ID_WEB/_IOS/_ANDROID` (no `EXPO_PUBLIC_` prefix) — confirmed present in the
  web repo's `server/.env.example`.

## 2. API_BASE (this repo)

`src/lib/api.ts:5` and `src/lib/ws.ts:1-2` (duplicated, not shared):
```ts
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000'
```
Env var name: **`EXPO_PUBLIC_API_URL`** (web's is `VITE_API_URL` — different name, same
fallback value). Current `.env` value: `http://192.168.0.179:4000` (LAN IP, so a physical
device on Expo Go can reach the dev machine — see the file's own comment). `.env.example`
defaults to `http://localhost:4000`.

Code comments confirm one shared backend is assumed: `src/lib/ws.ts:5-6` — "Extend this
union (and the matching one in the web app's lib/ws.ts) whenever the backend's ws.js gains a
new broadcast* function." No production value documented here either — see the gap list.

## 3. Types as they exist here (pre-canonicalization)

No centralized types file; only `Role`, `User`, `Bout` are exported for reuse across files,
everything else is redeclared per screen.
- `Persona` (`src/onboarding/OnboardingContext.tsx:22`) is onboarding-only, distinct from
  `Role`: `'athlete' | 'coach' | 'club' | 'fan' | 'organizer'`, maps down to `Role` at signup.
- Event redeclared per screen: `(tabs)/index.tsx:16` / `events.tsx:17` (list, narrow),
  `events/[id].tsx:20-24` (`EventInfo`, detail, closest to the canonical shape below).
- `Bout` **is** exported and shared (`src/components/Bracket.tsx:4-14`) — genuinely not a
  gap, and byte-for-byte identical to web's.
- `LiveBout` (`events/[id].tsx:25`) and `CardBoutPublic` (`events/[id].tsx:28`) redeclared
  locally rather than imported from anywhere shared.
- `Nomination` (`club-admin/fighters.tsx:13`, club/fighter view) and `NominationRow`
  (`organizer-events/[id].tsx:205`, organizer view) — two shapes, same split as web.
- `Club` redeclared three times: `clubs/[id].tsx:14` (full), `(tabs)/clubs.tsx:16`
  (`PublicClub`, list-narrow), `club-admin/club-profile.tsx:11-14` (same as `[id].tsx`'s).

## 4. Event list/detail fetching (this repo)

- Discover (`(tabs)/index.tsx:34`) and Events tab (`(tabs)/events.tsx:37`) both call
  `GET /api/public/events`, filter/sort/slice client-side.
- Detail (`events/[id].tsx`): `GET /api/public/events/{id}` (line 57),
  `.../fighters` (58), `.../saved` (67), `.../muted` (74),
  `GET /api/public/bouts/{event.current_bout_id}` (81), plus
  `POST|DELETE .../mute` and `.../save`, and a nominate call (`NominateModal`).
- Organizer's own view: `organizer-events/[id].tsx`.
All real — none of this is mocked.

## 5. Deep links / QR / guest access (this repo)

- **No `/e/:token` or `/go/:code` route files exist** under `src/app` (confirmed via glob —
  no `src/app/e/`, no `src/app/go/`). The only URL-parsing logic is
  `src/lib/parsePugnaUrl.ts`'s `EVENT_PATH = /\/(?:events|e)\/([^/?#]+)/`, used only inside
  `scan.tsx` to pull an identifier out of scanned text — it's not a routed path.
- QR **scanning**: `src/app/scan.tsx` (`expo-camera`'s `CameraView`, `barcodeTypes: ['qr']`).
  `handleDecode` extracts the identifier, calls `GET /api/public/events/{identifier}`, then
  `router.replace('/events/{event.id}')`. Manual-entry fallback also present.
- QR **generation**: not found anywhere in this repo — organizers/clubs here cannot produce
  a QR for their own event today (web can).
- `events/[id].tsx` performs **no auth guard** — `user` from `useAuth()` only toggles the
  "saved" UI state, never redirects. So opening/scanning an event does bypass login in
  practice, but there's no distinct token/guest route — it's the same screen everyone uses.
- `app.json` has no `linking` config; only `"scheme": "pugnamobile"` (Expo Router's default
  handling, no custom path allowlist).

## 6. Routing (this repo)

Top-level (`src/app/_layout.tsx:50-59`): `(onboarding)`, `(tabs)`, `organizer`, `club-admin`,
`organizer-events/[id]`, `(auth)/login` + `(auth)/signup` (modals), `scan` (fullScreenModal).
Every file under `src/app` is globally reachable regardless of Stack registration —
role-gating happens per-destination (`organizer/_layout.tsx`, `club-admin/_layout.tsx`,
`(tabs)/_layout.tsx`).

`(tabs)` order, confirmed against actual code (matches the brief exactly):
1. `index` — DE "Entdecken" / EN "Discover"
2. `events` — DE "Veranstaltungen" / EN "Events"
3. `clubs` — DE "Vereine" / EN "Clubs"
4. `sparring` — DE "Sparring" / EN "Sparring"
5. `you` — DE "Mein Pugna" / EN "My Pugna"

`(tabs)/_layout.tsx` redirects `organizer` role → `/organizer`, `club` role → `/club-admin`,
unonboarded devices → `/(onboarding)/welcome`.

Other groups: `(auth)` (`login.tsx`, `signup.tsx`), `organizer/` (`index`, `events`,
`account`), `club-admin/` (`index`, `club-profile`, `coaches`, `events`, `fighters`, `live`,
`members`, `messages`, `my-events`, `notifications`, `sessions`, `sparring`, `settings`),
detail routes `clubs/[id]`, `events/[id]`, `fighters/[id]`, `organizer-events/[id]`, plus
`scan.tsx`, `search.tsx`.

## 7. i18n (this repo)

`src/i18n/translations.ts`: `en` (source of truth) and `de` (typed to require every `en`
key), **~537 keys** each. `src/i18n/LanguageContext.tsx`: `Lang = 'en' | 'de'`, default
`'de'`, persisted to AsyncStorage under key **`pugna_lang`** — same key name as web.

## 8. Onboarding flow (this repo)

Actual routed order (confirmed, corrects one detail vs. how it's sometimes described):
**Welcome → Persona → Location → Permissions → Account (signup) → Follow → Ready.** Follow
runs *after* signup, not before — `follow.tsx:23-27`'s own comment: "reached only right
after Account succeeds... deliberately after signup, not before."

Persona branching (`persona.tsx:42`): `organizer` → its own `organizer-info` →
`organizer-focus` → `permissions` flow (no Location/Follow steps). `club` and `fan`
(viewer) both go Location → Permissions → signup. A separate legacy 3-screen club flow
(`welcome → persona → club-info → signup`) and older fan/coach/athlete-specific screens
(`viewer-goals`, `interests`, `experience`, `gym`) remain registered but are not part of the
current main flow.

## 9. Realtime (this repo)

`src/lib/ws.ts` — identical message union to web's, confirmed:
```ts
export type EventMessage =
  | { type: 'bracket:update'; weightClassId: number }
  | { type: 'bout:live'; boutId: number | null; weightClassId: number | null }
  | { type: 'bout:result'; boutId: number; weightClassId: number; winnerId: number; method: string }
  | { type: 'event:status'; status: string }
```
Used in `events/[id].tsx:87-97` to live-update `current_bout_id`. No polling found anywhere.

## 10. Mocked vs real (this repo) — the important gap-analysis section

**Real** (calls a live `/api/...` endpoint): auth (login/signup/Google/me); Discover; Events
tab; Clubs tab (`/api/clubs`); event detail + fighters + save/mute/nominate; club detail;
scan's event lookup; You/Mein Pugna tab (`saved`, `following` for fighters and clubs);
Sparring tab + club-admin sparring/sessions (`/api/sparring*`); organizer dashboard
(`/api/events`, `/api/fighters`); club-admin dashboard (`/api/sparring/me`, `/api/events`,
`/api/clubs/me/events`) and its fighters/notifications/settings/club-profile/my-events
sub-screens.

**Mocked / static / not yet wired** (explicit placeholders, no `apiFetch` call):
- `club-admin/coaches.tsx` — `EmptyState`, comment: "lands with the club_roster table (Slice 2)"
- `club-admin/members.tsx` — same, Slice 2
- `club-admin/messages.tsx` — `EmptyState`, "lands with the messages table (Slice 4)"
- `club-admin/live.tsx` — scan button is real, but the "Live Updates" list is a static
  `EmptyState`, "becomes real once bouts gain live/round state (Slice 5)" — **directly
  relevant to Phase 2's live console**, since bouts don't have that state yet either.
- `club-admin/events.tsx` — no `apiFetch` calls found, not yet wired.
- Onboarding's `wantsNotifications` is client-only intent until applied via
  `PATCH /api/notifications/settings` post-signup — no real OS push-permission call exists.

---

## CANONICAL (shared with the web repo's contract.md — keep these two in sync)

### Types

**User / Role** — already identical in both repos, no work needed:
```ts
type Role = 'organizer' | 'club' | 'viewer'
type User = { id: number; name: string; email: string; role: Role; home_location: string }
```

**Bout** — already identical in both repos (both export it from their Bracket component):
```ts
type Bout = {
  id: number; round: number; slot: number
  fighter_red_id: number | null; fighter_blue_id: number | null
  status: string; winner_id: number | null; method: string | null
  event_day_id?: number | null
}
```

**LiveBout** — near-identical; converge on this repo's version (it already includes `status`):
```ts
type LiveBout = { id: number; weight_class_id: number; status: string; fighterRed: { name: string } | null; fighterBlue: { name: string } | null }
```

**CardBoutPublic** — already the same shape in both repos, just inconsistently named in the
web repo (`CardBout` in one file, `CardBoutPublic` in another). This repo's naming is already
correct — no change needed here.
```ts
type CardBoutPublic = {
  id: number; fighter_a_name: string; fighter_a_record: string
  fighter_b_name: string; fighter_b_record: string
  weight_class_text: string; card_position: 'main' | 'co-main' | 'undercard'
  rounds: number | null
}
```

**Event** — canonical name **`Event`** (currently `EventInfo` here, and `EventRow`/
`EventDetail`/`PublicEventDetail`/`EventResult` across the two repos). Full shape, backend
field names:
```ts
type Event = {
  id: number; name: string; date: string; location: string; venue: string
  discipline: string; status: string; format: 'bracket' | 'card'
  livestream_url: string; qr_token: string
  fights: number; fighters: number; views: number; organizer_name: string
  current_bout_id: number | null; number_of_days: number; ring_count: number
}
```
This repo's `EventInfo` (`events/[id].tsx:20-24`) is already the closest match to this shape
of any type in either codebase — good reference point. List/public endpoints returning a
narrower subset is fine; the real gap is the web repo's *organizer* detail endpoint omitting
fields the public one has (see web's contract.md).

**Nomination** — two legitimately different, role-scoped shapes exist in *both* repos
already; keep two types but rename consistently (this repo currently uses `Nomination` for
the club view and `NominationRow` for the organizer view — align both repos on):
```ts
type OrganizerNomination = { id: number; status: 'pending' | 'accepted' | 'rejected'; club_name: string; fighter_name: string; fighter_weight: string; fighter_record: string; weight_class_name: string; note: string }
type MyNomination = { id: number; status: 'pending' | 'accepted' | 'rejected'; event_name: string; weight_class_name: string; fighter_name: string }
```

**Club** — canonical name **`Club`**, full shape (narrower `PublicClub` for list views is fine):
```ts
type Club = {
  id: number; name: string; location: string; disciplines: string[]
  founded_year: number | null; member_count: number; description: string
  logo_url: string; cover_url: string; lat?: number | null; lng?: number | null
}
```

### Status enums — the central Phase 1/2 gap

Only `'scheduled'` and `'completed'` are ever written to a bout's `status` in either repo's
code. Event-day status is the separate `{scheduled, live, completed}` enum. **The brief's
proposed bout statuses (Scheduled | Delayed | Scratched | Walkover | In progress | Final |
Intermission) do not exist in the schema.** `Walkover` today is a *method* on a completed
bout, not a status. "In progress" is modeled as the event's `current_bout_id` pointer, not a
per-bout state. Delayed/Scratched/Intermission have no column, enum, or endpoint anywhere.
**This blocks Phase 2's live console in both apps** until the backend adds real support —
note `club-admin/live.tsx`'s own comment already anticipates this ("Slice 5").

### Canonical route map

| Canonical (brief) | Web today | Mobile today | Gap |
|---|---|---|---|
| `/e/:slug` | ✅ `/e/:token`, bypasses app shell | ❌ not found — `/events/[id]` serves this role but has no distinct guest/token entry | **Mobile missing** |
| `/go/:code` | ❌ not found | ❌ not found | Missing both |
| `/events` | ✅ | ✅ `(tabs)/events` | OK |
| `/clubs` | ✅ | ✅ `(tabs)/clubs` | OK |
| `/sparring` | ✅ (stub-level, per non-goals OK) | ✅ `(tabs)/sparring` | OK |
| `/login` `/register` | ⚠️ `LoginModal` overlay, no dedicated route/URL | ✅ `(auth)/login`, `(auth)/signup` | Web has no addressable route |
| `/you` | ⚠️ `/home` (viewer-only) | ✅ `(tabs)/you` | Naming differs, functionally analogous |
| `/host/:eventId/live` | ⚠️ `/organizer/events/:eventId/manage` (full builder) | ⚠️ `organizer-events/[id].tsx` (same situation) | Missing both — Phase 2 work |

### Follow / QR — gap summary

- Club follow ✅ both repos, identical endpoints.
- Fighter follow ✅ both repos, identical endpoints.
- **Event follow ❌ missing both** — only save/mute exist. Decide: reuse `save` semantics for
  the brief's "Follow CTA" on the live card, or add a real event-follow endpoint later.
- QR **generation**: web only. **This repo has no way to generate/display a QR** for an
  event it organizes — gap for this repo's Phase 2.3 work.
- QR **scanning**/deep-link resolution: this repo's `scan.tsx` already resolves a scanned
  token or numeric id via `/api/public/events/{identifier}` and navigates in — directly
  reusable once `/go/:code` exists as a real route.

### i18n — gap summary

Both: localStorage/AsyncStorage key `pugna_lang`, default `de` — identical. This repo has
~537 keys vs. web's 424 — no shared source of truth, no tooling keeps them in sync. Not a
blocker (the brief explicitly doesn't want the codebases merged), but flagged as an ongoing
maintenance risk.

### Overall gap list (exists | partial | missing)

- Shared event list endpoint — **exists**, identical on both.
- Public live event detail — **exists** both, but the web organizer-detail shape diverges
  from the public one in ways that should converge.
- Realtime bout/bracket updates — **exists** both, message union already identical.
- Bout status lifecycle beyond scheduled/completed (Delayed/Scratched/In-progress/
  Intermission) — **missing**, backend work required before Phase 2.
- `/e/:slug` public guest route — **exists web, missing mobile**.
- `/go/:code` short-link — **missing both**.
- Organizer live console (dedicated, not the full builder) — **missing both**.
- Event follow — **missing both** (save/mute exist as a partial substitute).
- QR generation on mobile — **missing** (scanning exists).
- Production `API_BASE` value — **undocumented** in either repo; needs verifying against
  actual Vercel/hosting env vars outside the codebase before assuming the deployed apps can
  reach a real backend at all.
- `docs/contract.md` itself — **exists now**, this file.
