# StockFlow POS

**Techloom.ai Software Engineer Intern Practical Assessment**
**Task 01 — POS Order & Inventory System**
_Concurrency-Safe Order & Inventory Management System_

> **Live Frontend:** `<https://stockflow-pos-drab.vercel.app>`
> **Live Backend API:** `<https://stockflow-pos-api.onrender.com/api>`
> **GitHub Repository:** `<https://github.com/AffiDexz/stockflow-pos>`

---

## 1. Project Overview

StockFlow POS is a point-of-sale order and inventory system built to handle many
simultaneous transactions against the same product **without ever overselling**.
It manages products and stock, converts a cart into an order, reserves stock for
5 minutes at checkout, simulates payment outcomes (success / failure / timeout),
prevents duplicate payments, and keeps inventory perfectly consistent using
database transactions with row-level locking.

## 2. Features

- Product CRUD with live available-stock tracking
- Cart → order conversion with stock validation
- **Concurrency-safe checkout** — no overselling under simultaneous requests
- Stock reservation with automatic **5-minute expiry** and stock release
- Mock payment gateway: **success**, **failure**, **timeout**, each handled distinctly
- **Duplicate payment / order prevention** via idempotency keys
- Order lifecycle with enforced status transitions
- Order cancellation with correct stock restoration + refund simulation
- Dashboard with live metrics, order-status breakdown, inventory and recent orders
- Automated tests (Jest + Supertest) including a real concurrency test

## 3. Tech Stack

| Layer     | Technology                                   |
| --------- | -------------------------------------------- |
| Frontend  | React 18, Vite, React Router, Axios, Tailwind CSS, lucide-react |
| Backend   | Node.js, Express                             |
| Database  | MySQL 8+ with Prisma ORM                     |
| Testing   | Jest, Supertest                              |
| Hosting   | Vercel (frontend), Render (backend), any cloud MySQL |

## 4. Architecture Overview

```
stockflow-pos/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # data model
│   │   ├── migrations/          # SQL migration(s)
│   │   └── seed.js              # sample products
│   └── src/
│       ├── app.js               # Express app (used by tests)
│       ├── server.js            # entry point + starts expiry job
│       ├── routes/              # REST route definitions
│       ├── controllers/         # request handling / validation
│       ├── services/            # business logic
│       │   ├── checkoutService.js       # concurrency-safe order creation
│       │   ├── reservationService.js    # reserve / release / expire
│       │   ├── paymentService.js        # mock payment + idempotency
│       │   └── orderService.js          # cancellation
│       ├── jobs/expiryJob.js    # scheduled reservation expiry
│       ├── middleware/          # error handling
│       └── utils/               # helpers, error types
└── frontend/
    └── src/
        ├── pages/               # Dashboard, Products, Cart, Checkout, Orders, ...
        ├── components/          # Sidebar, Topbar, StatusBadge, ...
        ├── context/             # cart + toast state
        └── api/axios.js         # API client
```

Business logic lives in **services** so it can be unit/integration-tested and is
easy to explain. Controllers stay thin (validate → call service → respond).

## 5. Database Structure

- **Product** — `name`, `price`, `availableStock` (free to sell), `reservedStock` (held by active reservations)
- **Cart / CartItem** — a cart and its line items
- **Order / OrderItem** — order header + line items (price snapshotted at purchase)
- **Reservation** — stock held for an order; `status` ACTIVE/CONFIRMED/RELEASED/EXPIRED, `expiresAt`
- **Payment** — one record per payment attempt; `idempotencyKey` is **UNIQUE**

Key rules: foreign keys everywhere, unique constraints on `order.reference` and
`payment.idempotencyKey`, and all inventory/order changes wrapped in transactions
so stock can never go negative or be left inconsistent.

## 6. Setup Instructions

**Prerequisites:** Node.js 18+, a running MySQL 8+ instance.

```bash
# clone
git clone <your-repo-url>
cd stockflow-pos
```

### Backend

```bash
cd backend
npm install
cp .env.example .env        # then edit DATABASE_URL
npx prisma migrate deploy   # create the tables
npm run seed                # optional: sample products
npm run dev                 # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:4000/api
npm run dev                 # http://localhost:5173
```

## 7. Environment Variables

**Backend (`backend/.env`)**

```
DATABASE_URL="mysql://user:password@host:3306/stockflow"
PORT=4000
CORS_ORIGIN="http://localhost:5173"   # your frontend URL in production
```

**Frontend (`frontend/.env`)**

```
VITE_API_URL="http://localhost:4000/api"
```

## 8. Database Migration Instructions

```bash
cd backend
npx prisma migrate deploy   # apply committed migrations (recommended)
# or, to create a new migration after changing schema.prisma:
npx prisma migrate dev --name <change_name>
# quick alternative that syncs schema without migration files:
npx prisma db push
```

