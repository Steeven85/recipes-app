# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Prerequisites

- [Node.js](https://nodejs.org/) with npm (Node 18+ is recommended)
- Optional: [Docker](https://docs.docker.com/) and `docker-compose` for container deployment

## Setup

Install the dependencies:

```bash
npm install
```

Environment variables can be placed in `.env` (for development) or `.env.production` (for production builds). Relevant variables include:

- `VITE_API_URL` – backend API base URL used by the Vite dev server
- `VITE_API_TOKEN` – API token if your backend requires one
- `API_URL` – overrides the API URL when running via Docker

## Development server

Start the application in development mode:

```bash
npm run dev
```

## Building for production

Compile the application and preview the build locally:

```bash
npm run build
npm run preview
```

## Docker usage

The project includes a `Dockerfile` and a `docker-compose.yml` for containerized deployment. To build and run the container locally:

```bash
docker-compose up --build
```

You can override the backend API endpoint by setting the `API_URL` environment variable:

```bash
API_URL=http://example.com docker-compose up
```

By default the container exposes the application on port `8081` (configured in `docker-compose.yml`).
