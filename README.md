# retention-ai

Monorepo: React-Frontend und TypeScript-API.

```text
apps/web        Vite + React + TypeScript
apps/api        Hono (Node)
packages/shared Gemeinsame Types
```

## Setup

```bash
pnpm install
pnpm dev
```

- Frontend: http://localhost:5173
- API: http://127.0.0.1:3001 (`GET /api/health`)

Frontend-Requests an `/api` werden im Dev-Server zur API geproxied.
