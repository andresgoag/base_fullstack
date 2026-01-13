# Fullstack Boilerplate

A modern fullstack application boilerplate with React + TypeScript frontend, Django REST backend, and PostgreSQL database.

## Tech Stack

### Frontend
- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite 6
- **Styling:** SCSS + Bootstrap 5
- **State Management:** TanStack Query (React Query)
- **HTTP Client:** Axios
- **Forms:** React Hook Form
- **Routing:** React Router 7

### Backend
- **Framework:** Django 5.2
- **API:** Django REST Framework
- **Authentication:** JWT (djangorestframework-simplejwt + Djoser)
- **Database:** PostgreSQL with pgvector extension
- **Package Manager:** uv
- **Testing:** pytest + pytest-django

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Database:** PostgreSQL 16 with pgvector

## Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose (for containerized development)
- [Bun](https://bun.sh/) (for local frontend development)
- [uv](https://docs.astral.sh/uv/) (for local backend development)
- [Python 3.13+](https://www.python.org/) (for local backend development)

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository and navigate to the project root

2. Create environment files from samples:
   ```bash
   cp .env.sample .env
   cp frontend/.env.sample frontend/.env
   ```

3. Start all services:
   ```bash
   docker compose up --build
   ```

4. Access the application:
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:8000
   - **Django Admin:** http://localhost:8000/admin

### Local Development (Without Docker)

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies with uv:
   ```bash
   uv sync
   ```

3. Set up environment variables in root `.env` file (see Environment Variables section)

4. Run migrations:
   ```bash
   uv run manage.py migrate
   ```

5. Create a superuser (optional):
   ```bash
   uv run manage.py createsuperuser
   ```

6. Start the development server:
   ```bash
   uv run manage.py runserver
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables (see Environment Variables section)

4. Start the development server:
   ```bash
   bun run dev
   ```

## Environment Variables

### Backend (Root `.env`)

Create a `.env` file in the project root with the following variables:

```env
# JWT Token Lifetimes (in seconds)
ACCESS_LIFETIME=300           # 5 minutes
REFRESH_LIFETIME=604800       # 7 days

# Database (automatically set in docker-compose.yml for Docker setup)
DATABASE_URL=postgresql://postgres:dev_password@localhost:5432/postgres

# Django Settings (for production)
# SECRET_KEY=your-secret-key-here
# DEBUG=False
# ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

**Variable Descriptions:**
- `ACCESS_LIFETIME`: JWT access token expiration time in seconds
- `REFRESH_LIFETIME`: JWT refresh token expiration time in seconds
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Django secret key (change in production!)
- `DEBUG`: Django debug mode (set to False in production)
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts in production

### Frontend (`frontend/.env`)

Create a `frontend/.env` file with:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# JWT Token Lifetimes (should match backend settings)
VITE_ACCESS_LIFETIME=300
VITE_REFRESH_LIFETIME=604800
```

**Variable Descriptions:**
- `VITE_API_BASE_URL`: Base URL for the backend API
- `VITE_ACCESS_LIFETIME`: Must match backend ACCESS_LIFETIME
- `VITE_REFRESH_LIFETIME`: Must match backend REFRESH_LIFETIME

## Project Structure

```
.
├── backend/                 # Django backend application
│   ├── backend/            # Django project settings
│   │   ├── settings.py     # Main settings file
│   │   └── urls.py         # Root URL configuration
│   ├── user/               # User app (authentication)
│   ├── manage.py           # Django management script
│   ├── pyproject.toml      # Python dependencies (uv)
│   ├── pytest.ini          # Pytest configuration
│   └── Dockerfile          # Backend production Dockerfile
│
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── api/           # API client and services
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── config.ts      # App configuration
│   │   ├── models.ts      # TypeScript types/interfaces
│   │   ├── Router.tsx     # Application routing
│   │   └── main.tsx       # Application entry point
│   ├── package.json        # Node dependencies
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── Dockerfile.dev      # Frontend development Dockerfile
│
├── docker-compose.yml      # Docker Compose configuration
├── .env                    # Backend environment variables
└── README.md              # This file
```

## Available Scripts

### Frontend Scripts

```bash
cd frontend

# Start development server
bun run dev

# Build for production
bun run build

# Lint code
bun run lint

# Preview production build
bun run preview
```

### Backend Scripts

```bash
cd backend

# Run development server
uv run manage.py runserver

# Run migrations
uv run manage.py migrate

# Create migrations
uv run manage.py makemigrations

# Create superuser
uv run manage.py createsuperuser

# Run tests
uv run pytest

# Add new package
uv add package-name

# Django shell
uv run manage.py shell
```

## Customization Guide

### Adding Backend Dependencies

Use `uv` to add Python packages:

```bash
cd backend
uv add requests  # Example: adding requests library
```

This will update `pyproject.toml` and `uv.lock` automatically.

### Adding Frontend Dependencies

Use `bun` to add npm packages:

```bash
cd frontend
bun add axios      # Add production dependency
bun add -d vitest  # Add development dependency
```

### Customizing Django Settings

Edit `backend/backend/settings.py` to customize:

- **Database configuration:** Modify `DATABASES` setting
- **CORS settings:** Update `CORS_ALLOWED_ORIGINS` for allowed frontend URLs
- **JWT token lifetime:** Adjust in `.env` file
- **Installed apps:** Add new Django apps to `INSTALLED_APPS`
- **Middleware:** Add custom middleware to `MIDDLEWARE`

### Customizing Frontend Configuration

#### API Base URL
Update `VITE_API_BASE_URL` in `frontend/.env`

#### Styling
- Global styles: Edit `frontend/src/index.css`
- Bootstrap customization: Edit `frontend/src/bootstrap.scss`
- Add custom SCSS: Import in component files

#### Routing
Add new routes in `frontend/src/Router.tsx`

### Database Customization

The default setup uses PostgreSQL with pgvector extension. To use a different database:

1. Update `docker-compose.yml` to use a different image
2. Update `DATABASE_URL` in `.env`
3. Update `psycopg2-binary` in `backend/pyproject.toml` if needed

### CORS Configuration

For development, CORS is configured to allow `http://localhost:5173`. For production or different ports:

1. Edit `backend/backend/settings.py`
2. Update `CORS_ALLOWED_ORIGINS` list
3. Restart the backend server

### Authentication Customization

The boilerplate uses JWT authentication with Djoser. To customize:

- **Token lifetime:** Update `ACCESS_LIFETIME` and `REFRESH_LIFETIME` in `.env`
- **User serializer:** Edit `backend/user/api/serializers.py`
- **Djoser endpoints:** Configure in `backend/backend/settings.py` under `DJOSER`

## Docker Configuration

### Services

The `docker-compose.yml` defines three services:

1. **postgres:** PostgreSQL 16 with pgvector extension
   - Port: 5432
   - Default credentials: `postgres/dev_password`
   - Persistent volume: `bitewise_postgres`

2. **backend:** Django application
   - Port: 8000
   - Auto-reload on code changes
   - Depends on postgres service

3. **frontend:** React application
   - Port: 5173
   - Hot module replacement enabled
   - Node modules cached in volume

### Docker Commands

```bash
# Start all services
docker compose up

# Start with rebuild
docker compose up --build

# Start in detached mode
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f [service_name]

# Execute command in running container
docker compose exec backend python manage.py migrate
docker compose exec frontend bun add axios

# Remove all volumes (deletes database data)
docker compose down -v
```

## Testing

### Backend Tests

The backend uses pytest with pytest-django:

```bash
cd backend

# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov

# Run specific test file
uv run pytest tests/test_user.py

# Run with verbose output
uv run pytest -v
```

### Frontend Tests

Add your preferred testing framework (Vitest, Jest, etc.):

```bash
cd frontend
bun add -d vitest @testing-library/react @testing-library/jest-dom
```

## API Documentation

### Authentication Endpoints

The API uses Djoser for authentication. Available endpoints:

- `POST /auth/users/` - Register new user
- `POST /auth/jwt/create/` - Obtain JWT tokens
- `POST /auth/jwt/refresh/` - Refresh access token
- `POST /auth/jwt/verify/` - Verify token
- `GET /auth/users/me/` - Get current user profile

### API Configuration

The frontend API client is configured in `frontend/src/api/`. Base URL and token handling are managed through:
- `frontend/src/config.ts` - Configuration values from environment variables
- Axios interceptors for automatic token refresh

## Production Deployment

### Backend Production Checklist

1. Set `DEBUG=False` in production environment
2. Generate a strong `SECRET_KEY`
3. Configure `ALLOWED_HOSTS` with your domain
4. Set up proper database (not dev credentials)
5. Configure static file serving
6. Set up HTTPS/SSL
7. Configure proper CORS origins
8. Use environment variables for sensitive data

### Frontend Production Build

```bash
cd frontend
bun run build
```

The production build will be in `frontend/dist/` and can be served with any static file server.

## Troubleshooting

### Port Already in Use

If ports 5173, 8000, or 5432 are already in use:
1. Stop the conflicting service
2. Or update the ports in `docker-compose.yml`

### Database Connection Issues

Ensure PostgreSQL is healthy:
```bash
docker compose logs postgres
```

### Frontend Can't Connect to Backend

1. Verify `VITE_API_BASE_URL` in `frontend/.env`
2. Check backend is running on correct port
3. Verify CORS settings in Django

### Docker Volume Issues

Reset volumes if you encounter persistent issues:
```bash
docker compose down -v
docker compose up --build
```

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Djoser Documentation](https://djoser.readthedocs.io/)

## License

[Add your license here]
