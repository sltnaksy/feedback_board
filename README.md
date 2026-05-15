````markdown
# Feedback Board_C1 Auftrag

Eine moderne Multi-Service-Anwendung mit Frontend, Backend-API und PostgreSQL.  
Feedbacks werden über die API verarbeitet und persistent gespeichert.

---

## Vorschau

![Feedback Board](./docs/screenshot.png)

---

#  Multi-Service-Architektur mit Docker Compose

## 1. Was wurde umgesetzt?

Dieses Projekt ist eine kleine Feedback-Board-Anwendung. Benutzerinnen und Benutzer können im Browser Feedback mit Name, Kategorie, Bewertung und Nachricht erfassen. Das Frontend sendet die Daten an eine Backend-API. Das Backend validiert die Eingaben und speichert sie in einer PostgreSQL-Datenbank. Bereits gespeicherte Feedbacks werden wieder aus der Datenbank gelesen und im Frontend angezeigt.

Die Lösung wurde bewusst überschaubar gehalten, damit die Architektur nachvollziehbar bleibt. Trotzdem erfüllt sie die zentralen Anforderungen des Auftrags: mehrere Services, echte Kommunikation zwischen den Services, persistente Daten, Healthchecks, Restart-Policies, strukturierte Logs und getrennte Docker-Netzwerke.

---

## 2. Architektur

```text
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │ HTTP
       ▼
┌──────────────┐
│ Frontend     │
│ Nginx        │
└──────┬───────┘
       │ /api/*
       ▼
┌──────────────┐
│ Backend API  │
│ Node.js      │
└──────┬───────┘
       │ SQL
       ▼
┌──────────────┐
│ PostgreSQL   │
└──────┬───────┘
       ▼
 Named Volume
````

---

## 3. Komponenten

### Frontend

Das Frontend besteht aus einer statischen HTML-Seite, die über Nginx ausgeliefert wird. Es handelt sich jedoch nicht um ein rein statisches Frontend. Die Anwendung kommuniziert aktiv mit dem Backend über die Endpunkte:

* `/api/feedback`
* `/api/stats`

Das Frontend lädt vorhandene Feedbacks dynamisch nach und kann neue Einträge speichern.

### Backend

Das Backend basiert auf Node.js und Express. Die API verarbeitet Requests, validiert Eingaben und kommuniziert mit der PostgreSQL-Datenbank.

Folgende Endpunkte werden bereitgestellt:

| Methode | Endpoint        | Zweck                                         |
| ------- | --------------- | --------------------------------------------- |
| GET     | `/health`       | Prüft Backend und Datenbankverbindung         |
| GET     | `/api/feedback` | Gibt alle Feedbacks zurück                    |
| POST    | `/api/feedback` | Speichert neues Feedback                      |
| GET     | `/api/stats`    | Gibt Anzahl und Durchschnittsbewertung zurück |

Das Backend schreibt strukturierte JSON-Logs nach stdout. Die Logs enthalten Zeitstempel, Log-Level, Service und Ereignis.

### Datenbank

Die Daten werden persistent in PostgreSQL gespeichert.

Verwendetes Named Volume:

```yaml
volumes:
  feedback_database_data:
```

Dadurch bleiben die Daten auch nach einem Neustart der Container erhalten.

---

## 4. Setup-Anleitung

### Voraussetzungen

* Docker
* Docker Compose
* Git

---

### Projekt starten

Linux / macOS:

```bash
cp .env.example .env
docker compose up --build
```

Windows PowerShell:

```powershell
copy .env.example .env
docker compose up --build
```

Danach ist die Anwendung erreichbar unter:

```text
http://localhost:8080
```

Backend-Healthcheck:

```text
http://localhost:3000/health
```

---

### Logs anzeigen

```bash
docker compose logs -f
```

Nur Backend-Logs:

```bash
docker compose logs -f backend
```

---

### Projekt stoppen

```bash
docker compose down
```

---

### Projekt inklusive Datenbankdaten löschen

```bash
docker compose down -v
```

---

## 5. Wichtige Konfiguration

Die Konfiguration erfolgt über Environment-Variablen.

Die Datei `.env.example` ist im Repository enthalten.
Die echte `.env`-Datei wird nicht versioniert und ist in `.gitignore` eingetragen.

Beispiel:

```env
POSTGRES_DB=feedbackdb
POSTGRES_USER=feedbackuser
POSTGRES_PASSWORD=example_password

BACKEND_PORT=3000
FRONTEND_PORT=8080
NODE_ENV=production
```

---

## 6. Architektur- und Docker-Entscheidungen

### Healthcheck und depends_on

Die Datenbank besitzt einen Healthcheck mit `pg_isready`.

Das Backend startet erst, wenn die Datenbank wirklich erreichbar ist:

```yaml
depends_on:
  database:
    condition: service_healthy
```

Das Frontend wartet wiederum auf ein gesundes Backend. Dadurch startet die Anwendung stabiler und reproduzierbarer.

---

### Netzwerke

Es werden zwei eigene Docker-Netzwerke verwendet:

```yaml
networks:
  frontend-network:
  backend-network:
```

Die Datenbank ist nur im Backend-Netzwerk erreichbar. Das Frontend kommuniziert nicht direkt mit der Datenbank. Dadurch bleibt die Architektur sauber getrennt.

---

### Restart-Policies

Alle Services verwenden:

```yaml
restart: unless-stopped
```

Wenn ein Service abstürzt, versucht Docker ihn automatisch neu zu starten. Sobald ein ausgefallener Service wieder verfügbar ist, funktioniert die Anwendung automatisch weiter.

---

## 7. Multi-Stage-Build

Das Backend verwendet einen Multi-Stage-Dockerfile.

Im ersten Schritt werden die Dependencies installiert, im zweiten Schritt wird nur die Runtime-Umgebung gebaut:

```dockerfile
FROM node:20-alpine AS dependencies
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

