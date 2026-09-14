# Techloom.ai — Software Engineer Intern Practical Assessment

> Submission by **Mohamed Affan** · Full-stack (React · Node/Express · MySQL/Prisma)

This repository contains both assessment tasks, each a complete, independently
deployed full-stack application with a concurrency-safe order and payment engine.

---

## 🧾 Task 01 — StockFlow POS
**Concurrency-Safe Order & Inventory Management System**

A point-of-sale system that processes many simultaneous transactions against the
same product **without ever overselling** — using MySQL transactions with
row-level locking (`SELECT ... FOR UPDATE`), 5-minute stock reservations,
mock payments, and idempotent duplicate-payment prevention.

| | |
|---|---|
| 📁 Code | [`/task-01`](./task-01) |
| 🌐 Live App | https://stockflow-pos-drab.vercel.app |
| 🔌 Live API | https://stockflow-pos-api.onrender.com/api |

---

## 🛒 Task 02 — ShopFlow
**E-Commerce Checkout & Payment System**

A customer-facing storefront covering the full shopping flow: product discovery
with search & filters → product details → cart → checkout with stock reservation
→ mock payment (success / failure / timeout) → order cancellation with
**refund simulation** → order history.

| | |
|---|---|
| 📁 Code | [`/task-02`](./task-02) |
| 🌐 Live App | https://shopflow-topaz-eight.vercel.app |
| 🔌 Live API | https://shopflow-api-9jix.onrender.com/api |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MySQL 8 (Prisma ORM) |
| Testing | Jest, Supertest |
| Hosting | Vercel (web) · Render (API) · Aiven (MySQL) |

## 📂 Repository Structure

techloom-assessment/
├── task-01/ # StockFlow POS — POS order & inventory system
└── task-02/ # ShopFlow — e-commerce checkout & payment system


Each task folder has its own **README** with full setup, API reference,
testing steps, and deployment notes.

---

## ✨ Key Engineering Highlights

- **No overselling under concurrency** — verified with automated tests firing
  simultaneous checkout requests against limited stock.
- **Stock reserved before payment**, auto-released on failure, timeout, or a
  5-minute expiry (background job).
- **Idempotent payments** — a unique key guarantees no duplicate charges or orders.
- **Transaction-safe** — inventory and order state never left inconsistent.