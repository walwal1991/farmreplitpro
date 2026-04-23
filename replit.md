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
- Agronomy consultation form
- Admin dashboard at `/admin` (password gate via `ADMIN_PASSWORD`): stats, recent activity, products CRUD, orders management, consultations management
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
