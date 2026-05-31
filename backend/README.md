# Backend

FastAPI backend with SQLAlchemy, PostgreSQL, Alembic, and seed data.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
copy .env.example .env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

Set `GOOGLE_CLIENT_ID` in `.env` to your Google OAuth Web client ID. The frontend must use the same value as `VITE_GOOGLE_CLIENT_ID`.

Set `ADMIN_EMAILS` to a comma-separated list of Google account emails that should receive the `admin` role. All other verified Google users receive the `player` role.

Key endpoints:

- `POST /api/auth/google`
- `GET /api/categories`
- `POST /api/quiz/start`
- `POST /api/quiz/submit`
- `GET /api/leaderboard`
- `GET/POST/PUT/DELETE /api/admin/questions`
