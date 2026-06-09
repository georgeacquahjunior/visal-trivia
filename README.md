# Visal Trivia

A lightweight general knowledge trivia website for short-term company campaigns, engagement pages, and iframe embeds.

## Features

- Timed multiple choice quiz flow
- Player name entry with no complex authentication
- Score submission and leaderboard
- Categories for Technology, Science, Sports, Movies, Geography, Business, and General Knowledge
- Simple token-protected admin dashboard for categories and questions
- PostgreSQL database with SQLAlchemy and Alembic
- Responsive React UI built with Tailwind CSS and lucide-react

## Project Structure

```text
visal-trivia/
  backend/   FastAPI, SQLAlchemy, PostgreSQL, Alembic, seed data
  frontend/  React, Vite, Tailwind CSS, lucide-react
```

## Backend Setup

Create a PostgreSQL database named `visal_trivia`, then run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
copy .env.example .env
```

Update `backend/.env` if your PostgreSQL username, password, host, or port are different.

```powershell
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

Backend: `http://localhost:8000`

API docs: `http://localhost:8000/docs`

## Frontend Setup

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`

## Admin

Set `ADMIN_EMAILS` in `backend/.env` to a comma-separated list of Google account emails that should see the Admin tab. Admin users can add, edit, and delete questions and control quiz settings.

## Google Login

Create a Google OAuth Web client ID in Google Cloud Console, then set it in both env files:

```powershell
backend/.env
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
ADMIN_EMAILS=admin@example.com,owner@example.com

frontend/.env
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

For local development, add `http://localhost:5173` as an authorized JavaScript origin for the Google OAuth client.

## Embed

Deploy the frontend and embed it in a company website:

```html
<iframe
  src="https://your_domain.com"
  width="100%"
  height="700"
  style="border:none;">
</iframe>
```

The app is responsive and can also be embedded with the frontend root URL if your host does not use `/trivia`.
