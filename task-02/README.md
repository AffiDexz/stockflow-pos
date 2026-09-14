# ShopFlow

**Techloom.ai Software Engineer Intern Practical Assessment**
**Task 02 — E-Commerce Checkout & Payment System**

> **Live Frontend:** `<https://shopflow-topaz-eight.vercel.app>`
> **Live Backend API:** `<https://shopflow-api-9jix.onrender.com/api>`
> **GitHub Repository:** `<https://github.com/AffiDexz/techloom-assessment>`

---

## Overview

ShopFlow is a customer-facing online store that demonstrates a complete shopping
flow: product discovery → product details → cart → checkout → **stock reservation**
→ **mock payment** → order → **cancellation / refund** → **order history**. Stock is
reserved *before* payment and released correctly on failure, timeout, or expiry,
and inventory is kept consistent using MySQL transactions with row-level locking.

## Features

- Product listing with **search**, **category filter**, **price-range filter**, and **availability filter**
- Product details page with description, price, category, availability, add-to-cart
- Cart with quantity control validated against available stock
- Checkout that **reserves stock before payment** (5-minute reservation)
- Concurrency-safe reservation — no overselling under simultaneous checkouts
- Mock payment: **success**, **failure**, **timeout**, each handled distinctly
- **Duplicate payment / order prevention** via idempotency keys
- Order cancellation with correct stock restoration
- **Refund simulation** when a paid order is cancelled
- **Order history** reflecting real backend state
- Automatic reservation expiry (background job)

## Tech Stack

React.js (Vite) · Node.js · Express.js · MySQL (Prisma ORM) · Tailwind CSS · Jest + Supertest

## Project Structure

```
task-02/
├── backend/
│   ├── prisma/          # schema + migrations + seed
│   ├── src/
│   │   ├── routes/ controllers/ services/ jobs/ middleware/ utils/
│   │   ├── app.js       # Express app (used by tests)
│   │   └── server.js
│   └── tests/           # Jest + Supertest
├── frontend/
│   └── src/ pages/ components/ context/ api/
├── database/
│   └── schema.sql       # full SQL schema (reference)
└── README.md
```

## Database Setup

Uses MySQL. Create a database and apply the schema either way:

```bash
# Option A — Prisma (recommended)
cd backend
npx prisma migrate deploy

# Option B — raw SQL
mysql -u <user> -p <database> < database/schema.sql
```

Tables: `categories`, `products`, `orders`, `order_items`, `reservations`,
`payments`, `refunds` — with foreign keys, a unique `orders.reference`, and a
unique `payments.idempotencyKey`.

## Environment Variables

**backend/.env**
```
DATABASE_URL="mysql://user:password@host:3306/shopflow"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

**frontend/.env**
```
VITE_API_URL="http://localhost:4000/api"
```

## Installation & Running Locally

```bash
# backend
cd backend
npm install
cp .env.example .env        # edit DATABASE_URL
npx prisma migrate deploy
npm run seed                # categories + products
npm run dev                 # http://localhost:4000

# frontend (new terminal)
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:4000/api
npm run dev                 # http://localhost:5173
```

## API Information

```
GET    /api/categories
GET    /api/products?search=&categoryId=&minPrice=&maxPrice=&availability=in_stock|out_of_stock
GET    /api/products/:id
POST   /api/orders                 # checkout: validate + reserve stock
GET    /api/orders                 # order history
GET    /api/orders/:id
POST   /api/orders/:id/payment     # { outcome: success|failure|timeout, idempotencyKey }
POST   /api/orders/:id/cancel      # restore stock; simulate refund if paid
POST   /api/reservations/expire    # manual expiry sweep (demo/testing)
```

## Testing

```bash
cd backend
# point .env.test at a separate test DB, then:
npx prisma migrate deploy
npm test
```

How the major flows work / how to test them:

- **Stock reservation** — `POST /api/orders` opens a transaction, runs
  `SELECT ... FOR UPDATE` on each product row, validates stock while holding the
  lock, then moves stock from `availableStock` to `reservedStock` and creates an
  `ACTIVE` reservation (`expiresAt = now + 5 min`). Because the row is locked,
  two concurrent checkouts can never both take the last unit.
- **Payment success** → order `PAID`, reservation `CONFIRMED`, stock consumed.
- **Payment failure** → order `FAILED`, reservation `RELEASED`, stock restored.
- **Payment timeout** → order `EXPIRED`, reservation `EXPIRED`, stock restored.
- **Duplicate payment prevention** — every payment carries an idempotency key;
  `payments.idempotencyKey` is UNIQUE, so a repeated request replays the original
  result with no second charge, stock change, or duplicate order.
- **Cancellation** — a `RESERVED` order → `CANCELLED` (stock released); a `PAID`
  order → `REFUNDED` (stock restored + refund record created).
- **Refund simulation** — cancelling a paid order creates a `refunds` row with
  status "Simulated Refund Successful"; the order shows as `REFUNDED`.
- **Order history** — `GET /api/orders` reflects real DB state and statuses.

The automated suite covers product discovery/filtering, checkout & insufficient
stock, payment success/failure/timeout, duplicate & concurrent-duplicate
payments, reservation expiry, cancellation, refund, and **concurrency (no
overselling)**.

## Deployment

- **Backend** → Render (build: `npm install && npx prisma generate && npx prisma migrate deploy`, start: `npm start`). Set `DATABASE_URL` and `CORS_ORIGIN`.
- **Frontend** → Vercel (root `frontend/`, build `npm run build`, output `dist`). Set `VITE_API_URL` to `<backend-url>/api`.
- **Database** → any cloud MySQL 8+ (e.g. Aiven).

> Add the live URLs at the top of this file once deployed.