CMD ["npm", "start"]
```

Dadurch bleibt das finale Image kleiner und enthält nur die tatsächlich benötigten Dateien.

---

## 8. Strukturierte Logs

Das Backend schreibt Logs als JSON nach stdout.

Beispiel:

```json
{
  "timestamp": "2026-05-02T10:00:00.000Z",
  "level": "INFO",
  "service": "backend",
  "message": "Feedback created",
  "feedbackId": 1
}
```

Die Logs können mit folgendem Befehl angezeigt werden:

```bash
docker compose logs -f backend
```

---

## 9. KI-Deklaration

Zur Unterstützung wurden KI-Tools für einzelne technische Fragen, Formulierungen und kleinere Optimierungen verwendet.

Die finale Umsetzung, Konfiguration und Integration der Services wurden eigenständig angepasst, getestet und nachvollzogen. Der verwendete Code kann erklärt werden.


---

## 10. Reflexion

Im Projekt wurde deutlich, dass bei Docker Compose nicht nur einzelne Container wichtig sind, sondern vor allem das Zusammenspiel der Services.

Besonders wichtig waren:

* Healthchecks
* `depends_on`
* persistente Volumes
* getrennte Netzwerke
* strukturierte Logs
* Restart-Policies

Rückblickend könnte die Anwendung später noch erweitert werden, beispielsweise mit:

* Login-System
* automatisierten Tests
* CI/CD-Pipeline
* Container Registry
* Cloud-Deployment

Für diesen Auftrag wurde die Lösung jedoch bewusst kleiner gehalten, damit die technische Architektur klar verständlich bleibt und alle Anforderungen sauber umgesetzt werden.

```
```
README’ye aşağıdaki bölümü ekle. Bunu mevcut README’nin altına koyabilirsin.

# C2 · CI/CD mit GitHub Actions

## Ziel

Für C2 wurde eine automatische CI/CD-Pipeline mit GitHub Actions umgesetzt.
Bei jedem Push auf den Hauptbranch wird der Backend-Service automatisch getestet, als Docker-Image gebaut und in die GitHub Container Registry veröffentlicht.

Die bestehende Anwendung aus C1 wurde als Basis verwendet.

---

## Workflow-Übersicht

Die Pipeline besteht aus drei Stages:

```text
┌────────────┐
│ Git Push   │
└─────┬──────┘
      ↓
┌────────────┐
│ Test Stage │
│ npm test   │
│ npm lint   │
└─────┬──────┘
      ↓
┌────────────┐
│ Build      │
│ Docker     │
└─────┬──────┘
      ↓
┌────────────┐
│ Push GHCR  │
│ latest/SHA │
└────────────┘
```

Die Workflow-Datei befindet sich unter:

```text
.github/workflows/ci-cd.yml
```

---

## Verwendete Technologien

* GitHub Actions
* Docker Buildx
* GitHub Container Registry (GHCR)
* Node.js Test Runner
* Docker Layer Caching

---

## Test Stage

Im ersten Schritt wird der Backend-Code automatisch geprüft.

Folgende Befehle werden ausgeführt:

```bash
npm ci
npm test
npm run lint
```

Wenn Tests oder Linting fehlschlagen, wird die Pipeline sofort abgebrochen.

---

## Build Stage

Nach erfolgreichen Tests wird automatisch ein Docker-Image des Backend-Services gebaut.

Verwendet wird dabei der bestehende Multi-Stage-Dockerfile aus C1.

---

## Push Stage

Das fertige Image wird automatisch in die GitHub Container Registry veröffentlicht.

Repository:

```text
ghcr.io/sltnaksy/feedback_board-backend
```

---

## Tagging-Strategie

Die Images erhalten zwei Tags:

| Tag     | Zweck                          |
| ------- | ------------------------------ |
| latest  | aktuelle Version               |
| Git-SHA | eindeutige Nachvollziehbarkeit |

Beispiel:

```text
ghcr.io/sltnaksy/feedback_board-backend:latest
ghcr.io/sltnaksy/feedback_board-backend:a5cba6f
```

---

## Secrets und Sicherheit

Es werden keine Zugangsdaten im Repository gespeichert.

Die Pipeline verwendet den GitHub Actions Token:

```text
secrets.GITHUB_TOKEN
```

Die Authentifizierung zur Registry erfolgt zur Laufzeit automatisch.

---

## Caching

Die Pipeline verwendet Docker-Layer-Caching sowie npm-Caching.

Dadurch laufen wiederholte Builds ohne grosse Änderungen deutlich schneller.

---

## Trigger

Die Pipeline startet automatisch bei:

```yaml
push:
  branches:
    - main
```

Zusätzlich wurde `workflow_dispatch` aktiviert, damit der Workflow auch manuell gestartet werden kann.

---

## Reflexion

Durch C2 wurde deutlich, wie wichtig automatisierte Pipelines für reproduzierbare Builds sind.
Besonders hilfreich waren automatisierte Tests, Docker Buildx, Tagging-Strategien und das Arbeiten mit Container Registries.

Rückblickend könnte die Pipeline später noch um automatische Deployments oder Security-Scans erweitert werden.

---

## KI-Deklaration

Zur Unterstützung wurden KI-Tools für technische Fragen, Workflow-Strukturierung und Formulierungen verwendet.

Die finale Pipeline wurde eigenständig integriert, getestet und nachvollzogen.

