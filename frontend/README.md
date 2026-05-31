# Frontend

React frontend built with Vite, Tailwind CSS, and lucide-react.

## Setup

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`.

Set `VITE_API_URL` in `.env` if the backend is not running at `http://localhost:8000`.

## Google Login

Set `VITE_GOOGLE_CLIENT_ID` in `.env` to your Google OAuth Web client ID. The backend must use the same value as `GOOGLE_CLIENT_ID`.
