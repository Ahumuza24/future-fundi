# Future Fundi Dashboard

> **An EdTech platform that brings together students, teachers, parents, school admins, and program managers on a single learning management system.**

Future Fundi tracks learner progress through structured pathways (courses), captures artifacts (project work), manages teaching sessions, awards badges/microcredentials, and surfaces live analytics for every stakeholder group — all behind a clean role-based access model.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [User Roles](#user-roles)
- [Detailed Documentation](#detailed-documentation)
- [Contributing](#contributing)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui (Radix), Framer Motion |
| **Backend** | Django 6, Django REST Framework, SimpleJWT, Whitenoise |
| **Database** | SQLite (dev) → PostgreSQL (production) |
| **Auth** | JWT (access 15 min / refresh 7 days, rotating + blacklisted) |
| **Caching** | In-memory (dev) → Redis (production) |
| **Deployment** | Frontend: Vercel · Backend: Render |

---

## Project Structure

```
future-fundi/
├── backend/          # Django API server
│   ├── apps/
│   │   ├── api/      # REST endpoints, serializers, permissions
│   │   ├── core/     # Domain models (Learner, Course, Module, Session …)
│   │   └── users/    # Custom User model + authentication backends
│   └── fundi/        # Django project settings & URL routing
├── frontend/         # React SPA
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route-level page components
│       │   ├── admin/    # Platform-admin views
│       │   ├── parent/   # Parent portal
│       │   ├── school/   # School-admin views
│       │   ├── student/  # Student dashboard & pathway learning
│       │   └── teacher/  # Teacher tools
│       └── lib/          # API client, auth helpers
├── docs/             # Extended documentation
└── scripts/          # Utility scripts
```

---

## Quick Start

> **Prerequisites:** Python ≥ 3.11, Node.js ≥ 20, pnpm ≥ 9

### 1 — Clone & configure

```bash
git clone <repo-url>
cd future-fundi
```

### 2 — Backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env — set DJANGO_SECRET_KEY at minimum; leave USE_SQLITE=true for local dev

python manage.py migrate
python manage.py createsuperuser   # optional — creates a platform admin account
python manage.py runserver
# API available at http://localhost:8000
```

### 3 — Frontend

```bash
cd frontend
pnpm install

cp .env.example .env.local
# Edit .env.local: VITE_API_URL=http://localhost:8000/api

pnpm dev
# App available at http://localhost:5173
```

---

## User Roles

| Role | Dashboard Path | Access Level |
|---|---|---|
| `learner` | `/student` | Own data only |
| `teacher` | `/teacher` | Learners in their sessions |
| `parent` | `/parent` | Linked child's data only |
| `program_manager` | `/program-manager` | Cross-program analytics and impact reporting |
| `school` | `/school` | School admin panel |
| `admin` | `/admin` | Full platform access |
| `curriculum_designer` | `/admin/curriculum-designer` | Curriculum CMS and content management |

---

## Detailed Documentation

| Document | Purpose |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data model diagrams, key design decisions |
| [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) | Detailed environment setup including PostgreSQL & Redis |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | All REST endpoints with request/response examples |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Git workflow, code standards, PR checklist |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment to Render + Vercel |
| [docs/DATABASE_CONFIGURATION.md](docs/DATABASE_CONFIGURATION.md) | Switching SQLite → PostgreSQL, migrations, seeds |

---

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full contribution guide.

**Short version:**
1. Branch from `main` using `feature/<description>` or `fix/<description>`
2. Run `pnpm lint` (frontend) and `ruff check .` (backend) before committing
3. Open a PR with a clear description and tag a reviewer

---

*Built by Ahumuza Cedric.*
