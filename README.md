# CE Ticket App

Contractor Engage ticket operations platform built specifically for CE's TCC/JM workflow.

## Purpose
This app is intended to replace Trello as the operational layer for CE tickets while preserving Gmail as the transport layer for external communication.

## Current State
This is the first working scaffold.

Included in this scaffold:
- Next.js + TypeScript app shell
- Mobile-first dashboard
- Ticket queue screen
- Ticket detail workspace
- External reply vs internal note separation in UI
- Prisma schema for core CE ticket model
- Seed script with realistic CE demo data
- Placeholders for Gmail sync, AI summaries, contractor workflow, quote/invoice model, SLA escalation, and compliance docs vault

## Local Setup
1. Install deps
   npm install
2. Create `.env` from `.env.example`
3. Run Prisma generate/migrate
   npx prisma generate
   npx prisma db push
   npm run db:seed
4. Start app
   npm run dev

## Immediate Next Build Steps
1. Replace mock data with Prisma-backed loaders
2. Add auth/roles
3. Implement Gmail read sync service
4. Implement outbound Gmail reply service using thread IDs
5. Add attachment storage and upload pipeline
6. Add contractor portal / contractor SMS path
7. Add quote/invoice flows
8. Add SLA engine + escalations
9. Add W9/COI compliance review flows
10. Add OpenAI summary/recommendation actions
