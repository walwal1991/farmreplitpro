# Vermifert — متجر سماد الديدان

Arabic/RTL e-commerce platform selling worm-castings fertilizer (vermicompost).

## Stack
- **Monorepo**: pnpm workspace
- **Web**: React + Vite (`artifacts/vermifert`) — Arabic RTL, Tajawal font, earthy palette
- **API**: Express + Drizzle (`artifacts/api-server`)
- **DB**: Postgres (Replit-managed) with `products`, `orders`, `consultations` tables
- **API contract**: OpenAPI in `lib/api-spec`, codegen → `lib/api-client-react`, `lib/api-zod`

## Features
- Public storefront: product catalog, product detail, guest checkout (cash on delivery)
- Multi-language support: Arabic (RTL), English, French via `useLang()` / `t()` hook — all keys in `translations.ts`
- Agronomy consultation form + live chat
- Smart soil diagnosis tool (`/diagnosis`)
- Usage guide (`/guide`)
- **Learn & Train page (`/learn`)**: 7-step worm farm creation guide + 4 training course cards (fully i18n)
- Customer account, order tracking, delivery portal
- Admin dashboard at `/admin` (password gate via `ADMIN_PASSWORD`): stats, recent activity, products CRUD, orders management, consultations management, customer management, reviews
- Generated product images served from `/api/img/<file>.png` (api-server static mount)

## Notable conventions
- Currency: Algerian Dinar (د.ج)
- Admin auth: `requireAdmin` middleware accepts `x-admin-token` header or `Authorization: Bearer`
- Images live in `attached_assets/generated_images/`, exposed via `app.use("/api/img", static(...))`
- All admin endpoints under `/api/admin/*`

## Rewards System
- **Review coupons**: 10% off coupon issued automatically when customer leaves ≥4 stars + ≥20 char review
- **Referral program**: each customer has a unique `REF...` code; referrer gets 15% off, new joiner gets 10%
- Coupons shown in customer dashboard with copy button and expiry date
- Discount code input at checkout with live price preview

## Online Payments (Chargily Pay)
- Algeria-specific gateway supporting **EDAHABIA** (Algérie Poste) and **CIB** (SATIM) cards
- SDK: `@chargily/chargily-pay` installed on api-server
- Flow: Order created → Chargily checkout session created → redirect to Chargily → webhook confirms payment
- Routes: `POST /api/payments/initiate`, `POST /api/payments/webhook`, `GET /api/payments/status/:id`
- Orders table extended with: `payment_method` (cod/online), `chargily_checkout_id`, `payment_status`
- Frontend: payment method toggle (COD vs online) in Checkout.tsx; success/failure pages at `/payment/success` and `/payment/failed`
- Webhook URL: `https://<domain>/api/payments/webhook` — must be configured in Chargily dashboard

## Env
- `DATABASE_URL` (auto)
- `ADMIN_PASSWORD` (set to `admin123`)
- `SESSION_SECRET` (auto)
- `CHARGILY_API_KEY` (test key starts with `test_sk_...`, live with `sk_...`)
