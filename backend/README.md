# FocusFlow Backend (FastAPI)

## Run it
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # edit SECRET_KEY
alembic revision --autogenerate -m "initial tables"    # writes the migration from the models
alembic upgrade head                                   # creates the tables
uvicorn app.main:app --reload                          # http://localhost:8000/docs
pytest                                                 # run the tests
```
Open `/docs`, call `POST /auth/register`, then `Authorize` with your email + password and try every endpoint.

## Architecture
```
HTTP request
  -> api/v1/*.py      (router: parse + validate input, return output; NO business rules)
  -> services/*.py    (business rules: ownership, recovery time, streaks)
  -> models/          (SQLAlchemy tables)  -> database (SQLite dev / PostgreSQL prod)
schemas/ = API contract (Pydantic). core/ = config, DB engine, security (JWT, bcrypt).
```
Every request: `oauth2` extracts the JWT -> `current_user` loads the user -> every query filters by `user_id`.

## Design decisions (and why)
1. **Routers thin, services fat**: rules are reusable and testable without HTTP.
2. **Models != Schemas**: DB can change without breaking the API; `password_hash` never leaks.
3. **Auth from day one** (SRS says single user, Phase 6 adds auth): every table already has `user_id`, so going multi-user later needs no redesign.
4. **Recovery time computed on the server** (`returned_at - occurred_at`): clients can't corrupt the core metric.
5. **Categories are strings validated by Pydantic**, not DB enums: adding one needs no migration.
6. **Reflections/goals are upserts** (unique per user per date): posting twice edits instead of failing.
7. **`tz_offset_minutes`** on analytics: "today" follows the user's clock (Bangladesh = 360).
8. **SQLite by default, PostgreSQL by env var**: same code, zero setup for learning.
9. **Pagination and `/api/v1` versioning** exist from the start.
Changes vs SRS: `focus_seconds` added to sessions; `/auth/*` endpoints added; analytics also returns longest streak and today numbers.

## Doors for the future: how to add a feature
Example: "Attention Training log" (breathing sessions).
1. Add a class in `models/__init__.py`.   2. Add schemas in `schemas/__init__.py`.
3. Put rules in `services/training.py`.   4. Create `api/v1/training.py`.
5. `include_router` it in `api/v1/__init__.py`.   6. `alembic revision --autogenerate` then `alembic upgrade head`.
Ideas ready to plug in: Settings table (default durations, theme), 7/14-day challenge tables, CSV/JSON data export endpoint, weekly insights (best time of day), refresh tokens, rate limiting, Redis cache, background jobs.

## Free deployment (all three have free tiers; check current limits)
1. **Database: Neon** (neon.tech). Create a project, copy the connection string.
2. **API: Render** (render.com). New Web Service from your GitHub repo, root `backend`.
   Build: `pip install -r requirements.txt && alembic upgrade head`
   Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   Env vars: `DATABASE_URL` (Neon string), `SECRET_KEY`, `CORS_ORIGINS=["https://YOUR-APP.vercel.app"]`.
   Free instances sleep when idle, so the first request can be slow.
3. **Frontend: Vercel** (vercel.com). Import the repo, root `frontend`, env var `VITE_API_URL=https://YOUR-API.onrender.com/api/v1`.
