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

## Screenshots

### Storefront

<p align="center">
  <img src="docs/screenshots/01-home.jpg" alt="Home page" width="85%">
</p>

<table>
  <tr>
    <td align="center"><b>Shop & filters</b><br><img src="docs/screenshots/02-shop-all-products.jpg" alt="Shop" width="100%"></td>
    <td align="center"><b>Product page</b><br><img src="docs/screenshots/04-product-page.jpg" alt="Product page" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Quick view</b><br><img src="docs/screenshots/05-quick-view.jpg" alt="Quick view" width="100%"></td>
    <td align="center"><b>Cart drawer</b><br><img src="docs/screenshots/10-cart-drawer.jpg" alt="Cart drawer" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Cart</b><br><img src="docs/screenshots/11-cart-page.jpg" alt="Cart" width="100%"></td>
    <td align="center"><b>Checkout</b><br><img src="docs/screenshots/12-checkout.jpg" alt="Checkout" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Order confirmation</b><br><img src="docs/screenshots/14-order-confirmation.jpg" alt="Order confirmation" width="100%"></td>
    <td align="center"><b>Track order</b><br><img src="docs/screenshots/06-track-order.jpg" alt="Track order" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>My orders</b><br><img src="docs/screenshots/13-my-orders.jpg" alt="My orders" width="100%"></td>
    <td align="center"><b>Contact & policies</b><br><img src="docs/screenshots/07-contact-and-policies.jpg" alt="Contact" width="100%"></td>
  </tr>
</table>

### Admin panel

<p align="center">
  <img src="docs/screenshots/21-admin-dashboard.jpg" alt="Admin dashboard" width="85%">
</p>

<table>
  <tr>
    <td align="center"><b>Products & stock</b><br><img src="docs/screenshots/22-admin-products-stock.jpg" alt="Products" width="100%"></td>
    <td align="center"><b>Product editor</b><br><img src="docs/screenshots/23-admin-product-editor.jpg" alt="Product editor" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Orders</b><br><img src="docs/screenshots/24-admin-orders.jpg" alt="Orders" width="100%"></td>
    <td align="center"><b>Order detail & delivery</b><br><img src="docs/screenshots/25-admin-order-detail.jpg" alt="Order detail" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Categories</b><br><img src="docs/screenshots/26-admin-categories.jpg" alt="Categories" width="100%"></td>
    <td align="center"><b>Delivery partners</b><br><img src="docs/screenshots/27-admin-delivery-partners.jpg" alt="Delivery partners" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Customers</b><br><img src="docs/screenshots/28-admin-customers.jpg" alt="Customers" width="100%"></td>
    <td align="center"><b>Coupons</b><br><img src="docs/screenshots/29-admin-coupons.jpg" alt="Coupons" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Review moderation</b><br><img src="docs/screenshots/30-admin-reviews.jpg" alt="Reviews" width="100%"></td>
    <td align="center"><b>Inbox</b><br><img src="docs/screenshots/31-admin-inbox.jpg" alt="Inbox" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Store settings</b><br><img src="docs/screenshots/32-admin-store-settings.jpg" alt="Settings" width="100%"></td>
    <td align="center"><b>Admin sign in</b><br><img src="docs/screenshots/20-admin-sign-in.jpg" alt="Admin sign in" width="100%"></td>
  </tr>
</table>

### Mobile

<table>
  <tr>
    <td align="center"><b>Home</b><br><img src="docs/screenshots/40-mobile-home.jpg" alt="Mobile home" width="220"></td>
    <td align="center"><b>Menu</b><br><img src="docs/screenshots/41-mobile-menu.jpg" alt="Mobile menu" width="220"></td>
    <td align="center"><b>Shop</b><br><img src="docs/screenshots/42-mobile-shop.jpg" alt="Mobile shop" width="220"></td>
    <td align="center"><b>Product</b><br><img src="docs/screenshots/43-mobile-product.jpg" alt="Mobile product" width="220"></td>
  </tr>
  <tr>
    <td align="center"><b>Cart</b><br><img src="docs/screenshots/44-mobile-cart.jpg" alt="Mobile cart" width="220"></td>
    <td align="center"><b>Checkout</b><br><img src="docs/screenshots/45-mobile-checkout.jpg" alt="Mobile checkout" width="220"></td>
    <td align="center"><b>Admin dashboard</b><br><img src="docs/screenshots/46-mobile-admin-dashboard.jpg" alt="Mobile admin" width="220"></td>
    <td></td>
  </tr>
</table>

All screenshots are in [`docs/screenshots`](docs/screenshots).

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
