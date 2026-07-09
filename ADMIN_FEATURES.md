# Eventify — Admin Panel Documentation

Complete reference for every admin feature: what each page does, which endpoints it uses, and how to test them with EchoAPI/Postman.

---

## How Admin Access Works

There is no token-based admin auth (team convention). The frontend sends the logged-in user's `role` and `user_id` from `src/config/auth.js`:

```js
// src/config/auth.js — switch to this block to act as admin
export const AUTH_USER = {
  id: 1,
  name: "Admin Event",
  role: "admin",
};
```

Every admin endpoint checks `role === "admin"` from the request query/body and returns **403** otherwise. All admin pages live under `/admin/*`, protected by `AdminRoute` (`src/routes/AppRoutes.jsx`), and use the admin `Navbar`/`Footer` from `src/components/admin/`.

**Base URL:** `http://localhost:5000` (events, community, social, transactions).
> Note: on macOS, port 5000 can be occupied by AirPlay Receiver — turn it off in System Settings or run the server with another `PORT`.

---

## 1. Dashboard

| | |
|---|---|
| **Page** | `src/pages/admin/HomeAdmin.jsx` |
| **Route** | `/admin/home` |
| **Endpoint** | `GET /api/transactions/admin/dashboard?role=admin` |

The landing page for admins. Shows:

- **Stat cards** — total users, events, revenue (paid), tickets sold, transactions, posts, chat rooms, vouchers. Each card links to its admin page.
- **Perlu Perhatian** — pending event approvals, pending cancellation requests, refunds in progress. Highlighted when > 0, each linking to the page where you act on it.
- **Omzet 7 Hari Terakhir** — bar chart of daily paid revenue with hover tooltips.
- **Recent activity** — 5 latest transactions and 5 newest users.

---

## 2. Users

| | |
|---|---|
| **Page** | `src/pages/admin/Users.jsx` |
| **Route** | `/admin/users` |

Manage every account on the platform.

**Features:** search by name/email · filter by role · total user count.

**Actions:**
- **Change role** (user ↔ organizer ↔ admin) — modal picker.
- **Delete user** — soft delete (paranoid), the account can be restored by re-registering.
- Guards: an admin cannot change or delete **their own** account.

**Endpoints:**

| Method | URL | Body / Query |
|---|---|---|
| GET | `/api/social/admin/users` | `?role=admin` |
| PUT | `/api/social/admin/users/:id/role` | `{ "role": "admin", "new_role": "organizer" }` |
| DELETE | `/api/social/admin/users/:id` | `{ "role": "admin", "admin_id": 1 }` |

---

## 3. Categories

| | |
|---|---|
| **Page** | `src/pages/admin/Categories.jsx` |
| **Route** | `/admin/categories` |

Full CRUD for categories used by events and chat rooms. Search by name; create/edit via modal; delete with confirmation.

**Endpoints:**

| Method | URL | Body / Query |
|---|---|---|
| GET | `/api/events/categories` | — |
| POST | `/api/events/categories` | `{ "name", "description", "role": "admin" }` |
| PUT | `/api/events/categories/:id` | `{ "name", "description", "role": "admin" }` |
| DELETE | `/api/events/categories/:id` | `{ "role": "admin" }` |

---

## 4. Discounts (Vouchers)

| | |
|---|---|
| **Page** | `src/pages/admin/Discounts.jsx` |
| **Route** | `/admin/discounts` |

Full CRUD for the vouchers users redeem with points in the Voucher Shop (discount %, points required, stock, active period).

**Endpoints:**

| Method | URL | Body / Query |
|---|---|---|
| GET | `/api/events/vouchers/admin-list` | `?role=admin` (includes inactive) |
| POST | `/api/events/vouchers` | voucher fields + `"role": "admin"` |
| PUT | `/api/events/vouchers/:id` | voucher fields + `"role": "admin"` |
| DELETE | `/api/events/vouchers/:id` | `{ "role": "admin" }` |

---

## 5. Events (Moderation)

| | |
|---|---|
| **Page** | `src/pages/admin/Events.jsx` |
| **Route** | `/admin/events` |

View every event from every organizer and moderate it: approve (`published`) or reject (`rejected`) events in `pending_approval`, with status filtering.

**Endpoints:**

