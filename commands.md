# Local Run Commands

Use two terminals:

- Terminal 1 for backend (FastAPI)
- Terminal 2 for mobile app (Expo)

## 1) Backend Setup (first time)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e .
```

## 2) Start Backend API

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --app-dir .. --host 0.0.0.0 --reload --port 8000
```

Note: Do not run `pip install app`. That installs an unrelated third-party package named `app`.

Backend will run at:

- [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## 3) Mobile Setup (first time)

```powershell
cd mobile
Copy-Item .env.example .env
npm i
```

## 4) Start Mobile App (Expo)

```powershell
cd mobile
npm run start /  npx expo start --clear
```

## 5) API URL for Emulator/Device

Set `EXPO_PUBLIC_API_URL` in `mobile/.env`:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://127.0.0.1:8000`
- Physical device: `http://<YOUR_COMPUTER_LOCAL_IP>:8000`

Then restart Expo after `.env` changes.

## 6) Run Backend Tests

```powershell
python -m pytest backend/tests -q
```

## 7) Quick Start (after first-time setup)

Terminal 1:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --app-dir .. --host 0.0.0.0 --reload --port 8000
```

Terminal 2:

```powershell
cd mobile
npm run start
```
