# AI Agent Ecosystem — Android PWA

Deployable mobile-first PWA dashboard with a FastAPI API, PostgreSQL, Redis worker, Docker Compose, and Railway configuration.

## Deploy
1. Copy `.env.example` to `.env` and set strong secrets.
2. Run locally: `docker compose up --build`.
3. Open `http://localhost:5173`.
4. For Android, deploy the web app over HTTPS, open it in Chrome, then choose **⋮ → Add to Home screen**.

## Production
- Deploy `apps/api` as a web service and `apps/web` as a static Node/Vite service, or use the included Dockerfiles.
- Set `VITE_API_URL` to the public API URL.
- Run migrations with `alembic upgrade head`.
- Provider integrations require credentials and app approvals; this package includes safe placeholders rather than pretending those credentials exist.
