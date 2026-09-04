# DisasterAid

Relief coordination platform for disaster response: aid requests, shelter capacity,
supply inventory, volunteer dispatch, and public communication in one system.

Course project for CSE470 (Software Engineering), BRAC University.

## What it does

**For people affected by a disaster**

Submit an aid request with categories, quantities, and a GPS pin, 
Track that request from pending through to delivered with a tracking code, 
See which shelters have space and what facilities they have, 
Search the safety registry to find family members who reached a shelter, 
Read official notices from the coordination team, 

**For relief managers**

- Triage the request queue and set priority manually
- Open shelters, log arrivals and departures, register occupants
- Track stock across warehouses, log donations, watch low-stock flags
- Build dispatch orders that deduct stock and carry route notes for drivers
- Assign tasks to on-shift volunteers and follow their progress
- Generate alert messages from templates, publish notices, export CSVs

**For volunteers**

- Set skills and toggle on or off shift
- Work a mobile-friendly checklist for each assigned task

## Stack

- **Client** — React 18, Vite, React Router
- **Server** — Node, Express, Mongoose
- **Database** — MongoDB
- **Auth** — JWT access tokens, bcrypt password hashing

The admin comes from `seed:admin` using the values in `.env`.

## Architecture

Client–server, with four closed layers on the server. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

```
routes + controllers   presentation   HTTP in, JSON out
services               business       rules and decisions
repositories           persistence    every query lives here
models (Mongoose)      database       schema and indexes
```

## Design patterns

| Pattern | Type | Where |
| --- | --- | --- |
| Singleton | Creational | `server/src/config/database.js` — one connection pool per process |
| Repository | — | `server/src/repositories/` — all data access behind named methods |
| Observer | Behavioural | `server/src/services/observers/` — request status changes notify the audit trail and the alert desk |
| Adapter | Structural | `server/src/services/channels/` — one `MessageChannel` interface, clipboard and Twilio adapters behind it |

## API

| Area | Routes |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET/PATCH /api/auth/me` |
| Users | `GET /api/users`, `PATCH /api/users/:id/role`, `PATCH /api/users/:id/status` |
| Requests | `POST /api/requests`, `GET /api/requests/track/:code`, `GET /api/requests`, `PATCH /api/requests/:id/status`, `PATCH /api/requests/:id/priority` |
| Shelters | `GET /api/shelters`, `GET /api/shelters/registry/search`, `POST /api/shelters`, `POST /api/shelters/:id/check-in`, `POST/GET /api/shelters/:id/occupants` |
| Inventory | `GET/POST /api/inventory/warehouses`, `GET/POST /api/inventory/stock`, `GET /api/inventory/stock/low`, `GET/POST /api/inventory/donations`, `GET/POST /api/inventory/dispatches`, `PATCH /api/inventory/dispatches/:id/status`, `PATCH /api/inventory/dispatches/:id/route-notes` |
| Volunteers | `GET/PATCH /api/volunteers/me`, `PATCH /api/volunteers/me/availability`, `GET /api/volunteers`, `GET /api/volunteers/assignable`, `GET/POST /api/volunteers/tasks`, `PATCH /api/volunteers/tasks/:id/assign`, `PATCH /api/volunteers/tasks/:id/status`, `PATCH /api/volunteers/tasks/:id/checklist/:index` |
| Communication | `GET/POST /api/comms/announcements`, `DELETE /api/comms/announcements/:id`, `GET /api/comms/alerts/templates`, `POST /api/comms/alerts` |
| Administration | `GET /api/admin/summary`, `GET /api/admin/audit`, `GET /api/admin/export/:dataset` |


