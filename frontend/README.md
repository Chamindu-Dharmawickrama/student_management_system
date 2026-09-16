# Student Management System - Frontend

The frontend for the Student Management System. Built with React, TypeScript, and Vite.

## Tech Stack
- **Framework**: React 19, Vite
- **Language**: TypeScript
- **State Management**: Redux Toolkit & RTK Query
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 (CSS-first architecture)
- **Forms**: React Hook Form with Zod

## Setup Instructions

1. Ensure Node.js (v18+) is installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env` is configured (if applicable, e.g. `VITE_API_URL=http://localhost:8000/api/v1`).
4. Start the development server:
   ```bash
   npm run dev
   ```
5. The application will be available at `http://localhost:5173`.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run lint`: Runs ESLint to check for code issues.
- `npm run preview`: Previews the production build locally.

## Design System & Components

The application follows a strict Design System.
See the `CONTRIBUTING.md` file for architecture rules and styling guidelines.

## Architecture Documentation

Refer to `docs/frontend-prompts/00-MASTER-CONTEXT.md` in the project root for comprehensive architectural ground truths.
