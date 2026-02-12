# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fullstack application with Django REST backend and React/TypeScript frontend. Uses JWT authentication via Djoser, PostgreSQL with pgvector extension, and Docker Compose for orchestration.

## Architecture

### Backend (Django)
- **Tech Stack**: Django 6.0.2+, Django REST Framework, Djoser for auth, SimpleJWT
- **Package Manager**: `uv` (fast Python package installer)
- **Database**: PostgreSQL with pgvector extension
- **Authentication**: JWT-based (access/refresh tokens) via Djoser endpoints
- **Structure**:
  - `backend/backend/` - Django project configuration
  - `backend/user/api/` - User serializers for Djoser
  - Auth endpoints mounted at `/auth/` (Djoser URLs)

### Frontend (React)
- **Tech Stack**: React 19, TypeScript, Vite 7, React Router 7, TanStack Query
- **Package Manager**: `bun`
- **Styling**: SCSS with Bootstrap 5
- **State Management**:
  - React Context for auth (`AuthContext`) and toasts (`ToastContext`)
  - TanStack Query for server state
- **Routing**: React Router with protected routes via `ProtectedRoute` component
- **API**: Axios with auth interceptor (`useAxiosAuth` hook) for automatic token refresh

### Infrastructure
- Docker Compose orchestrates three services: `postgres`, `backend`, `frontend`
- Backend uses anonymous volume for `.venv` to prevent local/container conflicts
- Frontend uses named volume for `node_modules`

## Development Commands

### Setup
```bash
# Copy environment files
cp .env.sample .env
cp frontend/.env.sample frontend/.env

# Start all services
docker compose up --build
```

### Backend
```bash
# Run backend locally (requires .env with DATABASE_URL)
cd backend
uv run manage.py runserver

# Add Python dependencies
uv add <package-name>

# Run migrations
uv run manage.py makemigrations
uv run manage.py migrate

# Run tests
uv run pytest

# Run specific test file
uv run pytest path/to/test_file.py

# Lint
flake8 .

# Format
black .

# Django admin
uv run manage.py createsuperuser
```

### Frontend
```bash
cd frontend

# Install dependencies
bun install

# Run dev server
bun run dev

# Build for production
bun run build

# Lint
bun run lint

# Preview production build
bun run preview
```

### Docker
```bash
# Start services
docker compose up

# Rebuild and start
docker compose up --build

# Run backend migrations in container
docker compose exec backend uv run manage.py migrate

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

## Key Configuration

### Environment Variables
- **Backend** (`.env`): `ACCESS_LIFETIME`, `REFRESH_LIFETIME`, `DATABASE_URL` (auto-set in docker-compose)
- **Frontend** (`frontend/.env`): `VITE_API_BASE_URL`, `VITE_ACCESS_LIFETIME`, `VITE_REFRESH_LIFETIME`

### Authentication Flow
1. Frontend sends credentials to `/auth/jwt/create/` (login) or `/auth/users/` (register)
2. Backend returns access/refresh tokens
3. Tokens stored in `AuthContext` state
4. `useAxiosAuth` hook adds Bearer token to requests, auto-refreshes via `/auth/jwt/refresh/`
5. Protected routes check auth state via `ProtectedRoute` component

### CORS
Backend allows `http://localhost:5173` (frontend dev server) in `backend/backend/settings.py`

## Testing

Backend uses pytest with pytest-django. Configure via `backend/pytest.ini`.

## Port Allocation
- Frontend: 5173
- Backend: 8000
- PostgreSQL: 5432
