# Vercel frontend and persistent backend

The deployed frontend at https://qura-ge6g.vercel.app currently returns 404 for /api/health and /api/auth/login. The local Vite proxy is not part of the production frontend build. A backend must be deployed before a rewrite can fix login.

## Backend prerequisites

Deploy the existing Dockerfile or run a persistent Python 3.10 service with dependencies from backend/requirements.lock. The Dockerfile serves on port 5000. A native service can use `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT` where the host supplies PORT. Use one worker with the current SQLite and local training architecture.

Mount a persistent disk and configure QURA_STORAGE_DIR to its writable mount path. This stores accounts, sessions, uploads, datasets and model checkpoints. Do not copy your personal local database or .env into the deployment. Configure these environment variables through the host dashboard:

- QURA_JWT_SECRET: a fresh random secret of at least 32 characters.
- QURA_COOKIE_SECURE: true.
- QURA_ALLOWED_ORIGINS: https://qura-ge6g.vercel.app (add other exact production domains only if needed).
- QURA_DEMO_PASSWORD: a unique strong password, only if fictional demo accounts are wanted.
- QURA_EXTERNAL_AI_ENABLED: false unless deliberately configured.

Run `python -m backend.seed_demo` once on the persistent backend to create fictional demo users. Model training is optional for login/emergency demos; use --train --reports to populate research examples. Existing accounts keep their original passwords when seeded again.

## Connect Vercel

Once the backend is available, check its public /api/health endpoint for JSON. From the project folder run:

```powershell
python tools/configure_vercel.py --backend https://YOUR-ACTUAL-BACKEND-DOMAIN
```

This generates root vercel.json with the API rewrite before the frontend fallback. Replace the example origin with the real deployed origin. Do not use localhost: a visitor's localhost is their own computer. Commit the generated vercel.json and redeploy the connected Vercel project. Its build command is npm run build and output directory is dist.

Verify https://qura-ge6g.vercel.app/api/health returns JSON, then check login, persisted /api/auth/me cookies and logout. Demo passwords come from the backend's environment, not the frontend or your local computer. Authentication responses must not be cached. Verify the proxy preserves cookies and the browser Origin; do not weaken authentication or Origin validation if it does not.

The external HTTP rewrite must be verified with the actual hosting service. WebSocket forwarding requires a separate deployment check; authorized HTTP polling remains the emergency UI fallback. Persistent storage, training resource limits, TLS, backups and access controls remain hosting responsibilities. No real emergency integrations are supplied by deployment.
