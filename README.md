LarahBigDeck — A fast, lightweight learning / flashcard web app built with Vite, TypeScript and React.

This repository contains the frontend application and supporting documentation for MyBigDeck. It uses modern tools and conventions (Vite, TypeScript, Tailwind CSS, and shadcn-ui) to provide a responsive study experience.

## Project overview

- Purpose: a client-side SPA for creating, studying, and managing flashcard decks. The codebase focuses on developer ergonomics and fast local development.
- Contents: frontend source in `src/`, documentation and guides at the repository root, and backend-related notes and migrations in `supabase/` and other docs.

## Tech stack

- Vite (build/dev tooling)
- TypeScript
- React
- Tailwind CSS
- shadcn-ui (component primitives)

## Prerequisites

- Node.js (LTS recommended) and npm installed. You can manage Node versions with nvm or other managers.

## Quick start (development)

Open a terminal (PowerShell on Windows) and run:

```powershell
# clone the repository
git clone <YOUR_GIT_URL>

# change into the project directory
cd mybigdeck_app

# install dependencies
npm install

# start the dev server (Vite) with hot reload
npm run dev
```

After the dev server starts, open the URL shown in the terminal (usually http://localhost:5173).

## Available scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — produce a production build
- `npm run preview` — locally preview a production build

(See `package.json` for the full script list and any additional commands.)

## Project structure (high level)

- `src/` — frontend source code (components, pages, services, utils)
- `public/` — static assets
- `supabase/` — SQL migrations and storage policy scripts
- documentation files (e.g., `BACKEND_README.md`, `SUPABASE_SETUP.md`) — high-level project and backend instructions

## Backend & integrations

This repository includes docs and SQL migrations for a Supabase backend (see the `supabase/` folder and `SUPABASE_SETUP.md`). The frontend expects an API and auth endpoints; consult `BACKEND_README.md` and `AUTHENTICATION_GUIDE.md` in the repo for backend setup and environment variables.

## Contributing

Contributions are welcome. Recommended steps:

1. Fork the repository and create a feature branch.
2. Keep changes focused and small; include tests where appropriate.
3. Open a pull request describing your changes and any setup steps.

Please read the repository docs (for example `SETUP_CHECKLIST.md`, `TESTING_GUIDE.md`) before submitting larger changes.

## Troubleshooting & common tasks

- If you see missing environment values, check the repository docs for required environment variables and backend setup.
- If the dev server fails to start, run `npm install` again and verify your Node version.

## Next steps & suggestions

- Add CI (GitHub Actions) to run lint, build and tests on PRs.
- Add a short demo GIF or screenshot to this README to help new visitors quickly understand the app.

## References & docs in this repository

- `BACKEND_README.md` — backend-specific instructions
- `SUPABASE_SETUP.md` — Supabase setup and migrations
- `AUTHENTICATION_GUIDE.md` — authentication flow and notes
- `TESTING_GUIDE.md` — testing recommendations


