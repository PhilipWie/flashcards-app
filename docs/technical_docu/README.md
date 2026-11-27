# Technische Dokumentation

**HOME** [README](../../README.md)

## Inhalt

| Dokument | Inhalt |
|----------|--------|
| [Setup](setup.md) | Projekt lokal einrichten und starten, Umgebungsvariablen, npm-Skripte, häufige Fehler |
| [API](api.md) | Alle Endpunkte des Backends: Decks, Karten, Lernmodus, Health |
| [Authentication](authentication.md) | Registrierung (`POST /api/register`) mit Beispielen |
| [JWT](jwt.md) | Login, Token-Aufbau, geschützte Routen, Sicherheit |
| [KI-Anbindung](ai.md) | OpenRouter einrichten, Antwortprüfung, Datenschutz und Sicherheit |
| [Tests](testing.md) | Vitest in Backend und Frontend: ausführen, Aufbau, was getestet wird |
| [Datenmodell](../Datenmodell.md) | Tabellen und Beziehungen der PostgreSQL-Datenbank |

## Architektur im Überblick

```mermaid
flowchart LR
    subgraph Browser
        UI["React-Frontend<br/>(Vite, React Router)"]
        LS[("localStorage<br/>Token, Theme")]
    end

    subgraph Server["Backend (Node.js, Express 5)"]
        MW["Middleware<br/>CORS, JSON, Rate Limit, requireAuth"]
        R["Routen<br/>/api/..."]
    end

    DB[("PostgreSQL<br/>(Docker)")]

    UI -- "HTTP/JSON<br/>Authorization: Bearer token" --> MW
    MW --> R
    R -- "Drizzle ORM" --> DB
    UI <--> LS
```

| Teil | Technik | Ordner |
|------|---------|--------|
| Frontend | React 19, TypeScript, Vite, React Router, lucide-react | [frontend/](../../frontend) |
| Backend | Node.js, Express 5, TypeScript, jose (JWT), argon2, validator | [backend/](../../backend) |
| Datenbank | PostgreSQL 18 in Docker, Drizzle ORM für Schema und Migrationen | [backend/drizzle/](../../backend/drizzle) |
| CI | GitHub Actions: Build und Tests (Backend, Frontend) und ESLint (Frontend) bei Push und Pull Request auf `main` und `develop` | [.github/workflows/ci.yml](../../.github/workflows/ci.yml) |

### Aufbau des Frontends

```
frontend/src/
├── api/          Kommunikation mit dem Backend
│   ├── client.ts     zentraler API-Client (fetch-Wrapper): Basis-URL, Token, Fehler
│   └── auth.ts, decks.ts, cards.ts, review.ts, stats.ts   eine Funktion pro Endpunkt
├── components/   Layout (Kopfzeile), ProtectedRoute, GuestRoute, Modal, ConfirmDialog, SettingsDialog
├── features/     Bausteine einzelner Seiten
│   ├── decks/        DeckItem (Zeile der Deck-Liste)
│   ├── cards/        CardForm, CardItem, BoxBar (Verteilung auf die Fächer)
│   ├── learn/        Flashcard (Karteikarte), LearnSession (Ablauf einer Runde), AnswerInput (Antwort eintippen), BoxFilter (Auswahl beim freien Üben)
│   └── stats/        ActivityChart (Antworten pro Tag, ohne Chart-Bibliothek)
├── hooks/        useTheme (Hell/Dunkel), useApiError (Fehlermeldung, bei 401 abmelden), useSettings
├── lib/          Hilfsfunktionen ohne React: date.ts, leitner.ts, shuffle.ts, settings.ts (Einstellungen im localStorage)
├── pages/        eine Datei pro Seite (Login, Register, Decks, DeckDetail, Learn, Practice, Dashboard)
├── styles/       tokens.css (Design-Variablen), base.css (Bausteine)
├── test/         setup.ts für Vitest (Tests selbst liegen als *.test.ts neben den Dateien)
└── types/        Typen für Deck, Card und Stats
```

### Aufbau des Backends

```
backend/src/
├── index.ts      startet den Server
├── app.ts        Express-App: Middleware und Routen
├── jwt.ts        Token erstellen und prüfen
├── db/           Verbindung (db.ts) und Schema (schema.ts)
├── lib/          Fachlogik ohne HTTP: leitner.ts, stats.ts (Statistik), ai.ts (OpenRouter-Client), answerCheck.ts (KI-Prüfung)
├── middleware/   auth.ts (requireAuth), rateLimit.ts
└── routes/       ein Router pro Bereich (register, login, decks, cards, review, check, stats, health)
```
