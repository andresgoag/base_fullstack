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
