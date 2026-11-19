# LabRentX

LabRentX is a web application for engineering laboratories to catalogue shared hardware, review student requisitions, verify counter handovers, track returns and maintenance, and audit fines and inventory.

The implementation follows the project research paper's three-layer design: a React/Vite client, a Django REST Framework API using JWT authentication, and a MySQL database with SQLite available for local development.

## Features

- Student and lab-assistant portals with role-checked API access.
- Searchable equipment catalogue with specifications, category filters, datasheets, and computed availability.
- Requisitions validated against the student's registered enrolment number, open-request limit, unpaid-fine status, dates, duration, and stock.
- Admin approval/rejection; cryptographically generated `LRX-XXXXX` reservation codes.
- Counter issue and return with reservation-code and registered-enrolment verification.
- Return-time late-fine calculation, payment recording, and justified waivers.
- Damage and maintenance records that reserve and restore inventory units transactionally.
- Student rental/fine history, in-app notifications, admin dashboards, overdue/usage/inventory analytics, and CSV exports for rentals and the audit ledger.
- Audit events for request lifecycle, fines, equipment, maintenance, and account administration.

Availability is calculated as total units minus issued units, approved reservations, and units under maintenance. Inventory value is reported only after administrators enter per-unit inventory values; unknown values default to zero rather than being estimated.

## Technology

| Area | Technology |
|---|---|
| Frontend | React, Vite, Lucide React |
| Backend | Python, Django 5.2, Django REST Framework |
| Authentication | SimpleJWT access and refresh tokens |
| Database | MySQL in production; SQLite for local setup |
| Production static files | WhiteNoise |
| Hosting recommendation | Vercel frontend, Railway Django service and managed MySQL |

The backend requirements stay in the installed Django 5.2 compatibility line. The paper's stated newer Django version has not been validated against this project, so framework upgrades are intentionally not included.

## Local development

### Backend

From the repository root in PowerShell:

```powershell
Set-Location .\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Create `backend\.env` from `.env.example` only if you do not already have an environment file. Do not overwrite an existing `.env`. For a new local database, use `DB_ENGINE=sqlite`, `DEBUG=True`, and the localhost host/origin values shown in the example.

For a **new, empty local database only**:

```powershell
python manage.py migrate
python seed_data.py
```

The seed script refuses to run when any LabRentX application table already contains records. It is for isolated development/demo databases only, never production. Do not run `migrate` against an existing database until you have backed it up and reviewed the migration plan.

Start Django:

```powershell
python manage.py runserver 127.0.0.1:8000
```

### Frontend

Open another PowerShell terminal:

```powershell
Set-Location .\frontend
npm ci
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The Vite development proxy forwards `/api` and `/media` to Django at `http://127.0.0.1:8000`. Set `VITE_API_BASE_URL` when the API is hosted at a different origin; do not put credentials in frontend environment variables.

### Demo accounts

The seed script creates demonstration users. The login page's quick-fill controls are compiled into development builds only (`npm run dev`) and are absent from production builds. Seeded credentials are development-only; change them before any shared demonstration, and never seed or reuse them in production.

## Checks and tests

Run the backend checks from `backend`:

```powershell
python manage.py check
python manage.py test
python manage.py makemigrations --check --dry-run
```

Run frontend validation from `frontend`:

```powershell
npm run lint
npm run build
```

Django's test runner uses its isolated test database. These commands do not require resetting the local SQLite database. Review `python manage.py migrate --plan` before applying schema changes to any database with existing data.

## Environment configuration

`backend/.env.example` contains local-only placeholders. Important backend variables:

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Django signing key; use a unique secret from the hosting secret manager in production |
| `DEBUG` | `False` in production |
| `ALLOWED_HOSTS` | Comma-separated backend hostnames |
| `CORS_ALLOWED_ORIGINS` | Exact frontend origins, including `https://` |
| `DB_ENGINE` | `mysql` for production or `sqlite` for local development |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | MySQL connection settings |
| `MEDIA_ROOT` | Persistent location for uploaded equipment images and datasheets |
| `SECURE_SSL_REDIRECT` | Keep enabled when the production host provides HTTPS and forwards `X-Forwarded-Proto` |

`frontend/.env.example` sets `VITE_API_BASE_URL=/api` for local proxy use. For Vercel, set it to the full backend API base URL, such as `https://<backend-host>/api`. The frontend API base URL is public configuration, not a secret.

Never commit `.env` files, database files, uploaded media, or credentials. The root `.gitignore` excludes these paths; the committed `.env.example` files contain placeholders only.

## Deployment preparation

Recommended architecture:

1. **Frontend — Vercel:** set the project root to `frontend`, build command to `npm run build`, and output directory to `dist`. `frontend/vercel.json` provides the SPA fallback. Configure `VITE_API_BASE_URL` as the deployed Django API URL.
2. **Backend — Railway:** deploy the `backend` directory as a Python service. `backend/Procfile` runs `collectstatic` and Gunicorn; `backend/requirements.txt` lists the runtime dependencies.
3. **Database — managed MySQL:** provision MySQL in the same region as the backend and map the provider's connection values to the `DB_*` environment variables. Keep database access private.
4. **Uploads:** mount persistent storage and set `MEDIA_ROOT` to that mount, or configure a managed object-storage service before relying on uploaded images/datasheets in production. Railway's ephemeral filesystem is not a durable media store.

Before deploying, configure a newly generated `SECRET_KEY`, `DEBUG=False`, exact `ALLOWED_HOSTS`, exact `CORS_ALLOWED_ORIGINS`, MySQL credentials, persistent media storage, and HTTPS. Do not use the committed examples as production secrets.

After backing up and reviewing schema changes, apply migrations explicitly in the hosting shell/release workflow:

```sh
python manage.py migrate
python manage.py check --deploy
```

The service startup command is defined in `backend/Procfile`. Do not add destructive database resets or run the demo seed script on production. This repository is deployment-prepared only; no service, database, or website has been deployed.

## Known limitations and manual follow-up

- Notifications are in-app; email/SMS delivery and scheduled reminder jobs are not configured.
- Fine payments are recorded by lab staff; no online payment provider is integrated.
- Accurate inventory valuation requires entering verified unit values for each equipment record.
- Load/performance testing on a lab LAN and scripted user-acceptance testing for both roles remain deployment/demo tasks.
- Production media persistence and provider-specific MySQL environment mapping must be configured by the deployer.
- Take a backup and inspect the generated equipment migration before applying it to the existing database.
