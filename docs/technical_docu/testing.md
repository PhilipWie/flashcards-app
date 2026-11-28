# Tests

**HOME** [README](../../README.md) · [Technische Dokumentation](README.md)

Backend und Frontend werden mit [Vitest](https://vitest.dev) getestet. Die Tests laufen lokal und in der CI bei jedem Push und Pull Request.

## Ausführen

Im Ordner `backend/` oder `frontend/`:

```bash
npm test            # Watch-Modus: Tests laufen bei jeder Änderung neu
npm run test:run    # einmal durchlaufen (wie in der CI)
```

Einzelne Datei oder einzelner Test:

```bash
npx vitest run src/lib/leitner.test.ts
npx vitest run -t "moves a known card"
```

## Aufbau

Test-Dateien liegen direkt neben der getesteten Datei und heißen `name.test.ts` (bzw. `.test.tsx` für Komponenten). Vitest findet sie automatisch.

| Projekt | Konfiguration | Umgebung |
|---------|---------------|----------|
| Backend | [vitest.config.ts](../../backend/vitest.config.ts) | Node.js. `JWT_SECRET` und `DATABASE_URL` sind Platzhalter, die Datenbank wird nie erreicht |
| Frontend | `test`-Abschnitt in [vite.config.ts](../../frontend/vite.config.ts) | jsdom (simulierter Browser mit DOM und `localStorage`), Setup in [src/test/setup.ts](../../frontend/src/test/setup.ts), stellt die Sprache vor jedem Test auf Deutsch |

Die Test-Dateien im Backend sind vom `tsc`-Build ausgenommen und landen nicht in `dist/`.

## Was getestet wird

| Datei | Inhalt |
|-------|--------|
| `backend/src/lib/leitner.test.ts` | Leitner-Logik: Fach hoch, Fach 5 bleibt, "nicht gewusst" zurück in Fach 1 |
| `backend/src/lib/answerCheck.test.ts` | KI-Prüfung mit gefälschtem OpenRouter (`vi.stubGlobal("fetch")`): Anfrage, Tags maskieren, Modell-Antwort prüfen, Fehler, Timeout, kein Key in Fehlermeldungen |
| `backend/src/lib/cardChat.test.ts` | KI-Chat: Prüfung des Verlaufs (keine `system`-Nachricht, abwechselnde Rollen, Längen), maskierte Kartendaten, Formatierung entfernen, Anfrage mit gefälschtem `fetch` |
| `backend/src/lib/stats.test.ts` | Statistik: Lernserie (Lücken, heute/gestern), Trefferquote, Tage auffüllen, Zeitzone und Sommerzeit |
| `backend/src/app.test.ts` | Routen über HTTP mit [supertest](https://github.com/forwardemail/supertest): Health, `401` ohne oder mit ungültigem Token, `400` bei ungültigen Eingaben, `503` für die KI-Prüfung ohne Key, jeweils mit dem richtigen Fehler-`code`. Refresh-Routen: CSRF-Schutz (`Origin`, Header), `401` ohne Cookie, Cookie-Attribute beim Logout, CORS mit `credentials` |
| `backend/src/lib/refreshTokens.test.ts` | Refresh-Token ohne Datenbank: Zufall und Hash, Ablauf (Leerlauf und absolute Grenze), Entscheidung gültig / Kulanz / wiederverwendet / abgelaufen / widerrufen |
| `frontend/src/lib/*.test.ts` | Einstellungen (auch kaputte und manipulierte `localStorage`-Werte), Fächer filtern und zählen, Mischen, Datum |
| `frontend/src/api/client.test.ts` | `request()` mit gefälschtem `fetch`: Header, Body, `credentials`, `204`, Fehler als `ApiError` mit `code`. Automatischer Refresh bei `401`: einmal wiederholen, gemeinsamer Refresh bei parallelen Anfragen, kein Refresh wenn ein anderer Tab schon erneuert hat, keiner für Login und Registrierung |
| `frontend/src/i18n/i18n.test.tsx` | Mehrsprachigkeit: Sprache erkennen (gespeichert, Browser, Fallback Englisch), Fehlercodes übersetzen, Umschalten ändert Texte, `<html lang>` und `localStorage` |
| `frontend/src/features/learn/BoxFilter.test.tsx` | Komponente mit [Testing Library](https://testing-library.com): Schnellauswahl, Fach-Schalter, Start-Button |
| `frontend/src/features/stats/ActivityChart.test.tsx` | Diagramm: Text für Screenreader, heutiger Tag, Höhe der Balken |
| `frontend/src/pages/DashboardPage.test.tsx` | Dashboard mit gefälschter API (`vi.mock`): Hinweise für neue Nutzer ohne Antworten und Karten |
| `frontend/src/features/learn/CardChat.test.tsx` | Chat mit gefälschter API: Verlauf wird mitgeschickt, Frage zurück ins Feld bei `503`, Chat voll nach 5 Fragen |
| `frontend/src/features/learn/LearnSession.test.tsx` | Lernsitzung mit eingetippter Antwort: Enter dreht um, Antwort wird angezeigt, Feld ist bei der nächsten Karte leer und fokussiert. KI-Prüfung mit gefälschter API (`vi.mock`): Button- und Automatik-Modus, Hervorhebung, `partial`, Fallback bei `503`, Schalter in der Sitzung |

## Grenzen

- **Keine Tests gegen die Datenbank.** Die Backend-Tests nutzen nur Routen, die vor der ersten Datenbankabfrage antworten (Authentifizierung, Eingabeprüfung). Für mehr bräuchte es eine eigene Test-Datenbank.
- **`<dialog>` in jsdom:** jsdom kennt `showModal()` nicht. `Modal`, `ConfirmDialog` und `SettingsDialog` werden deshalb nicht automatisch getestet.
- **Kein echter Browser.** Browser-Kompatibilität (Chrome, Firefox, Safari) prüfen die Tests nicht, dafür wären End-to-End-Tests z. B. mit Playwright nötig.

## Neuen Test schreiben

1. Neben der Datei `name.test.ts` anlegen.
2. `describe`, `it` und `expect` aus `vitest` importieren.
3. Für Komponenten: `render` und `screen` aus `@testing-library/react`, Eingaben mit `userEvent`. Elemente möglichst über ihre Rolle und ihren Namen suchen (`getByRole("button", { name: "Speichern" })`), so wie ein Screenreader sie findet.
4. Zeit (`vi.useFakeTimers()`), Zufall (`vi.spyOn(Math, "random")`) und Netzwerk (`vi.stubGlobal("fetch", ...)`) im Test festlegen, damit das Ergebnis nicht vom Zeitpunkt oder Server abhängt.
