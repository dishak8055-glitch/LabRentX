# LabRentX frontend

React/Vite single-page client. See the repository-root `README.md` for the full backend, database, test, and deployment instructions.

## Local development

```powershell
npm ci
npm run dev
```

By default, the client uses `VITE_API_BASE_URL=/api`; `vite.config.js` proxies API and media requests to the local Django service at `http://127.0.0.1:8000`. Copy `.env.example` to `.env` only when a local environment file does not already exist. For a deployed frontend, configure `VITE_API_BASE_URL` to the backend API URL in the hosting provider's environment settings.

## Validation and deployment

```powershell
npm run lint
npm run build
```

Vercel should use this directory as its project root, `npm run build` as its build command, and `dist` as its output directory. `vercel.json` enables client-side route fallback. Demo login helpers are development-only.
