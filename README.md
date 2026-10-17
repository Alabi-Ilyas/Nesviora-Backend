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

## Phase 2: wallet, deposits, withdrawals, investing
Single USD balance per user (stored as integer cents on `User.balanceCents`; the API speaks dollars).
**Wallet/ledger** `GET /api/wallet`, `GET /api/transactions`
**Deposits** `POST|GET /api/deposits` (user submits, status `pending`); admin `GET /api/admin/deposits`,
`PATCH /api/admin/deposits/:id` `{ status: confirmed|failed|cancelled, creditedAmount (USD, required to confirm), note }`
**Withdrawals** `POST|GET /api/withdrawals` (debits amount + fee immediately); admin `GET /api/admin/withdrawals`,
`PATCH /api/admin/withdrawals/:id` `{ status: processing|completed|rejected, hash (required for completed), note }` (rejected refunds)
**Invest** `POST /api/investments` `{ planId, amount, asset? }` (debits amount + plan fee)
**Settings** `GET /api/settings`; super_admin `PATCH /api/admin/settings` `{ fees, minWithdrawal }`
Admin deposit/withdrawal/transaction routes need `finance_admin` (or `super_admin`).
Money moves inside MongoDB transactions, which need a replica set (Atlas is one). Production refuses to start without it.

## Not in Phase 1
Portfolio/trades, return accrual and maturity payouts, 2FA, KYC, email (password reset/verification), notifications, mining plans, referrals.

## Before going live
- Use long random JWT secrets, `NODE_ENV=production`, HTTPS, and set `CLIENT_URL` to the real frontend origin.
- If the frontend and API are on different domains set `COOKIE_SAMESITE=none`.
- Never commit `.env`.
