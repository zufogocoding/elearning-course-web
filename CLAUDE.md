# Project: Elevate E-Learning Course Web

This document outlines the tech stack, commands, coding conventions, and architectural boundaries for the project.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** Next.js 15+ (App Router, Turbopack enabled)
- **State & UI:** React (hooks, functional components), Lucide Icons
- **Styling:** Tailwind CSS, custom transitions, global styling tokens
- **Helpers:** canvas-confetti, ThemeProvider (light/dark mode)

### Backend (Server)
- **Runtime:** Node.js (Express framework)
- **ORM & Database:** Prisma ORM, PostgreSQL
- **Security:** bcrypt, jsonwebtoken (JWT-based token & cookie authentication)
- **Testing:** Jest (unit and integration tests)

---

## 💻 Commands

### Client (under `/client`)
- **Development Server:** `npm run dev`
- **Build Production:** `npm run build`
- **Start Production:** `npm run start`
- **Lint Check:** `npm run lint`

### Server (under `/server`)
- **Run Tests:** `npm test`
- **Start Server:** `npm start`
- **Development Start:** `npm run dev`
- **Prisma Studio:** `npx prisma studio`
- **Database Migration Push:** `npx prisma db push`

---

## 📏 Code Conventions

### React & TypeScript
- Use functional components with hooks (strictly avoid class-based components except for `ErrorBoundary.tsx`).
- Keep components small, reusable, and co-located with their styles or tests.
- Always use `useRef` for timing instances or stale-closure resolvers inside callback loops.
- Use concurrent fetching (`Promise.all`) when loading independent datasets (e.g., progress and next lesson).
- Avoid exposing server-side credentials (such as environment keys) in client-side scripts. Use server POST routing instead.

### Express & Prisma
- Keep database transactions atomic using Prisma `$transaction` where needed.
- Enforce strict environment verification: development-only helpers (such as `devAutoLogin`) must be explicitly protected by `process.env.NODE_ENV === 'development'`.
- All list endpoints must support pagination.
- Ensure sorting ordering queries are deterministic (always use unique IDs as tie-breakers).
- Soft-delete pattern: keep `deletedAt` check on section, lesson, and question queries.

### Testing Conventions
- Keep mock setups decoupled and clean.
- Ensure new business rules and constraints are explicitly covered with both positive and negative unit test suites.

---

## 🔒 Boundaries
- **Credentials:** Never commit `.env` or sensitive credentials to Git history.
- **Dependencies:** Keep external library inclusions minimum; verify size impact before adding.
- **Review:** All changes must go through correctness, security, performance, and testing verification.
