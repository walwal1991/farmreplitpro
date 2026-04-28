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

## Env
- `DATABASE_URL` (auto)
- `ADMIN_PASSWORD` (set to `admin123`)
- `SESSION_SECRET` (auto)