## 9 & 10. Running Frontend / Backend

- Backend: `cd backend && npm run dev` (or `npm start` in production)
- Frontend: `cd frontend && npm run dev` (or `npm run build` + `npm run preview`)

## 11. API Overview

**Products**
```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

**Cart**
```
POST   /api/cart
GET    /api/cart/:id
POST   /api/cart/:id/items
PUT    /api/cart/:id/items/:itemId
DELETE /api/cart/:id/items/:itemId
```

**Orders & Payment**
```
POST   /api/orders                 # checkout: validate + reserve stock
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders/:id/cancel
POST   /api/orders/:id/payment     # body: { outcome: success|failure|timeout, idempotencyKey }
```

**Reservations**
```
GET    /api/reservations
POST   /api/reservations/expire    # manually trigger the expiry sweep (demo/testing)
```

**Dashboard**
```
GET    /api/dashboard
```

## 12. How Concurrency Protection Works

This is the core of the assessment. When an order is created, the checkout
service opens a **single database transaction** and, for each product, runs:

```sql
SELECT id, name, price, availableStock FROM products WHERE id = ? FOR UPDATE;
```

`FOR UPDATE` takes an **exclusive row-level lock** on that product. Any other
checkout touching the same product must **wait** until this transaction commits
or rolls back. Only while holding the lock do we read the stock, validate it, and
decrement it — so a competing request can never read a stale value. Product rows
are locked in ascending id order to avoid deadlocks in multi-product orders.

Result: the read → check → write sequence is atomic per product, so two orders
can never both succeed against the same last unit, and stock never goes negative.

**Verified example** (from the automated concurrency test): with stock = 10, one
request for 7 and one for 6 fired simultaneously — exactly one succeeds, the
other is rejected with `409 Insufficient stock`. A burst of 20 concurrent buyers
of 1 unit against stock 10 results in exactly 10 successes.

## 13. How Reservation Expiry Works

At checkout, stock moves from `availableStock` to `reservedStock` and an
`ACTIVE` reservation is created with `expiresAt = now + 5 minutes`. A lightweight
background job (`jobs/expiryJob.js`) runs every 30s and, inside a transaction,
finds `ACTIVE` reservations past their `expiresAt`, marks them `EXPIRED`, returns
the stock to `availableStock`, and moves the order to `EXPIRED`. You can also
trigger the sweep on demand via `POST /api/reservations/expire` (used by the
Reservations page for demos so you don't have to wait 5 minutes).

## 14. How Mock Payment Works

`POST /api/orders/:id/payment` with `outcome`:

| Outcome   | Order status | Reservation | Stock effect        |
| --------- | ------------ | ----------- | ------------------- |
| `success` | PAID         | CONFIRMED   | consumed (sold)     |
| `failure` | FAILED       | RELEASED    | returned to shelf   |
| `timeout` | EXPIRED      | EXPIRED     | returned to shelf   |

Each outcome runs in a transaction so the order, reservation, and stock always
change together.

## 15. How Duplicate Payment Prevention Works

Every payment carries an **idempotency key**, and `Payment.idempotencyKey` is
**UNIQUE** in the database.

- If the same key is seen again, the original result is replayed — no second
  charge, no second stock change, no duplicate order effect.
- If two identical requests race, the unique constraint lets exactly one insert
  win; the loser rolls back and is served the original result.
- A payment against an order that is no longer `RESERVED` (e.g. already `PAID`)
  is rejected as a duplicate/invalid attempt.

## 16. How to Run Tests

```bash
cd backend
# point .env.test at a (separate) test database, then:
npx prisma migrate deploy   # once, against the test DB
npm test
```

Covers product CRUD, order creation & insufficient-stock, cancellation,
reservation creation & expiry, payment success/failure/timeout, duplicate &
concurrent-duplicate payments, and **concurrency (no overselling)**.

## 17. Deployment Instructions

**Backend (Render)** — build: `npm install && npx prisma generate && npx prisma migrate deploy`,
start: `npm start`. Set `DATABASE_URL` (cloud MySQL) and `CORS_ORIGIN` (frontend URL).
A `render.yaml` blueprint is included.

**Frontend (Vercel)** — root `frontend/`, build: `npm run build`, output `dist/`.
Set `VITE_API_URL` to `<backend-url>/api`. `vercel.json` handles SPA routing.

**Database** — any cloud MySQL 8+ (Railway, PlanetScale, Aiven, etc.).

## 18 & 19. Live Links

- Frontend: `<add your Vercel URL>`
- Backend: `<add your Render URL>`
- Repository: `<add your GitHub URL>`

> **Note on the combined Techloom submission:** the assessment asks for both tasks
> in one repo under `/task-01` and `/task-02`. This project is Task 01 — place its
> contents under `/task-01/` in your submission repo.
