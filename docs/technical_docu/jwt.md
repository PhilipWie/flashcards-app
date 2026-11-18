# JWT (JSON Web Token)

**HOME** [README](../../README.md) · [Authentication](authentication.md)

Nach dem Login bekommt der Client ein JWT. Damit weist er sich bei jeder weiteren Anfrage aus, ohne dass der Server Sessions speichern muss.
Umgesetzt mit der Library [jose](https://github.com/panva/jose).

- Token erstellen und prüfen: [jwt.ts](../../backend/src/jwt.ts)
- Token ausstellen: [login.ts](../../backend/src/routes/login.ts)
- Token bei geschützten Routen prüfen: [auth.ts](../../backend/src/middleware/auth.ts)

## Was ist ein JWT?

Ein JWT besteht aus drei Teilen, getrennt durch Punkte: `header.payload.signature`

| Teil        | Inhalt                                                         |
|-------------|----------------------------------------------------------------|
| `header`    | Signatur-Algorithmus (bei uns `HS256`)                         |
| `payload`   | Daten (Claims): `sub` (User-ID), `iat` (erstellt), `exp` (Ablauf) |
| `signature` | Signatur über Header und Payload, erzeugt mit dem `JWT_SECRET` |

Wichtig:
- Header und Payload sind nur Base64-kodiert, **nicht verschlüsselt**. Jeder mit dem Token kann sie lesen. Deshalb stehen dort keine sensiblen Daten, nur die User-ID.
- Die Signatur schützt vor **Manipulation**. Ohne das Secret kann niemand ein gültiges Token erzeugen oder ein vorhandenes ändern.
- Wer das Token besitzt, gilt als der Nutzer (Bearer-Token). Das Token muss deshalb geschützt werden (siehe [Sicherheit](#sicherheit)).

## Ablauf

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Datenbank

    C->>S: POST /api/login (email, password)
    S->>DB: Nutzer anhand der E-Mail suchen
    DB-->>S: password_hash, user_id
    S->>S: Passwort mit argon2 prüfen
    S->>S: JWT signieren (sub = user_id, 30 min gültig)
    S-->>C: 200 { message, token }

    Note over C: Client speichert das Token

    C->>S: Anfrage mit Header Authorization: Bearer token
    S->>S: Middleware: Signatur und Ablauf prüfen
    alt Token gültig
        S->>S: req.userId = sub
        S-->>C: 200 Antwort der Route
    else Token fehlt, ungültig oder abgelaufen
        S-->>C: 401 unauthorized
    end
```

### 1. Login und Token ausstellen
`POST /api/login` prüft E-Mail und Passwort (argon2). Bei Erfolg wird mit `signToken(userId)` ein Token erzeugt und im Feld `token` der Antwort zurückgegeben.

Eigenschaften des Tokens:

| Claim | Wert                        |
|-------|-----------------------------|
| `sub` | User-ID als String          |
| `iat` | Zeitpunkt der Ausstellung   |
| `exp` | Ausstellung + 30 Minuten    |

Die Laufzeit steht in der Konstante `TOKEN_LIFETIME` in `jwt.ts`.

### 2. Token mitschicken
Der Client schickt das Token bei jeder Anfrage an eine geschützte Route im Header:

```
Authorization: Bearer <token>
```

### 3. Token prüfen
Die Middleware `requireAuth` übernimmt die Prüfung:
1. Header lesen, er muss mit `Bearer ` beginnen.
2. `verifyToken` prüft Signatur und Ablaufzeit. Der Algorithmus ist fest auf `HS256` gesetzt.
3. Bei Erfolg wird `req.userId` gesetzt, die Route kann damit arbeiten.
4. Bei jedem Fehler antwortet der Server mit `401 unauthorized`.

Die User-ID kommt immer aus dem Token (`req.userId`), nie aus dem Request-Body. So kann ein Nutzer nicht die Daten eines anderen anfordern.

## Beispiel (curl)

Login:

```bash
curl -i -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "geheim123"}'
```

Antwort (Status 200):

```json
{ "message": "User logged in", "token": "eyJhbGciOiJIUzI1NiJ9..." }
```

Token bei einer geschützten Route verwenden (sobald eine Route `requireAuth` nutzt):

```bash
curl -i http://localhost:3000/api/<geschuetzte-route> \
  -H "Authorization: Bearer <token>"
```

## Konfiguration

| Variable     | Beschreibung                                                                 |
|--------------|------------------------------------------------------------------------------|
| `JWT_SECRET` | Geheimer Schlüssel zum Signieren, mindestens 32 Zeichen. Steht in der `.env`, nicht im Git. |

Einen zufälligen Wert erzeugen:

```bash
openssl rand -base64 48
```

Fehlt das Secret oder ist es zu kurz, bricht der Server beim Start ab.

## Sicherheit

| Maßnahme                | Wirkung                                                                    |
|-------------------------|----------------------------------------------------------------------------|
| Signatur (`HS256`)      | Manipulierte Tokens werden abgelehnt                                       |
| Algorithmus fest gesetzt | Schutz vor Angriffen mit gefälschtem Algorithmus (z. B. `alg: none`)      |
| Kurze Laufzeit (30 min) | Ein gestohlenes Token ist nur begrenzt nutzbar                             |
| Secret nur in `.env`    | Das Secret liegt nicht im Code oder Repository                             |
| HTTPS (Produktion)      | Das Token kann unterwegs nicht mitgelesen werden                           |

### Bekannte Einschränkungen
- Das Token wird im JSON-Body ausgeliefert und vom Client selbst gespeichert, z. B. im `localStorage`. Dort kann es bei einer XSS-Lücke ausgelesen werden. Sicherer wäre ein `httpOnly`-Cookie. Für dieses Uni-Projekt wurde bewusst die einfachere Variante gewählt.
- Ein ausgestelltes Token kann serverseitig nicht widerrufen werden. Es ist gültig, bis es abläuft. Ein Logout besteht deshalb nur darin, dass der Client das Token löscht.
- Es gibt keine Refresh-Tokens. Nach 30 Minuten muss sich der Nutzer neu anmelden.
