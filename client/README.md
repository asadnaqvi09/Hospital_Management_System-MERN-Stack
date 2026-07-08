# CareCore HMS Client

Web RBAC dashboards for CareCore Hospital Management System.

## Stack

- Vite + React (JavaScript)
- Redux Toolkit + RTK Query
- React Router v7
- Tailwind CSS v4
- Socket.io Client
- Native fetch API

## Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:3000`. Backend API: `http://localhost:5000/api/v1`.

## Roles

admin, doctor, patient, receptionist, pharmacist, lab_technician, nurse

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview build
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npm test` — Vitest
