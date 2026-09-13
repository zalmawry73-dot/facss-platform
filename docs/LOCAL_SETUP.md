# Local Development Setup Guide

---

## 1. Prerequisites
- **Node.js:** v18, v20, or v22+
- **npm:** v9+ or v10+
- **PostgreSQL:** Version 14, 15, or 16 (Local service, Docker, or PostgreSQL Cluster)

---

## 2. Step-by-Step Installation

### Step 1: Extract or Clone Repository
Ensure the project is in a dedicated folder without spaces if possible.

### Step 2: Install Node Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` points to your active PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/facss_db?schema=public"
```

### Step 4: Synchronize Database Schema
```bash
npx prisma db push
```

### Step 5: Seed Development Data
```bash
node scripts/seed.js
```

### Step 6: Start Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 3. Production Build & Execution
To test the production build locally:
```bash
npm run build
npm start
```
