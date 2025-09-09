# Salite One UI

React + Vite + TypeScript + Tailwind + React Query.

## Development

1) Configure

```bash
cp .env.example .env.local
# .env.local uses Vite proxy; backend should run at http://127.0.0.1:8000
```

2) Install & run

```bash
pnpm install || npm install
pnpm dev || npm run dev
```

3) Login

- Open http://localhost:5173
- Sign in with your Frappe user (stored in a cookie; Vite proxy handles same-origin)

Notes

- Dev proxy maps `/api` → `http://127.0.0.1:8000`, so axios `baseURL` is `/api` and endpoints are `/method/*`, `/resource/*`.
- If you get 404 on login, ensure calls use `/method/login` not `/api/method/login`.
