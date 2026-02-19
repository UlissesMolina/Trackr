# Trackr — Your job search, organized.

A full-stack job application tracker with an AI cover letter generator.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | Clerk |
| AI | OpenAI API |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or a Railway database URL)
- Clerk account (for auth keys)
- OpenAI API key

### Setup

```bash
# 1. Clone and install
git clone <repo-url> trackr && cd trackr
cp .env.example .env   # fill in your keys

# 2. Server
cd server
npm install
npx prisma migrate dev --name init
npm run dev

# 3. Client (new terminal)
cd client
npm install
npm run dev
```

The client runs on `http://localhost:5173` and the server on `http://localhost:3001`.
