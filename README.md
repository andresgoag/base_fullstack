# Project Documentation

## Overview

This project is a fullstack application. The `frontend` directory contains a web application built with React, TypeScript, and Vite. It is set up for development with Docker compose.

---

## Frontend Details

- **Framework:** React
- **Language:** TypeScript
- **Build Tool:** Vite
- **Linting:** ESLint
- **Styling:** SCSS (with Bootstrap)
- **Docker:** Development Dockerfile provided (`frontend/Dockerfile.dev`)

## Setup

1. Open a terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   bun install
   ```

## How to Run the project

### 1. Using Docker Compose (Recommended)

From the project root, run:

```bash
docker compose up --build
```

This will build and start all services defined in `docker-compose.yml`

### 2. Manual Run

1. Open a terminal and navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

2. Start the development server:
   ```bash
   bun run dev
   ```

## Linting

To check code quality with ESLint:

```bash
cd frontend
bun run lint
```

## Backend install libraries

```bash
uv add requests
```

## Security

This template stores the JWT refresh token in `localStorage` for simplicity. Any JavaScript running on the page (including a compromised dependency or a reflected XSS bug) can read it. A `Content-Security-Policy` header is set via a `<meta>` tag in `index.html` to restrict script sources and reduce the attack surface.

**For production deployments** consider moving the refresh token to an `HttpOnly; Secure; SameSite=Lax` cookie set by the backend. This makes the token inaccessible to JavaScript and eliminates the XSS exfiltration risk at the cost of requiring CSRF protection on the refresh endpoint.
