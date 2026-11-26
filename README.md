# Basket Stats - Analytics API

Backend microservice responsible for processing basketball match box-score PDFs, computing player and team statistics, serving rankings and analytical summaries, and proxying AI requests for **Swish** within the **Basket Stats** platform.

Built with **Node.js**, **Express 5**, and **TypeScript**, using **PostgreSQL (Supabase)** as its database and integrating directly with `management-api-node` and **OpenRouter**.

---

## Responsibilities

- Uploading and managing match statistics files (`PDF`).
- Extracting, validating, and parsing box-score statistics in a two-step ETL workflow (`POST /uploads` + `POST /process`).
- Validating uploaded box-scores against the selected game metadata from the Management API.
- Persisting individual player box-scores (`player_stats`) and calculating aggregated team statistics (`team_stats`).
- Serving game statistics, player rankings, aggregated season rankings, and player statistical summaries.
- Updating completed game results in the Management API using a short-lived `service` JWT.
- Cleaning up statistical records when games, teams, or players are deleted.
- Providing an AI gateway proxy (`POST /ai/chat`) to **OpenRouter** (`meta-llama/llama-3.3-70b-instruct:free`) for the **Swish** assistant.

---

## Architecture

```text
                       Basket Stats Platform
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │        Frontend         │
                    │  React 19 + TypeScript  │
                    │   (Includes Swish AI)   │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │ /management                     │ /analytics
                ▼                                 ▼
     ┌─────────────────────┐           ┌─────────────────────┐
     │   Management API    │◄──────────│    Analytics API    │
     │     Port 3000       │  Internal │      Port 3001      │
     └──────────┬──────────┘  Network  └──────────┬──────────┘
                │                                 │
                └────────────────┬────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Supabase PostgreSQL   │
                    │  (Connection Pooler)    │
                    └─────────────────────────┘
```

---

## Main Features

### Two-Step PDF Box-Score ETL
1. **Upload (`POST /uploads`):** Receives a match box-score PDF via `multer`, stores the file, and registers upload metadata in the `uploads` table with a pending status.
2. **Process (`POST /process`):**
    - Retrieves target game details from `management-api-node` (`http://management-api:3000`).
    - Extracts raw text using `pdf-parse` and validates participating team names to prevent mismatched uploads.
    - Parses player stats (name, jersey number, minutes, starter status, points, rebounds, assists, turnovers, steals, blocks).
    - Aggregates team totals (`team_stats`), persists player rows (`player_stats`), calculates the final score, updates the game via `PATCH /games/:id/result` using a short-lived `service` JWT, and marks the upload as processed (preventing duplicate processing).

### Rankings & Statistical Summaries
- Per-game player and team box-scores (`GET /games/:id/players`, `GET /games/:id/teams`).
- Game-by-game and season-aggregated player rankings (`GET /players/rankings`, `GET /players/aggregated-rankings`).
- Individual player statistical profiles (`GET /players/:playerName/summary`).

### Swish AI Gateway Proxy
- Exposes `POST /ai/chat` as a secure backend proxy to **OpenRouter** (`meta-llama/llama-3.3-70b-instruct:free`), keeping API keys server-side while powering Swish's deterministic tool-calling and Generative UI cards (`MatchCard`, `PlayerCard`, `CompareCard`).

---

## API Endpoints

### Health

| Method | Endpoint  | Access | Description                  |
|:-------|:----------|:-------|:-----------------------------|
| `GET`  | `/health` | Public | Verify service health status |

### Uploads & ETL Processing

| Method | Endpoint       | Access             | Description                                             |
|:-------|:---------------|:-------------------|:--------------------------------------------------------|
| `GET`  | `/uploads`     | Public             | List uploaded box-score files                           |
| `GET`  | `/uploads/:id` | Public             | Retrieve metadata for a specific upload                 |
| `POST` | `/uploads`     | Admin / Coach / DT | Upload a match PDF box-score                            |
| `POST` | `/process`     | Admin / Coach / DT | Validate, parse, and persist stats from an uploaded PDF |

### Game Statistics

| Method   | Endpoint             | Access          | Description                                    |
|:---------|:---------------------|:----------------|:-----------------------------------------------|
| `GET`    | `/games/:id/players` | Public          | Retrieve player statistics for a specific game |
| `GET`    | `/games/:id/teams`   | Public          | Retrieve team statistics for a specific game   |
| `DELETE` | `/games/:id/stats`   | Admin / Service | Delete all statistics linked to a game         |

### Player Statistics & Rankings

| Method | Endpoint                       | Access | Description                                |
|:-------|:-------------------------------|:-------|:-------------------------------------------|
| `GET`  | `/players/rankings`            | Public | Retrieve per-game player rankings          |
| `GET`  | `/players/aggregated-rankings` | Public | Retrieve season-aggregated player rankings |
| `GET`  | `/players/:playerName/summary` | Public | Retrieve a player's statistical summary    |

