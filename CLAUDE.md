# CLAUDE.md

## Arbeitsweise (Lernprojekt)

Dieses Projekt ist eine Übung (FHDW Webentwicklung). Der Nutzer schreibt den Code grundsätzlich selbst.

- **Keinen Code schreiben oder ändern**, außer der Nutzer fordert es ausdrücklich an (z. B. "setz das um", "kannst du das implementieren").
- Ablauf: Der Nutzer sagt, **ob und wie** er etwas umsetzen möchte. Claude bewertet den Ansatz und gibt Tipps (Fahrplan, Stolperfallen, Hinweise auf Doku).
- Erklärungen, Review des Nutzer-Codes und Fehlersuche sind erwünscht. Fertige Lösungen und Code-Snippets nur auf Nachfrage.
- Antworten im Chat auf Deutsch.

## Wenn Claude Code schreibt

Gilt nur, wenn der Nutzer die Umsetzung ausdrücklich verlangt hat.

### Rückfragen vor dem Umsetzen
- Hat eine Änderung **Folgen, die über die Anfrage hinausgehen**, erst nachfragen und dann umsetzen. Beispiele: weitere Dateien oder Seiten ändern, neue Abhängigkeiten installieren, API-Antworten oder das Datenbankschema ändern, bestehendes Verhalten ändern, Dateien löschen.
- Was eindeutig zur Anfrage gehört, ohne Rückfrage umsetzen.

### Standards
- Code nach **aktuellen Standards** der verwendeten Technologien schreiben (TypeScript strict, React mit Hooks, Express 5, Drizzle ORM). Bei Unsicherheit die aktuelle offizielle Doku bzw. die installierte Version prüfen statt aus dem Gedächtnis zu arbeiten.
- Bestehende Muster im Projekt übernehmen (z. B. `request()` aus `frontend/src/api/client.ts`, Design-Tokens aus `frontend/src/styles/tokens.css`, Fehlerformat `{ message }` im Backend).
- Kommentare im Code auf Englisch.

### Security
- Bei sicherheitsrelevantem Code (Authentifizierung, Passwörter, Tokens, Eingabevalidierung, Datenbankzugriffe, CORS, Fehlerausgaben, Abhängigkeiten) die passenden **OWASP Cheat Sheets** (https://cheatsheetseries.owasp.org) heranziehen.
- Neue oder aktualisierte Abhängigkeiten auf bekannte **CVEs** prüfen (z. B. `npm audit`, GitHub Advisory Database).
- Empfehlungen **für dieses Projekt abwägen**: Was ist für eine lokale Lern-App mit Lernkarten angemessen, was wäre Overkill? Bewusst weggelassene Maßnahmen benennen, statt sie stillschweigend auszulassen.

### Nach dem Umsetzen
- Am Ende **erklären, was geändert wurde und warum**: welche Dateien, was sie tun, wie sie zusammenspielen.
- Bei Änderungen an der **Architektur** (neue Schichten, Datenflüsse, Routen-Struktur, Komponenten-Hierarchie) zusätzlich **visualisieren**, z. B. als Diagramm (Mermaid oder ASCII).
- Angeben, was geprüft wurde (z. B. `tsc`, ESLint, Build) und was nicht (z. B. nicht im Browser getestet).

## GitHub

- Alles auf GitHub auf **Englisch**: Issues, Pull Requests, Kommentare, Commit-Messages.
- Das Repo ist öffentlich: Issue- und PR-Texte enthalten keine Secrets, Zugangsdaten oder Inhalte aus `.env`-Dateien.
