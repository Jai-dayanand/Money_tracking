# Money Tracking

Money Tracking is a mobile-first personal finance app with a sleek, minimal UI and a Python backend.

## Tech Stack

### Mobile app

- React Native with Expo (TypeScript)
- React Navigation
- TanStack Query
- React Hook Form + Zod
- Expo Local Authentication (biometric lock)

### Backend API

- FastAPI (Python 3.12)
- Pydantic v2
- In-memory transaction service (MVP), designed to be replaced with MongoDB repository in the next phase

## What Is Implemented (MVP Foundation)

### Mobile

- Biometric gate on app open (with fallback)
- Bottom-tab navigation
- Home dashboard with monthly balance snapshot
- Transaction history screen with filters
- Quick-add transaction screen
- Insights screen with category spend bars and recent expense flow
- API integration with graceful local fallback when backend is offline

### Backend

- Health endpoint
- List transactions endpoint
- Create transaction endpoint
- Monthly summary endpoint
- Seed data for local development
- API tests for health, create, and summary

## Project Structure

```text
.
├── mobile/
│   ├── App.tsx
│   ├── package.json
│   └── src/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── navigation/
│       ├── screens/
│       ├── security/
│       ├── theme/
│       ├── types/
│       └── utils/
├── backend/
│   ├── pyproject.toml
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   └── tests/
├── implementation.md
└── README.md
```

## Run Locally

### 1. Start backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e .
uvicorn app.main:app --reload --port 8000
```

### 2. Start mobile app

```bash
cd mobile
cp .env.example .env
npm install
npm run start
```

If you are using an Android emulator, set `EXPO_PUBLIC_API_URL` to `http://10.0.2.2:8000`.

### 3. Run backend tests

```bash
python -m pytest backend/tests -q
```

## API Endpoints

- `GET /api/v1/health`
- `GET /api/v1/transactions`
- `POST /api/v1/transactions`
- `GET /api/v1/transactions/summary`

## Next Milestones

1. Replace in-memory backend service with MongoDB repository and indexes.
2. Add JWT auth, refresh token rotation, and session/device tracking.
3. Add receipt upload flow (mobile camera + object storage).
4. Add recurring rules and notification scheduler.
5. Add polished onboarding, PIN setup, and accessibility audit.
