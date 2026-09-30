# Basket Stats - Analytics API

The Analytics API is a Node.js microservice responsible for processing basketball match statistics and providing analytical data to the Basket Stats platform.

It receives match statistics files, extracts and processes player and team data, stores the resulting statistics, and exposes endpoints used by the frontend for rankings, player summaries, game statistics, and other analytical features.

The service works together with the Management API to obtain game information and update game results after statistics have been successfully processed.

---

## Responsibilities

The Analytics API is responsible for:

- Uploading and managing match statistics files.
- Extracting statistics from match PDF files.
- Validating uploaded statistics against the selected game.
- Processing player statistics.
- Calculating team statistics from player data.
- Storing player and team statistics.
- Providing game statistics and player rankings.
- Providing aggregated player rankings and player summaries.
- Updating game results through the Management API after successful processing.
- Removing statistical data when related games, teams, or players are deleted.

---

## Architecture

The Analytics API is part of a microservices architecture composed of three main application components.

```text
                         Basket Stats
                              │
                              ▼
                    ┌──────────────────┐
                    │     Frontend     │
                    │ React + TypeScript│
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌───────────────────┐         ┌───────────────────┐
    │   Management API  │◄────────│   Analytics API   │
    │    Port 3000      │         │    Port 3001      │
    └─────────┬─────────┘         └─────────┬─────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Supabase         │
                    │ PostgreSQL       │
                    └──────────────────┘
```

## Production Deployment

The backends are currently deployed on an Oracle Cloud VPS using Docker Compose.

The Analytics API runs in the analytics-api Docker container and is exposed on port 3001.

The Management API runs in the management-api container on port 3000.

Both services use Supabase PostgreSQL as their database. The Analytics API communicates with the Management API internally through the Docker Compose network using:

```http 
http://management-api:3000
```

The VPS also contains a PostgreSQL Docker container for the project environment, although the current Analytics API configuration uses Supabase PostgreSQL instead.

---

## Main Features

### Statistics Upload

The API accepts match statistics files through the upload endpoint.

Uploaded files are stored locally and registered in the `uploads` table together with their processing status.

### PDF Processing

The service extracts text from uploaded PDF files using `pdf-parse`.

The extracted data is processed to obtain:

- Player names
- Player numbers
- Minutes played
- Starter status
- Points
- Rebounds
- Assists
- Turnovers
- Steals
- Blocks

### Game Validation

Before processing a statistics file, the service retrieves the selected game from the Management API and validates the team names contained in the uploaded document.

This helps prevent statistics from being associated with the wrong game.

### Player Statistics

Processed player statistics are stored in the `player_stats` table and can be retrieved through game-specific and player-specific endpoints.

### Team Statistics

Team statistics are calculated from the processed player statistics and stored in the `team_stats` table.

### Rankings and Aggregated Statistics

The API provides endpoints for:

- Player rankings
- Aggregated player rankings
- Player statistical summaries
- Game player statistics
- Game team statistics

### Game Result Update

After successful statistics processing, the Analytics API calculates the game result and sends it to the Management API.

The Management API is called using a short-lived service JWT with the `service` role.

---

## API Endpoints

### Health

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Checks whether the service is running |

### Uploads

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/uploads` | Returns uploaded statistics files |
| `GET` | `/uploads/:id` | Returns a specific upload |
| `POST` | `/uploads` | Uploads a statistics file |

### Game Statistics

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/games/:id/players` | Returns player statistics for a game |
| `GET` | `/games/:id/teams` | Returns team statistics for a game |
| `DELETE` | `/games/:id/stats` | Deletes all statistics associated with a game |

### Player Statistics

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/players/rankings` | Returns player rankings |
| `GET` | `/players/aggregated-rankings` | Returns aggregated player rankings |
| `GET` | `/players/:playerName/summary` | Returns a player's statistical summary |

### Processing

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/process` | Processes an uploaded statistics file |

### Chat

The repository also contains an experimental document-processing and AI/RAG implementation through the `/chat` endpoint.

