<div align="center">

# All Is Well

**Phone covers & accessories store with a full admin panel**

Storefront · Admin dashboard · Secure REST API · Cash on Delivery · Razorpay-ready

Built by **[Harsh Mandaliya](https://github.com/Harsh-Mandaliya)**

</div>

---

## About

**All Is Well** is an online store for phone covers, screen protectors, watch straps, AirPods cases, MagSafe chargers and power banks.

It has three parts:

- **Storefront**: where customers browse, filter by phone model, add to cart and order with Cash on Delivery.
- **Admin panel**: where the shop owner manages products, stock, orders, delivery partners, coupons, reviews and store settings.
- **API**: a secure backend that holds all the business rules, such as prices, stock, payments and permissions.

The whole project runs locally with free tools only. There are no paid services and no database server to install.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling & animation | Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express 5 |
| Database | Prisma ORM with SQLite (ready to switch to PostgreSQL) |
| Authentication | JWT with bcrypt-hashed passwords |
| Payments | Cash on Delivery; Razorpay integration included (enabled with keys) |
| PDF export | jsPDF + AutoTable |
| Testing | Node test runner + Supertest |

## Features

### Customer storefront
- Home page with hero banner, trending products, shop-by-category grid, featured products, new arrivals and customer reviews
- Shop page with filters (category, phone model, price, stock), sorting and quick view
- Product page with photo gallery, colour and phone-model selection, delivery check and reviews
- Cart drawer, full cart page and "save for later"
- Checkout with saved addresses, coupon codes and live totals
- Order confirmation, order tracking (no login needed) and "My account" with order history

### Admin panel (`/admin`)
- **Dashboard**: revenue chart, order pipeline, recent orders, low-stock alerts and best sellers
- **Products & stock**: add/edit products, photos, colours, compatible models, quick stock +/-, publish/draft
- **Orders**: one-click status flow (Placed → Confirmed → Packed → Shipped → Out for delivery → Delivered), assign delivery partner and tracking number, invoice PDF, packing slip
- **Delivery partners**: couriers and own riders with tracking links
- **Customers, categories, coupons, reviews, inbox and store settings**
- **Exports**: CSV and PDF for orders and products

### Security
- Prices, totals and payment status are always calculated on the server
- Online payments verified by signature and amount (Razorpay)
- Rate limiting on login, orders, lookups and forms
- Input cleaning, output escaping, CSV-injection protection, safe file uploads
- Admin role re-checked on every request; security headers on every response
- 26 automated tests cover these rules

## Getting started

**Requirements:** Node.js 20 or newer.

```bash
# 1. Clone
git clone https://github.com/Harsh-Mandaliya/Phone-Cover-Store.git
cd Phone-Cover-Store

# 2. Create local settings from the templates
cp api/.env.example api/.env        # Windows: copy api\.env.example api\.env
cp web/.env.example web/.env.local  # Windows: copy web\.env.example web\.env.local

# 3. Install everything, create the database and load demo data
npm run setup

# 4. Start the API and the website
npm run dev
```

| | URL |
|---|---|
| Store | http://localhost:3000 |
| Admin panel | http://localhost:3000/admin |
| API | http://localhost:4000 |

**Demo accounts** (local only, change them before going live):

| Role | Email | Password |
|---|---|---|
| Admin | admin@alliswell.local | Admin@123 |
| Customer | riya@example.com | customer123 |

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start API + website together |
| `npm run setup` | First-time install, database and demo data |
| `npm run db:reset` | Reset the database to demo data |
| `npm --prefix api test` | Run the API and security tests |
| `npm --prefix api run studio` | Browse the database in a visual editor |

## Project structure

```
Phone-Cover-Store/
├── api/                    Backend (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma   Database models
│   │   ├── seed.ts         Demo data
│   │   └── photos.ts       Product photo links
│   ├── src/
│   │   ├── app.ts          Express app setup
│   │   ├── lib.ts          Database, auth and shared helpers
│   │   ├── security.ts     Rate limiting, headers, input cleaning
│   │   ├── payments.ts     Razorpay integration
│   │   └── routes/         auth, store and admin endpoints
│   └── tests/              Automated API tests
└── web/                    Frontend (Next.js)
    ├── app/(store)/        Storefront pages
    ├── app/admin/          Admin panel pages
    ├── components/         UI components
    └── lib/                API client, formatting, PDF export
```

## Configuration

Settings live in `api/.env` (copied from `api/.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Database location (SQLite file by default) |
| `JWT_SECRET` | Secret used to sign logins: use a long random value |
| `API_PORT` | API port (default `4000`) |
| `WEB_URL` | Website address allowed to call the API |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Turn on online payments (optional) |
| `TRUST_PROXY` | Set to `1` when hosted behind a proxy |

Store name, contact details, shipping fee, free-shipping limit and Cash on Delivery can be changed from **Admin → Store Settings**.

## Roadmap

- [ ] Deploy website (Vercel) and API (Render / Railway)
- [ ] Move database to PostgreSQL (Neon / Supabase)
- [ ] Enable Razorpay live payments
- [ ] Send real order emails (Resend / SMTP)
- [ ] Store product images on Cloudinary

## Credits

Product and lifestyle photos are from [Pexels](https://www.pexels.com/license/) (free to use).

## Author

**Harsh Mandaliya**
GitHub: [@Harsh-Mandaliya](https://github.com/Harsh-Mandaliya)

---

© 2026 Harsh Mandaliya. All rights reserved.
