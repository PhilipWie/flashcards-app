# API

**HOME** [README](../../README.md) · [Technische Dokumentation](README.md)

Das Backend stellt eine JSON-API unter `http://localhost:3000/api` bereit (Port aus `PORT` in der `.env`).

## Allgemeines

### Authentifizierung
Alle Endpunkte außer Health, Registrierung und Login sind geschützt (Middleware `requireAuth`). Der Client schickt das Token aus dem Login im Header mit:

```
Authorization: Bearer <token>
```

Fehlt das Token, ist es ungültig oder abgelaufen, antwortet der Server mit `401 { "message": "unauthorized" }`.
Der Nutzer ergibt sich immer aus dem Token. Jeder Nutzer sieht und ändert nur seine eigenen Decks und Karten. Fremde Decks oder Karten liefern `404`, als gäbe es sie nicht.
Details: [JWT](jwt.md)

### Request-Body
Requests mit Body senden JSON mit dem Header `Content-Type: application/json`.

### Fehlerformat
Fehler werden als JSON mit einer Meldung beantwortet:

```json
{ "message": "Deck not found" }
```

Die Meldungen sind auf Englisch und für Entwickler gedacht. Das Frontend sollte sich am Statuscode orientieren.

### Statuscodes

| Status | Bedeutung |
|--------|-----------|
| 200 | Erfolg |
| 201 | Erfolgreich angelegt |
| 204 | Erfolgreich gelöscht, kein Body |
| 400 | Ungültige Eingabe (falscher Typ, leer, zu lang, ungültige ID) |
| 401 | Nicht angemeldet oder Token ungültig |
| 404 | Nicht gefunden oder gehört einem anderen Nutzer |
| 409 | Konflikt, z. B. E-Mail bereits registriert |
| 429 | Zu viele Anfragen (Rate Limit) |
| 500 | Interner Serverfehler (Details nur im Server-Log) |

### Rate Limits
Pro IP-Adresse und Minute:

| Limit | Anfragen/Min. | Gilt für |
|-------|---------------|----------|
| `authLimit` | 15 | Registrierung, Login |
| `apiLimit` | 80 | Decks, Karten, Lernmodus, `GET /api/health/db` |

Wird ein Limit überschritten, antwortet der Server mit `429 { "message": "too many requests, try again later" }`. Die Header `RateLimit-*` zeigen den aktuellen Stand.

### Übersicht

| Methode | Pfad | Geschützt | Beschreibung |
|---------|------|-----------|--------------|
| GET | `/api/health` | nein | Server läuft |
| GET | `/api/health/db` | nein | Datenbank erreichbar |
| POST | `/api/register` | nein | Konto anlegen, siehe [Authentication](authentication.md) |
| POST | `/api/login` | nein | Anmelden, liefert Token, siehe [JWT](jwt.md) |
| GET | `/api/decks` | ja | Eigene Decks auflisten |
| POST | `/api/decks` | ja | Deck anlegen |
| PATCH | `/api/decks/:id` | ja | Deck umbenennen |
| DELETE | `/api/decks/:id` | ja | Deck mit allen Karten löschen |
| GET | `/api/decks/:deckId/cards` | ja | Alle Karten eines Decks |
| POST | `/api/decks/:deckId/cards` | ja | Karte anlegen |
| PATCH | `/api/cards/:id` | ja | Karte ändern |
| DELETE | `/api/cards/:id` | ja | Karte löschen |
| GET | `/api/decks/:deckId/review` | ja | Heute fällige Karten eines Decks |
| POST | `/api/cards/:id/review` | ja | Antwort speichern (Leitner) |

IDs in Pfaden müssen positive ganze Zahlen sein, sonst `400`.

---

## Health

### `GET /api/health`
Prüft, ob der Server läuft. Kein Rate Limit.

```json
{ "status": "ok", "uptime": 12.34, "timestamp": "2026-11-27T08:00:00.000Z" }
```

### `GET /api/health/db`
Prüft, ob die Datenbank erreichbar ist.

| Status | Body |
|--------|------|
| 200 | `{ "status": "ok", "database": "up" }` |
| 503 | `{ "status": "error", "database": "down" }` |

---

## Decks

Ein Deck (im Frontend "Stapel") ist ein Ordner für Karten.

```json
{ "id": 1, "name": "Webentwicklung" }
```

### `GET /api/decks`
Alle Decks des angemeldeten Nutzers.

**Antwort `200`**
```json
{ "decks": [ { "id": 1, "name": "Webentwicklung" } ] }
```

### `POST /api/decks`
Legt ein Deck an.

| Feld | Typ | Regeln |
|------|-----|--------|
| `name` | string | wird getrimmt, 1 bis 60 Zeichen |

**Antwort `201`**
```json
{ "deck": { "id": 2, "name": "Datenbanken" } }
```

Fehler: `400` (kein String, leer oder zu lang).

### `PATCH /api/decks/:id`
Benennt ein Deck um. Body und Regeln wie bei `POST`.

**Antwort `200`**
```json
{ "deck": { "id": 2, "name": "Datenbanken 2" } }
```

Fehler: `400`, `404 { "message": "deck not found" }`.

### `DELETE /api/decks/:id`
Löscht ein Deck. Alle Karten darin werden von der Datenbank mitgelöscht (`ON DELETE CASCADE`).

**Antwort `204`** ohne Body.

Fehler: `400`, `404 { "message": "Deck not found" }`.

---

## Karten

