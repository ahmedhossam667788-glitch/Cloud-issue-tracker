# Getting Started

## Run locally

From the repository root, install dependencies once and start the frontend:

```sh
npm install
npm start
```

Open <http://localhost:8080>. The root start script serves the `frontend` directory, where the app entry point and static assets live.

## Backend API

The backend is a separate JSON API. From the `backend` directory, install dependencies and start it:

```sh
npm install
npm start
```

It listens on <http://localhost:3000>. The API supports `GET`, `POST`, `PATCH`, and `DELETE` at `/api/issues`; `GET /health` checks server availability. Issues are persisted in `backend/data/issues.json`.

The frontend is not connected to this API yet and continues to store issues in the current browser's local storage. Data is not shared across browsers or devices, and no cloud database is configured.