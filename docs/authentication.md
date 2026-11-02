# Authentication

**HOME** [README](../README.md)

## Registrierung

`POST /api/register`

Legt einen neuen Nutzer an. Die E-Mail wird getrimmt und in Kleinbuchstaben gespeichert, das Passwort wird mit argon2 gehasht.

### Request

| Feld       | Typ    | Regeln                                      |
|------------|--------|---------------------------------------------|
| `email`    | string | gültiges E-Mail-Format, 6 bis 254 Zeichen   |
| `password` | string | 6 bis 500 Zeichen (wird nicht getrimmt)     |

### Beispiel (curl)

```bash
curl -i -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "geheim123"}'
```

`-i` zeigt zusätzlich den Statuscode und die Header an.

### Antworten

| Status | Bedeutung                                   |
|--------|---------------------------------------------|
| 201    | Nutzer wurde angelegt                       |
| 400    | Validierungsfehler (`message` nennt Grund)  |
| 409    | E-Mail ist bereits registriert              |
| 429    | Rate Limit überschritten (90 Anfragen/Min.) |
| 500    | Interner Serverfehler                       |

Fehlerantworten haben die Form:

```json
{ "message": "email is not in a correct format" }
```

### Fehlerfälle testen

Ungültiges E-Mail-Format (erwartet 400):

```bash
curl -i -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email": "keine-email", "password": "geheim123"}'
```

Passwort zu kurz (erwartet 400):

```bash
curl -i -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123"}'
```

Falscher Datentyp (erwartet 400):

```bash
curl -i -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email": 123, "password": "geheim123"}'
```

Doppelte E-Mail, in anderer Schreibweise (erwartet 409, den ersten Beispiel-Request vorher ausführen):

```bash
curl -i -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email": "  TEST@Example.com ", "password": "geheim123"}'
```