```json
{
  "id": 7,
  "front": "Was ist ein JWT?",
  "back": "Ein signiertes Token, mit dem sich der Client ausweist.",
  "box": 1,
  "next_review": "2026-11-27"
}
```

| Feld | Bedeutung |
|------|-----------|
| `box` | Leitner-Fach 1 bis 5 (siehe [Lernmodus](#lernmodus-leitner)) |
| `next_review` | Datum (`YYYY-MM-DD`), ab dem die Karte wieder fällig ist |

Neue Karten starten in Fach 1 und sind sofort fällig.

### `GET /api/decks/:deckId/cards`
Alle Karten eines Decks, unabhängig von der Fälligkeit.

**Antwort `200`**
```json
{ "cards": [ { "id": 7, "front": "...", "back": "...", "box": 1, "next_review": "2026-11-27" } ] }
```

Fehler: `400` (ungültige Deck-ID), `404 { "message": "Deck not found" }`.

### `POST /api/decks/:deckId/cards`
Legt eine Karte im Deck an.

| Feld | Typ | Regeln |
|------|-----|--------|
| `front` | string | wird getrimmt, 1 bis 1000 Zeichen |
| `back` | string | wird getrimmt, 1 bis 1000 Zeichen |

**Antwort `201`**
```json
{ "card": { "id": 8, "front": "...", "back": "...", "box": 1, "next_review": "2026-11-27" } }
```

Fehler: `400`, `404` (Deck nicht gefunden).

### `PATCH /api/cards/:id`
Ändert Vorder- und/oder Rückseite. Nur mitgeschickte Felder werden geändert, mindestens eins ist Pflicht. Fach und Fälligkeit bleiben unverändert.

| Feld | Typ | Regeln |
|------|-----|--------|
| `front` | string (optional) | wird getrimmt, 1 bis 1000 Zeichen |
| `back` | string (optional) | wird getrimmt, 1 bis 1000 Zeichen |

**Antwort `200`**
```json
{ "card": { "id": 8, "front": "...", "back": "...", "box": 1, "next_review": "2026-11-27" } }
```

Fehler: `400` (z. B. `no changes given`), `404 { "message": "Card not found" }`.

### `DELETE /api/cards/:id`
Löscht eine Karte.

**Antwort `204`** ohne Body.

Fehler: `400`, `404`.

---

## Lernmodus (Leitner)

Die Karten werden nach dem Leitner-System wiederholt. Die Logik liegt komplett im Backend ([leitner.ts](../../backend/src/lib/leitner.ts)), das Frontend meldet nur "gewusst" oder "nicht gewusst".

| Fach | Nächste Wiederholung nach |
|------|---------------------------|
| 1 | 1 Tag |
| 2 | 2 Tagen |
| 3 | 4 Tagen |
| 4 | 8 Tagen |
| 5 | 16 Tagen (gelernt) |

- **Gewusst:** ein Fach höher (höchstens Fach 5)
- **Nicht gewusst:** zurück in Fach 1
- `next_review` = heute + Intervall des neuen Fachs. "Heute" berechnet die Datenbank (`CURRENT_DATE`), damit Abfrage und Speicherung dasselbe Datum nutzen.

```mermaid
flowchart LR
    F1["Fach 1<br/>1 Tag"] -- gewusst --> F2["Fach 2<br/>2 Tage"]
    F2 -- gewusst --> F3["Fach 3<br/>4 Tage"]
    F3 -- gewusst --> F4["Fach 4<br/>8 Tage"]
    F4 -- gewusst --> F5["Fach 5<br/>16 Tage"]
    F5 -- gewusst --> F5
    F2 & F3 & F4 & F5 -- nicht gewusst --> F1
    F1 -- nicht gewusst --> F1
```

### `GET /api/decks/:deckId/review`
Alle **heute fälligen** Karten eines Decks (`next_review` ≤ heute). Die Liste kann leer sein, dann gibt es heute nichts zu lernen.

**Antwort `200`**
```json
{ "cards": [ { "id": 7, "front": "...", "back": "...", "box": 2, "next_review": "2026-11-25" } ] }
```

Fehler: `400`, `404 { "message": "Deck not found" }`.

### `POST /api/cards/:id/review`
Speichert die Antwort und verschiebt die Karte.

| Feld | Typ | Regeln |
|------|-----|--------|
| `correct` | boolean | `true` = gewusst, `false` = nicht gewusst |

**Antwort `200`**: die Karte mit neuem Fach und neuem Datum
```json
{ "card": { "id": 7, "front": "...", "back": "...", "box": 3, "next_review": "2026-12-01" } }
```

Fehler: `400` (z. B. `correct must be a boolean`), `404 { "message": "Card not found" }`.

---

## Beispiel (curl)

Token aus dem Login in eine Variable legen und damit arbeiten:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "geheim123"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')

# Deck anlegen
curl -i -X POST http://localhost:3000/api/decks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Webentwicklung"}'

# Karte im Deck 1 anlegen
curl -i -X POST http://localhost:3000/api/decks/1/cards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"front": "Was ist ein JWT?", "back": "Ein signiertes Token."}'

# Fällige Karten von Deck 1
curl -i http://localhost:3000/api/decks/1/review \
  -H "Authorization: Bearer $TOKEN"

# Karte 1 als gewusst markieren
curl -i -X POST http://localhost:3000/api/cards/1/review \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"correct": true}'
```

## Bekannte Einschränkungen

- Die Fehlermeldungen sind nur auf Englisch und ohne festen Fehlercode. Geplant in Issue [#2](https://github.com/PhilipWie/flashcards-app/issues/2).
