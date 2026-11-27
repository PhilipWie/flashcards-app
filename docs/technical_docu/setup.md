# Setup

**HOME** [README](../../README.md) · [Technische Dokumentation](README.md)

So wird das Projekt lokal eingerichtet und gestartet.

## Voraussetzungen

| Software | Version | Wofür |
|----------|---------|-------|
| [Node.js](https://nodejs.org) | 24 | Backend und Frontend (dieselbe Version nutzt die CI) |
| [Docker](https://www.docker.com) (mit Docker Compose) | aktuell | PostgreSQL-Datenbank |
| Git | aktuell | Repository klonen |

## 1. Repository klonen

```bash
git clone git@github.com:PhilipWie/flashcards-app.git
cd flashcards-app
```

Das Repository besteht aus zwei eigenständigen npm-Projekten: `backend/` und `frontend/`. Alle `npm`-Befehle werden **im jeweiligen Ordner** ausgeführt, nicht im Hauptordner.

## 2. Backend einrichten

```bash
cd backend
npm install
```

Die Vorlage kopieren und ausfüllen:

```bash
cp .env.example .env
```

In der `.env` mindestens `POSTGRES_PASSWORD` (auch in `DATABASE_URL`) und `JWT_SECRET` setzen. Die Variablen:

| Variable | Beispiel | Beschreibung |
|----------|----------|--------------|
| `PORT` | `3000` | Port des Express-Servers |
| `POSTGRES_USER` | `flashcards` | Datenbank-Nutzer (für `docker-compose.yml`) |
| `POSTGRES_PASSWORD` | *zufälliger Wert* | Datenbank-Passwort |
| `POSTGRES_DB` | `flashcards` | Name der Datenbank |
| `POSTGRES_PORT` | `5432` | Port der Datenbank auf dem eigenen Rechner |
| `DATABASE_URL` | `postgresql://flashcards:<passwort>@localhost:5432/flashcards` | Verbindung des Servers zur Datenbank, muss zu den Werten oben passen |
| `FRONTEND_URL` | `http://localhost:5173` | Adresse des Frontends, für CORS. Ohne `/` am Ende |
| `JWT_SECRET` | *zufälliger Wert* | Schlüssel zum Signieren der Tokens, mindestens 32 Zeichen |
| `OPENROUTER_API_KEY` | *leer* | Optional: Key für die KI-Prüfung, siehe [KI-Anbindung](ai.md). Ohne Key ist die Prüfung aus |
| `OPENROUTER_MODEL` | `anthropic/claude-haiku-5.5` | Optional: Modell bei OpenRouter |

Zufällige Werte für Passwort und Secret erzeugen:

```bash
openssl rand -base64 48
```

Die `.env` steht in der `.gitignore` und wird **nie committet**.

Datenbank starten und Tabellen anlegen:

```bash
npm run db:start     # startet PostgreSQL im Docker-Container "flashcards-db"
npm run db:migrate   # legt die Tabellen aus backend/drizzle/ an
```

Die Migration ist nur beim ersten Start und nach Schema-Änderungen nötig. Die Daten liegen im Docker-Volume `db-data` und bleiben auch nach `npm run db:stop` erhalten.

Server starten:

```bash
npm run dev
```

Prüfen, ob alles läuft:

```bash
curl http://localhost:3000/api/health/db
# { "status": "ok", "database": "up" }
```

## 3. Frontend einrichten

In einem zweiten Terminal:

```bash
cd frontend
npm install
```

Die Vorlage kopieren, die Werte passen für die lokale Entwicklung:

```bash
cp .env.example .env
```


| Variable | Beispiel | Beschreibung |
|----------|----------|--------------|
| `VITE_API_URL` | `http://localhost:3000` | Adresse des Backends, **ohne** `/api` (die Pfade enthalten `/api` bereits) |

Frontend starten:

```bash
npm run dev
```

Die App läuft unter http://localhost:5173. Änderungen an der `.env` werden erst nach einem Neustart von `npm run dev` übernommen.

## npm-Skripte

### Backend (`backend/`)

| Skript | Beschreibung |
|--------|--------------|
| `npm run dev` | Datenbank starten, TypeScript kompilieren, Server starten |
| `npm run build` | TypeScript nach `dist/` kompilieren |
| `npm start` | kompilierten Server aus `dist/` starten |
| `npm test` | Tests im Watch-Modus, siehe [Tests](testing.md) |
| `npm run test:run` | Tests einmal ausführen |
| `npm run db:start` | Datenbank-Container starten |
| `npm run db:stop` | Datenbank-Container stoppen (Daten bleiben erhalten) |
| `npm run db:generate` | nach Änderungen an `schema.ts` neue Migration erzeugen |
| `npm run db:migrate` | Migrationen auf die Datenbank anwenden |
| `npm run db:push` | Schema direkt übertragen, ohne Migrationsdatei (nur zum Ausprobieren) |

### Frontend (`frontend/`)

| Skript | Beschreibung |
|--------|--------------|
| `npm run dev` | Entwicklungsserver mit automatischem Neuladen |
| `npm run build` | Typprüfung und Produktions-Build nach `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Tests im Watch-Modus, siehe [Tests](testing.md) |
| `npm run test:run` | Tests einmal ausführen |
| `npm run preview` | Produktions-Build lokal ansehen |

## Schema ändern

1. `backend/src/db/schema.ts` anpassen
2. `npm run db:generate` erzeugt eine neue SQL-Datei in `backend/drizzle/`
3. `npm run db:migrate` wendet sie an
4. Die neue Migrationsdatei mit committen

## Datenbank ansehen

```bash
docker exec -it flashcards-db psql -U <POSTGRES_USER> -d <POSTGRES_DB>
```

| Befehl | Wirkung |
|--------|---------|
| `\dt` | Tabellen anzeigen |
| `\d users` | Spalten einer Tabelle |
| `SELECT * FROM drizzle.__drizzle_migrations;` | angewendete Migrationen |
| `\q` | beenden |

## Häufige Fehler

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| `npm error enoent Could not read package.json` | Befehl im Hauptordner ausgeführt | in `backend/` bzw. `frontend/` wechseln |
| `500` bei jeder Anfrage, im Server-Log `relation "users" does not exist` | Migrationen fehlen | `npm run db:migrate` |
| `500` beim Lernen oder auf dem Dashboard, im Server-Log `relation "reviews" does not exist` | neue Migration nach `git pull` nicht angewendet | `npm run db:migrate` |
| `ECONNREFUSED` im Server-Log | Datenbank läuft nicht | `npm run db:start`, Docker muss laufen |
| `password authentication failed` | `DATABASE_URL` passt nicht zu `POSTGRES_*` | Werte in der `.env` abgleichen |
| Server startet nicht: `JWT_SECRET not set` | Secret fehlt oder ist kürzer als 32 Zeichen | `JWT_SECRET` in der `.env` setzen |
| CORS-Fehler in der Browser-Konsole | `FRONTEND_URL` stimmt nicht genau | exakt `http://localhost:5173`, ohne `/` am Ende |
| Alle Anfragen aus dem Frontend `404` | `VITE_API_URL` endet auf `/api` | `/api` entfernen, Frontend neu starten |

## Continuous Integration

Bei jedem Push und Pull Request auf `main` oder `develop` baut GitHub Actions Backend und Frontend, führt die Tests aus und prüft das Frontend mit ESLint ([ci.yml](../../.github/workflows/ci.yml)). Vor einem Push lassen sich dieselben Prüfungen lokal ausführen:

```bash
cd backend && npm ci && npm run build && npm run test:run
cd ../frontend && npm ci && npm run lint && npm run build && npm run test:run
```
