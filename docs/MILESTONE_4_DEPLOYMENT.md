# Milestone 4 deployment

This package uses one public origin for the static frontend and `/api/` routes. Caddy proxies API requests to FastAPI. PostgreSQL stays on the internal container network. No paid hosting resources have been created.

## A. Check the container setup locally

Requires Docker with Compose. From the project root in PowerShell:

```powershell
Copy-Item .env.docker.example .env.docker
python -c "import secrets; print(secrets.token_hex(32)); print(secrets.token_hex(32))"
```

Put the first random value in `POSTGRES_PASSWORD` and the second in `SECRET_KEY` in `.env.docker`. Use hex values so the database URL needs no special-character escaping. Add your own Gemini key if desired. Keep the local development values for the remaining fields.

```powershell
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker ps
```

Open `http://localhost:8080`. The containers create a **separate, initially empty PostgreSQL database**. Your laptop's original database and users do not appear automatically. Register a test user and enter records, or plan an explicit backup/restore of your existing database. There is no seed/demo-data insertion.

Stop without deleting stored data:

```powershell
docker compose --env-file .env.docker down
```

Do not add `-v` unless you intentionally want to delete the container database volumes.

## B. Publish on a server with a domain

Use a server that supports Docker Compose. Obtain its access details and a domain before this step. Costs depend on the hosting provider and have not been assessed here.

1. Copy the source to the server, excluding local `.env`, dependency folders and other credentials. Create `.env.docker` directly on the server.
2. Point the domain's DNS to the server. Open inbound TCP ports 80 and 443. Keep PostgreSQL and backend ports private.
3. Set the following in `.env.docker`, replacing the example domain:

```dotenv
ENVIRONMENT=production
FRONTEND_URL=https://growthsync.example.com
SITE_ADDRESS=growthsync.example.com
WEB_HTTP_PORT=80
WEB_HTTPS_PORT=443
```

4. Set a fresh `POSTGRES_PASSWORD` and `SECRET_KEY`, then add your Gemini settings. Keep secrets out of Git.
5. Run `docker compose --env-file .env.docker up --build -d`. Caddy handles HTTPS when public DNS and connectivity are correct.
6. Open `https://your-domain/health`, then test registration, login, record creation, graphs, simulations, chat and logout.

The frontend's production default is its own origin. Do not bake `localhost:8000` into an online frontend. This recipe does not require `VITE_API_URL`. If using a different hosting layout, configure that variable at build time and review cookie/CORS settings separately.

## Database continuity and backups

The volume retains data across container restarts. Changing `POSTGRES_PASSWORD` in the environment does not rotate the password inside an already initialized PostgreSQL volume. Plan explicit credential rotation rather than deleting the database.

Create a server-side backup file inside the database container, then copy it out (avoids PowerShell binary-redirection problems):

```powershell
docker compose --env-file .env.docker exec -T db pg_dump -U growthsync -d growthsync -Fc -f /tmp/growthsync.dump
docker compose --env-file .env.docker cp db:/tmp/growthsync.dump ./growthsync.dump
```

Store backups privately. Verify a restore into a separate database before relying on a backup. Importing the laptop's existing database is a separate operation and should not overwrite a live database without a verified backup.

## Operational boundaries

- Deployment has not been executed here. Docker, DNS and live HTTPS still need an end-to-end check on the target machine.
- The backend uses one worker. AI cooldowns are in memory per process and reset after restart. Multiple replicas need a shared limiter.
- Chat is read-only and does not persist messages. Its short history travels with requests.
- Production cookies use Secure and HttpOnly. Unsafe browser requests require an allowed Origin.
- Password-reset email is not implemented in the original project. Production now reports this honestly instead of claiming an email was sent. Configure an email provider before offering self-service recovery publicly.
- Public rollout should also include login abuse controls, backup monitoring and API quota/budget monitoring.
- Do not retrain models or generate records merely to make the graphs look busy.

## References checked for this setup

- Docker Compose startup dependencies: https://docs.docker.com/compose/how-tos/startup-order/
- Caddy automatic HTTPS: https://caddyserver.com/docs/automatic-https
- Caddy environment-variable syntax: https://caddyserver.com/docs/caddyfile/concepts
- Gemini structured output: https://ai.google.dev/gemini-api/docs/structured-output

Structured-output validation checks shape and references. It does not prove that an AI explanation is correct.
