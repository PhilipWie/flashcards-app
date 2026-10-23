# Projektidee & Anforderungen

**HOME** [README](../README.md)

>## Projektidee
> #### Problem
> Um neue Themen zu erlernen oder sich auf Prüfungen vorzubereiten gibt es unterschiedliche Lernmehtoden.
> Mithilfe von Karteikarten lassen sich neue Inhalte einfach abfragen und testen.
> Nur leider liegen diese nicht immer griffbereit, dazu müssen diese selbst organisieret werden.
> Das bedeutet der Nutzer muss im Blick behalten welche Karteikarten er schon kann und welche nicht.
>
> #### Lösung
> Eine Lernkarten-App als Web-App mit eigenem Server
> - Nutzer können sich mit einem eigenen Konto anmelden um ihre spezifischen Karteikarten unter ihrem Konto gespeichert zu haben.
> - Nutzer können Ordner je nach Fach und Aufgabe anlegen.
> - Ein Lernmodus wo eine Karte angezeigt wird und der Nutzer angibt ob er es wusste oder nicht.
> - Ein System wodurch Karten die der Nutzer wusste seltener dran kommen als welche die er nicht wusste.
> - Der Fortschritt liegt in einer Datenbank auf dem Server und ist auf jedem Gerät verfügbar.
>

## Anforderungen nach MoSCoW
#### Must have
| Anforderung        | Beschreibung                                                                              |
|--------------------|-------------------------------------------------------------------------------------------|
| Registrieren       | Nutzer kann sich mit E-Mail und Passwort registrieren                                     | 
| Anmelden- Abmelden | Anmeldung mit E-Mail und Passwort.                                                        |
| Karten verwalten   | Karten können in Ordnern kategorisiert werden, Karten können erstellt und gelöscht werden |
| Lernmodus          | Karten anzeigen, umdrehen und mit gewusst oder nicht gewusst antworten                    |
| Server Speicherung | Karten , Ordner und Nutzerdaten werden auf dem Server gespeichert                         |

#### Should have
| Anforderung                  | Beschreibung                                                                              |
|------------------------------|-------------------------------------------------------------------------------------------|
| Lernsystem wie zB. (Leitner) | Karten die schwieriger sind werden öfter wiederholt einfache weniger. Logik auf dem server| 
| Filterung                    | Filtern nach "Nur nicht gelernte Karten lernen" und ähnliche (tbd)                        |
| Rudimentäre Lernstatistik    | Statistiken über die Lernhistorie                                                         |
| Dokumentation                | Aufbau und Technische Dokumentation wie zB. (API) im Repository                           |

#### Could have
| Anforderung                           | Beschreibung                                                                                                                                             |
|---------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| Karten mit KI erstellen               | Nutzer können zB. (md) Notizen hochladen und eine KI erstellt darauf basierend Karteikarten                                                              | 
| Automatische KI Bewertung beim Lernen | Ein Textfeld wird im Lernmodus angezeigt wo der Nutzer seine Antwort schreiben kann eine KI bewertet diese und beurteilt den Lernbedarf bei dieser Karte |

#### Won't have
| Anforderung                           | Beschreibung                                                             |
|---------------------------------------|--------------------------------------------------------------------------|
| Native Mobile-App                     | Eine eigene spezifische App für Andoid und oder Ios ist noch nicht geplant | 
| Automatische KI Bewertung beim Lernen | Bilder und Audio bei Karteikarten                                        |
| Interaktivität                        | Ein zusammenarbeiten (Lernen) ist nicht vorgesehen                   |
