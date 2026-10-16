# Nesviora backend - Phase 1

Express + MongoDB (Mongoose). Auth, investment plans, testimonials, support chat, admin views.

## Run
```
cp .env.example .env     # fill in MONGODB_URI and the two JWT secrets
npm install
npm run seed:admin       # creates the first super admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev
```

## Response shape
`{ success: true, data, meta? }` or `{ success: false, message, details? }`.
Auth: `Authorization: Bearer <accessToken>`; refresh token is an httpOnly cookie
(`POST /api/auth/refresh`), so the frontend must send requests with `credentials: 'include'`.

## Endpoints
**Auth** `POST /api/auth/register | login | refresh | logout | change-password`, `GET /api/auth/me`
**Profile** `PATCH /api/users/me`
**Plans (public)** `GET /api/plans`, `GET /api/plans/:id`
**Investments (own, read-only)** `GET /api/investments`, `GET /api/investments/:id`
**Testimonials (public)** `GET /api/testimonials`
**Support (user)** `POST|GET /api/support/tickets`, `GET /api/support/tickets/:id`, `POST /api/support/tickets/:id/messages`

**Admin** (all under `/api/admin`, admin token required)
- `GET /users`, `GET /users/:id`, `PATCH /users/:id/status`, `GET /users/:id/investments`
- `GET /investments`
- `GET|POST /plans`, `PATCH|DELETE /plans/:id`
- `POST /testimonials`, `PATCH|DELETE /testimonials/:id`
- `GET /support/tickets`, `GET /support/tickets/:id`, `POST /support/tickets/:id/messages`, `PATCH /support/tickets/:id/status`

Admin sub-roles: super_admin (everything), ops_admin, finance_admin (plans, investments),
content_admin (testimonials), support_admin (chat). See `src/routes/admin.routes.js`.

## Not in Phase 1
Deposits, withdrawals, wallet addresses, approvals, portfolio/trades, creating investments,
KYC, email (password reset/verification), notifications, mining plans, referrals.

## Before going live
- Use long random JWT secrets, `NODE_ENV=production`, HTTPS, and set `CLIENT_URL` to the real frontend origin.
- If the frontend and API are on different domains set `COOKIE_SAMESITE=none`.
- Never commit `.env`.
