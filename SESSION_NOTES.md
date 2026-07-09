# Eventify — Missing Features Build (Session Notes)

**Date:** 9 July 2026
**Branch:** `vincent`

This document records everything that was checked, built, and changed in this working session: a feature audit against the assignment spec, followed by a full build of every missing feature.

---

## 1. Feature Audit (Starting Point)

The codebase was checked against the full feature checklist. Result before this session:

### ✅ Already implemented (by the team)

| Feature | Location |
|---|---|
| Login (incl. Google) | `src/pages/Login.jsx` |
| Register (incl. organizer) | `src/pages/Register.jsx` |
| Explore Events | `Events.jsx`, `ExploreExternal.jsx` |
| Event Detail | `EventDetail.jsx`, `DetailExternal.jsx` |
| Profile User + Edit Profile | `MyProfile.jsx` (modal) |
| Saved Events | `SavedEvents.jsx` |
| My Tickets | `MyTickets.jsx` |
| Create / My / Edit Event | `CreateEvent.jsx`, `MyEvents.jsx`, `EditEvent.jsx` |
| Checkout + Payment (Midtrans Snap) | inside `EventDetail.jsx` |
| Chat Rooms (list/create/detail/members) | `Community.jsx` |
| Admin: Categories, Events, Discounts, Chat Rooms, Cancellations | `src/pages/admin/*` |

### ❌ Missing (built in this session)

- Forgot Password / Reset Password (link in Login was a dead `href="#"`)
- Feed Posts / Create Post / Post Detail / Edit Post / Comments
- Followers List / Following List
- Point History (only the balance was shown)
- Event Participants
- Transaction History / Transaction Detail
- Ticket Detail (only inline card info existed)
- Admin Users / Admin Transactions / Admin Posts

---

## 2. What Was Built

Everything follows the existing team conventions: client-trust auth (`AUTH_USER` from `src/config/auth.js`, `role`/`user_id` sent in the request), `AppModal` for feedback, Bootstrap 5 styling, Indonesian UI text, API on `http://localhost:5000` (auth on `:3005`).

### 2.1 Forgot & Reset Password

- **Frontend:** `src/pages/ForgotPassword.jsx`, `src/pages/ResetPassword.jsx` (public routes `/forgot-password`, `/reset-password`). The dead "Forgot Password?" link in `Login.jsx` now points to the real page.
- **Backend:** `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` in `server/controllers/user.cjs`, routes in `server/routes/auth.cjs`.
- **How it works:** the reset token is a JWT valid for 15 minutes, signed with `ACCESS_TOKEN_SECRET + current password hash` — so a token automatically becomes invalid once the password changes (single-use). The email is sent through the existing `emailService` (new `sendPasswordResetEmail` template). **Dev mode:** if SMTP is not configured in `.env`, the API returns the reset link directly (`dev_reset_link`) so the flow can still be demoed.

### 2.2 Social Feed Module (posts + comments + follow)

- **New tables:** `posts` and `post_comments`.
  - Models: `server/models/Post.js`, `server/models/PostComment.js` (registered + associated in `models/index.js`).
  - Created automatically on server boot via `Post.sync()` / `PostComment.sync()` in `server.cjs` — no manual migration needed by teammates.
  - A proper migration also exists: `server/migrations/add_posts_tables.cjs`.
- **New API:** `server/controllers/socialController.js` + `server/routes/socialRoutes.js`, mounted at **`/api/social`**:
  - `GET/POST /posts`, `GET/PUT/DELETE /posts/:id` (owner-only edit; owner or admin delete)
  - `POST /posts/:id/comments`, `DELETE /comments/:id`
  - `POST/DELETE /follow`, `GET /users/:id/followers`, `GET /users/:id/following`, `GET /users/:id/follow-stats` (uses the existing `Follow` model, which was defined but unused)
  - Admin: `GET /admin/users`, `PUT /admin/users/:id/role`, `DELETE /admin/users/:id`, `GET /admin/posts`
- **Frontend pages:**
  - `src/pages/Feed/Feed.jsx` — feed list (`/feed`)
  - `src/pages/Feed/CreatePost.jsx` — create post (`/feed/create`)
  - `src/pages/Feed/PostDetail.jsx` — post detail + comments + follow/unfollow the author (`/feed/:id`)
  - `src/pages/Feed/EditPost.jsx` — edit own post (`/feed/:id/edit`)
- "Feed" link added to the main navbar.

### 2.3 Followers / Following

- `src/pages/Connections.jsx` — one page with two tabs, served at `/profile/followers` and `/profile/following`.
- Follow-back button on the followers tab, unfollow button on the following tab.
- Linked from the profile dropdown in the navbar.

### 2.4 Transactions Module

- **New API:** `server/controllers/transactionController.js` + `server/routes/transactionRoutes.js`, mounted at **`/api/transactions`**:
  - `GET /my?user_id=` — user's transaction history
  - `GET /:id?user_id=&role=` — transaction detail (owner or admin)
  - `GET /points/history?user_id=` — point history + current balance
  - `GET /events/:event_id/participants?user_id=&role=` — ticket buyers (event owner or admin)
  - `GET /admin/all?role=admin` — all transactions