### AI Assistant Proxy

| Method | Endpoint   | Access                   | Description                                       |
|:-------|:-----------|:-------------------------|:--------------------------------------------------|
| `POST` | `/ai/chat` | Authenticated / Platform | Proxy chat completions to OpenRouter for Swish AI |

---

## Authentication & Authorisation

Protected endpoints require a JWT Bearer token in the `Authorization` header:

```http
Authorization: Bearer <token>
```

| Operation                                                 | Allowed Roles          |
|:----------------------------------------------------------|:-----------------------|
| Upload box-score PDF                                      | `admin`, `coach`, `dt` |
| Process uploaded box-score                                | `admin`, `coach`, `dt` |
| Delete game statistics                                    | `admin`, `service`     |
| Public queries (`health`, `games`, `rankings`, `summary`) | Public                 |

---

## Database Schema

The Analytics API connects to **Supabase PostgreSQL** via the connection pooler (`pg`).

- **`uploads`:** Tracks uploaded box-score PDFs, associated game IDs, timestamps, and processing status.
- **`player_stats`:** Stores per-game box-scores (`game_id`, `team_id`, `player_number`, `player_name`, `minutes`, `is_starter`, `points`, `rebounds`, `assists`, `turnovers`, `steals`, `blocks`).
- **`team_stats`:** Stores aggregated team totals per game (`game_id`, `team_id`, `points`, `rebounds`, `assists`, `turnovers`, `steals`, `blocks`).

---

## Tech Stack

- **Runtime & Language:** Node.js, TypeScript `^6.0.3`
- **Framework:** Express `^5.2.1`, `cors ^2.8.6`, `dotenv ^17.4.2`
- **Database:** PostgreSQL (Supabase) via `pg ^8.20.0`
- **Authentication:** `jsonwebtoken ^9.0.3`
- **File & Document Parsing:** `multer ^2.1.1`, `pdf-parse ^2.4.5`, `csv-parser ^3.2.1`, `exceljs ^4.4.0`
- **AI Integration:** OpenRouter (`meta-llama/llama-3.3-70b-instruct:free`), `@google/genai ^2.20.0`, `@langchain/core ^1.2.9`, `@langchain/textsplitters ^1.0.1`
- **Dev Tooling:** `ts-node-dev ^2.0.0`, `tsx ^4.22.0`

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
PORT=3001
DB_HOST=your_supabase_pooler_host
DB_PORT=6543
DB_NAME=postgres
DB_USER=your_database_user
DB_PASSWORD=your_database_password
JWT_SECRET=your_jwt_secret
MANAGEMENT_API_URL=http://management-api:3000
OPENROUTER_API_KEY=your_openrouter_api_key
```

- `PORT`: Listening port (`3001` in Docker Compose production; `8081` or `3001` in local development).
- `DB_*`: Supabase PostgreSQL connection pooler credentials.
- `JWT_SECRET`: Shared secret used to verify user JWTs and sign short-lived `service` tokens.
- `MANAGEMENT_API_URL`: Internal Docker network URL (`http://management-api:3000`) used to validate games and update scores.
- `OPENROUTER_API_KEY`: API key used by `/ai/chat` to communicate with OpenRouter.

---

## Installation & Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your `.env` file.

3. Test the database connection:
   ```bash
   npm run db:test
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build and run in production mode:
   ```bash
   npm run build
   npm start
   ```

---

## Production Deployment

The Analytics API is dockerized (`analytics-api` container on port `3001`) and deployed on an **Oracle Cloud VPS** (Ubuntu 24.04, São Paulo) behind a **Nginx** reverse proxy with SSL/TLS (`https://147.15.10.181.nip.io/analytics`).

Health check verification:
```http
GET /health
```
```json
{
  "status": "ok",
  "service": "basket-stats-analytics-api-node"
}
```

---

## Related Services

| Repository                                                                                                   | Responsibility                                            |
|:-------------------------------------------------------------------------------------------------------------|:----------------------------------------------------------|
| [`basket-stats-frontend`](https://github.com/Edgarmontenegro123/basket-stats-frontend)                       | React + TypeScript user interface & Swish AI assistant    |
| [`basket-stats-management-api-node`](https://github.com/Edgarmontenegro123/basket-stats-management-api-node) | Authentication, users, teams, players, seasons, and games |
| [`basket-stats-analytics-api-node`](https://github.com/Edgarmontenegro123/basket-stats-analytics-api-node)   | PDF box-score ETL, statistics, rankings, and AI gateway   |

---

## Author

**Edgar Montenegro**