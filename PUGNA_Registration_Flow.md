# Pugna — exact registration flow
Account is created in **one screen**. Role is already chosen (or inferred).
Guest viewing a card is not registration.

---

## When registration starts

| Entry | `role` | `next` | Guest button |
|---|---|---|---|
| Welcome → Konto erstellen → pick role ≠ Zuschauen | that role | home for role | hidden |
| Welcome → Konto erstellen → Zuschauen | viewer | `/watch` or `/events` | shown, but viewer usually isn’t here |
| Role → Kämpfer:in / Verein / Veranstalter | that role | `/you` `/club` `/host` | **hidden** |
| Live card → Follow → Anmelden | viewer | `/e/:slug` | “Weiter schauen” dismisses sheet, no account |
| /watch → Updates erhalten | viewer | last card or `/events` | hidden on account (they chose updates) |
| Welcome → Anmelden | stored / none | by role after profile load | hidden (login mode) |
| Deep link `/e/*` | none until Follow | that slug | n/a |

Create vs login is the same route: `/account`.
`mode=register | login` (toggle at bottom).

---

## Screen `/account`

### Register mode
1. Email  
2. Password (min 8)  
3. Password repeat (or hide if magic-link only — pick **one**; v1 = email+password + Google)  
4. Primary: **Konto erstellen**  
5. **Weiter mit Google**  
6. If `role` is viewer or missing: **Als Gast weiter** → `next` or `/events`  
7. If `role` is fighter | club | organizer: **no guest button**  
8. Link: Bereits Konto? **Anmelden** → mode=login  
9. Microcopy: “Mit Konto erstellen akzeptierst du Nutzungsbedingungen und Datenschutz.”  
   Both titles are links.

### Login mode
1. Email  
2. Password  
3. Primary: **Anmelden**  
4. **Weiter mit Google**  
5. Link: Neu hier? **Konto erstellen**  
6. Forgot password → existing reset if you have it; else hide

### Validation
- Email valid  
- Password ≥ 8  
- Google: use existing OAuth; on success same `next` / fields logic  
- Error inline, stay on screen  
- Duplicate email on register → switch to login hint

### Legal
Tapping Konto erstellen or Google = acceptance.  
No extra checkbox required if the sentence + links sit directly under the button (common DE pattern). Lawyer can insist on a checkbox later — UI reserve one line.

---

## After auth success (exact order)

```
1. Session cookie / token set
2. If profile.role empty AND query.role set → save role
3. If query.next is a safe internal path (/e/, /events, /club, /host, /you, /watch)
      AND (role is viewer OR next is a public card)
      → go next immediately
4. Else if role is fighter | club | organizer
      AND required fields missing
      → /onboarding/fields?role=
5. Else land:
      viewer     → next || /events
      fighter    → /you
      club       → /club
      organizer  → /host
```

Safe `next`: must start with `/` and not `//`, not `http`.

---

## Fields screen (after register, not on `/account`)

Never block login if fields already exist.

| Role | Required to leave | Optional | Skip |
|---|---|---|---|
| viewer | none | city | screen omitted |
| fighter | none v1 | name, weight, sport=Boxen, club, city | Überspringen → /you |
| club | **club name** (if skip, `/club` shows name modal once) | city, gym | Überspringen |
| organizer | **org name** same pattern | city | Überspringen |

Weiter saves PATCH profile/club/org then lands.

---

## What the API creates

**Register**
```
User { email, passwordHash | googleId, locale, role }
```
- fighter: empty FighterProfile  
- club: empty Club (name may wait for fields)  
- organizer: empty OrganizerProfile  
- viewer: user only  

**Do not** create an Event on register.

---

## Viewer “updates” is still this flow

Follow sheet → `/account?role=viewer&next=/e/{slug}&mode=register`  
After success: Follow that slug automatically, then land on the card.  
If they only wanted notify: same, Follow + notify default on for that event.

---

## Out
- Phone OTP as v1 requirement  
- Social except Google  
- Captcha unless abused  
- Role change during `/account` (they already picked it)  
- Camera / push permission on this screen  
- Creating a club and an org in one submit (one role per register; extra hat later in Settings)