- **Frontend pages:**
  - `src/pages/Transactions/TransactionHistory.jsx` (`/transactions`)
  - `src/pages/Transactions/TransactionDetail.jsx` (`/transactions/:id`) — ticket breakdown, discount, points earned, refund status
  - Both linked from the profile dropdown.

### 2.5 Point History

- `src/pages/PointHistory.jsx` (`/profile/points`) — earn/spend list + current balance.
- **Backend fix:** claiming a voucher now writes a `spend` record to `point_histories` (`eventController.claimVoucher`). Previously only ticket purchases > 500k wrote an `earn` record, so the history was incomplete.

### 2.6 Event Participants (organizer)

- `src/pages/Events/EventParticipants.jsx` (`/events/:id/participants`, organizer-only route) — searchable table of buyers: name, email, ticket type, ticket code, status.
- A **"Peserta"** button was added to each row in My Events.

### 2.7 Ticket Detail

- `src/pages/Events/MyTickets.jsx` — each ticket card now has a **"Lihat Detail Tiket"** button that opens a detail modal (event info, date, ticket type, status, entry code).

### 2.8 Admin Dashboard (HomeAdmin)

The previously empty `src/pages/admin/HomeAdmin.jsx` is now a full dashboard:

- **Stat cards:** total users, events, revenue (paid), tickets sold — plus secondary counts for transactions, posts, chat rooms, and vouchers. Every card links to its admin page.
- **"Perlu Perhatian" panel:** pending event approvals, pending cancellation requests, and refunds in progress — highlighted when the count is > 0, each linking to the page where the admin can act.
- **Omzet 7 Hari Terakhir:** a single-hue bar chart (pure CSS, no chart library) of paid revenue per day, with hover tooltips and the peak day labeled.
- **Recent activity:** the 5 latest transactions (user, event, total, status) and 5 newest users.
- **Backend:** `GET /api/transactions/admin/dashboard?role=admin` (`adminGetDashboardStats` in `transactionController.js`) aggregates everything in one `Promise.all`. The posts count is wrapped in a fallback so the dashboard still loads if the new `posts` table hasn't been created yet.

### 2.9 Admin Pages (3 new)

All added to the admin navbar and `AdminRoute`:

- `src/pages/admin/Users.jsx` (`/admin/users`) — search, role filter, change role (user/organizer/admin), soft-delete. Guards: an admin can't change/delete their own account.
- `src/pages/admin/Transactions.jsx` (`/admin/transactions`) — all transactions, revenue (paid) total, status filter, detail modal.
- `src/pages/admin/Posts.jsx` (`/admin/posts`) — post moderation: preview modal + delete (removes its comments too).

---

## 3. Bug Fixes Along the Way

1. **Server could not boot at all:** `server/routes/auth.cjs` requires `../middlewares/organizerLimiter`, but that file did not exist in the repo (probably lost in a merge). Created `server/middlewares/organizerLimiter.js` matching the other rate limiters. ⚠️ Worth telling the team.
2. **Point history never recorded voucher spending** — fixed (see 2.5).

---

## 4. Verification Done

- `node --check` passes on every touched server file.
- `npm run build` (Vite) passes.
- Server boots successfully; every new endpoint responds (500 with DB down, not 404 → routes correctly mounted).
- Association aliases verified against `models/index.js` (gotcha: `Transaction.hasMany(TransactionDetail, { as: "Details" })`, and `belongsTo(User)` aliases are `"User"`).
- **Not verified live:** database queries end-to-end — MySQL (XAMPP) was not running and needs sudo/GUI to start. On first run with MySQL up, the `posts` tables create themselves; click through Feed and one admin page to confirm.

### Environment notes (this Mac)

- Port **5000 is occupied by macOS AirPlay Receiver** (ControlCenter). If the server fails with `EADDRINUSE`, turn off AirPlay Receiver in System Settings or run with another `PORT`.
- Lint (`npm run lint`) fails on pre-existing rules (`import React` unused, set-state-in-effect) across the whole repo — new files match the existing baseline, not a regression.

---

## 5. Files Changed

**New backend:** `models/Post.js`, `models/PostComment.js`, `controllers/socialController.js`, `controllers/transactionController.js`, `routes/socialRoutes.js`, `routes/transactionRoutes.js`, `middlewares/organizerLimiter.js`, `migrations/add_posts_tables.cjs`

**Modified backend:** `models/index.js`, `server.cjs`, `routes/auth.cjs`, `controllers/user.cjs`, `controllers/eventController.js`, `services/emailService.js`

**New frontend:** `pages/ForgotPassword.jsx`, `pages/ResetPassword.jsx`, `pages/PointHistory.jsx`, `pages/Connections.jsx`, `pages/Feed/{Feed,CreatePost,PostDetail,EditPost}.jsx`, `pages/Transactions/{TransactionHistory,TransactionDetail}.jsx`, `pages/Events/EventParticipants.jsx`, `pages/admin/{Users,Transactions,Posts}.jsx`

**Modified frontend:** `routes/AppRoutes.jsx`, `components/Navbar.jsx`, `components/admin/Navbar.jsx`, `pages/Login.jsx`, `pages/Events/MyEvents.jsx`, `pages/Events/MyTickets.jsx`