| Method | URL | Body / Query |
|---|---|---|
| GET | `/api/events/admin/all-events` | `?role=admin&status=` |
| PATCH | `/api/events/:id/status` | `{ "status": "published", "user_id": 1, "role": "admin" }` |

---

## 6. Transactions

| | |
|---|---|
| **Page** | `src/pages/admin/Transactions.jsx` |
| **Route** | `/admin/transactions` |

Monitor all ticket purchases platform-wide.

**Features:** total transaction count · **revenue (paid) total** · search by user/email/event/ID · filter by payment status · refund status column · detail modal with full ticket breakdown (qty, subtotal, discount, points earned).

**Endpoints:**

| Method | URL | Body / Query |
|---|---|---|
| GET | `/api/transactions/admin/all` | `?role=admin` |
| GET | `/api/transactions/:id` | `?user_id=1&role=admin` |
| GET | `/api/transactions/admin/dashboard` | `?role=admin` (also feeds the Dashboard) |

---

## 7. Posts (Feed Moderation)

| | |
|---|---|
| **Page** | `src/pages/admin/Posts.jsx` |
| **Route** | `/admin/posts` |

Moderate the social feed.

**Features:** search by content/author · comment count per post · preview modal (full content + image) · delete post (cascades to its comments).

**Endpoints:**

| Method | URL | Body / Query |
|---|---|---|
| GET | `/api/social/admin/posts` | `?role=admin` |
| DELETE | `/api/social/posts/:id` | `{ "user_id": 1, "role": "admin" }` |
| DELETE | `/api/social/comments/:id` | `{ "user_id": 1, "role": "admin" }` |

---

## 8. Chat Rooms

| | |
|---|---|
| **Page** | `src/pages/admin/ChatRooms.jsx` |
| **Route** | `/admin/chat-rooms` |

View every community chat room (including ones the admin hasn't joined) and force-delete rooms that violate the rules.

**Endpoints:**

| Method | URL | Body / Query |
|---|---|---|
| GET | `/api/community/admin/all-rooms` | `?role=admin` |
| DELETE | `/api/community/admin/rooms/:chat_room_id` | `{ "role": "admin" }` |

---

## 9. Cancellation Requests

| | |
|---|---|
| **Page** | `src/pages/admin/CancellationRequests.jsx` |
| **Route** | `/admin/cancellation-requests` |

Review organizer requests to cancel their events. Approving cancels the event and triggers the refund flow + email/notification to ticket holders; rejecting requires an admin note.

**Endpoints:**

| Method | URL | Body / Query |
|---|---|---|
| GET | `/api/events/cancellation-requests` | `?user_id=1&role=admin&status=pending&page=1&limit=50` |
| PATCH | `/api/events/cancellation-requests/:request_id/approve` | `{ "user_id": 1, "role": "admin", "admin_note": "..." }` |
| PATCH | `/api/events/cancellation-requests/:request_id/reject` | `{ "user_id": 1, "role": "admin", "admin_note": "..." }` |

---

## Testing with EchoAPI / Postman

Import **`admin-api.postman_collection.json`** (repo root). It's a Postman v2.1 collection — EchoAPI imports it directly (*Import → Postman*).

**Folders:** Categories · Discounts (Vouchers) · Events (Moderation) · Chat Rooms · Cancellation Requests · Users (Admin) · Transactions (Admin) · Posts (Admin)

**Collection variables:**

| Variable | Default | Meaning |
|---|---|---|
| `baseUrl` | `http://localhost:5000` | API server |
| `adminId` | `1` | admin user id |
| `categoryId`, `voucherId`, `eventId`, `chatRoomId`, `requestId`, `userId`, `transactionId`, `postId`, `commentId` | `1` | target ids for the requests |

**Checklist to test:** start MySQL (XAMPP) → start the server (`node server/server.cjs`) → adjust `baseUrl` if you changed the port → fire the GET requests first (they're read-only) → each write request already contains a valid example body.

Expected auth behavior: any request without `role=admin` returns **403** — good first sanity check.

---

## Not Built Yet (known gaps)

- **Organizer Applications approval** — applications land in `organizer_applications` (status `pending`) but there is no admin endpoint/UI to approve them or promote the user to organizer. *(Highest-value next feature.)*
- **Refund Requests processing** — user-initiated refund requests (status `requested`) have no admin page; only cancellation-driven refunds are automated.
- Broadcast announcements, CSV export, API-usage log viewer — nice-to-haves.
