# Trackr — Your job search, organized.

A full-stack job application tracker. Good luck on recruiting season ;) 


<img width="1905" height="907" alt="image" src="https://github.com/user-attachments/assets/7e94c359-70b5-4156-ac8d-7661882c1995" />


## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | Clerk |

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