This functionality is not considered part of the completed MVP functionality and is currently kept as a separate capability under development.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/chat` | Processes an uploaded document and generates an AI-based response |

---

## Authentication and Authorisation

Protected endpoints require a JWT Bearer token.

The API uses role-based authorisation.

Supported roles include:

- `admin`
- `coach`
- `dt`
- `service`

The following operations require authentication:

| Operation | Allowed Roles |
| --- | --- |
| Upload statistics | `admin`, `coach`, `dt` |
| Process statistics | `admin`, `coach`, `dt` |
| Delete game statistics | `admin`, `service` |
| AI/RAG chat | `admin`, `coach`, `dt` |

Public endpoints, such as game statistics and rankings, do not require authentication.

---

## Statistics Processing Flow

The main statistics processing workflow is:

```text
1. Upload PDF
       │
       ▼
2. Store upload metadata
       │
       ▼
3. Process uploaded file
       │
       ▼
4. Retrieve game details
   from Management API
       │
       ▼
5. Extract PDF text
       │
       ▼
6. Validate team names
       │
       ▼
7. Parse player statistics
       │
       ▼
8. Calculate team statistics
       │
       ▼
9. Store statistics
       │
       ▼
10. Calculate game result
       │
       ▼
11. Update game through
    Management API
       │
       ▼
12. Mark upload as processed
```

The service also prevents an already processed upload from being processed again.

---

## Database

The Analytics API uses PostgreSQL.

The current production configuration connects to a Supabase PostgreSQL database through the Supabase connection pooler.

The main tables are:

`uploads`

Stores information about uploaded statistics files and their processing status.

`player_stats`

Stores individual player statistics for each game.

Main data includes:

- Game
- Team
- Player number
- Player name
- Minutes
- Starter status
- Points
- Rebounds
- Assists
- Turnovers
- Steals
- Blocks

`team_stats`

Stores aggregated team statistics for each game.

Main data includes:

- Game
- Team
- Points
- Rebounds
- Assists
- Turnovers
- Steals
- Blocks

---

## Technologies

- Node.js
- Express
- TypeScript
- PostgreSQL
- Supabase
- JWT
- Multer
- pdf-parse
- CSV Parser
- ExcelJS
- Docker
- Docker Compose

The repository also contains components for AI and document processing using:

- Google Gemini
- LangChain
- Recursive Character Text Splitter

These components are currently considered experimental/development functionality rather than part of the completed MVP.

---

## Environment Variables

The Analytics API requires the following environment variables:

```dotenv
PORT=3001

DB_HOST=your_database_host
DB_PORT=6543
DB_NAME=postgres
DB_USER=your_database_user
DB_PASSWORD=your_database_password
JWT_SECRET=your_jwt_secret
MANAGEMENT_API_URL=http://management-api:3000
GEMINI_API_KEY=your_gemini_api_key
```

The production environment uses the Docker Compose service name to communicate with the Management API internally.

Sensitive values must not be committed to the repository.

---

## Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd basket-stats-analytics-api-node
npm install
```

Create a .env file with the required environment variables.

### Development

Start the development server:

```bash
npm run dev
```

### Build

Compile the TypeScript project:

```bash
npm run build
```

### Production

Run the compiled application:

```bash
npm start
```

### Database Connection Test

The repository also provides a database connection test:

```bash
npm run db:test
```

---

## Docker

The Analytics API includes a Dockerfile and can be built as part of the Basket Stats Docker Compose environment.

In the current production environment, the service runs as:

```bash
analytics-api
Port: 3001
```

The Management API and Analytics API run as separate Docker containers and communicate through the Docker Compose network.

---

## Deployment

The Analytics API is currently deployed on an Oracle Cloud VPS.

The production environment uses Docker Compose with the following application services:

```text
analytics-api     → port 3001
management-api    → port 3000
basket-stats-db   → port 5432
```

The Analytics API communicates with the Management API internally through:

```http
http://management-api:3000
```

The Analytics API uses Supabase PostgreSQL as its production database.

The health endpoint can be used to verify the service status:

```http
GET /health
```

A successful response is:

```json
{
  "status": "ok",
  "service": "basket-stats-analytics-api-node"
}
```

---

## Related Services

Basket Stats consists of three independent repositories:

| Repository | Responsibility |
| --- | --- |
| Frontend | User interface and interaction |
| Management API | Authentication and application data management |
| Analytics API | Statistics processing and analytics |

The Analytics API works together with the Management API to retrieve game information, update game results, and keep management and statistical data consistent.

---

## Author

Edgar Montenegro