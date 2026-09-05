# Pugna (mobile)

Expo Router app for Pugna — the mobile side of a private network for amateur
combat sports. Shares one backend with the web app (`pugna` repo, `server/`
directory): same API, same event data, real-time bracket updates over the
same websocket.

## Running locally

```bash
npm install
npm run web       # Expo web preview at http://localhost:8081
# or
npm start         # QR code for Expo Go on a physical device / simulator picker
```

The backend (`server/` in the sibling `pugna` repo) must be running
separately — see that repo's README. This app has no local database of its
own; everything comes from the shared API.

## Environment variables

Copy `.env.example` to `.env` and fill in what you need:

- `EXPO_PUBLIC_API_URL` — backend base URL. `localhost` works for Expo web
  preview and the iOS Simulator; a physical device on Expo Go needs your dev
  machine's LAN IP instead (e.g. `http://192.168.0.179:4000`), since the
  device can't resolve `localhost` to your machine.
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` / `_IOS` / `_ANDROID` — optional, only
  needed for "Sign in with Google". The same three values (without the
  `EXPO_PUBLIC_` prefix) must also be set on the backend as
  `GOOGLE_CLIENT_ID_WEB` / `_IOS` / `_ANDROID` so it can verify tokens against
  the right audience.

## Seeding demo data

There's no seed step in this repo — the backend seeds itself (demo clubs,
events, and weight-class template packs) the first time it starts against an
empty database. See the `pugna` (web) repo's README for how to force a fresh
seed.

## QR codes

This app scans event QR codes (`scan.tsx`) but doesn't generate them —
QR generation for a published event lives on the web app (Organizer → Manage
Event → Setup tab). See that repo's README for print-size guidance.
