# DisasterAid — Product Backlog

All 22 features, grouped into the parts they ship in. Each part is one sprint, one
integration branch, one demo.

Members are labelled A–D. Swap in real names before the first sprint planning.

---

## Part 1 — Foundation ✅

**Feature 20 — Role-Based Access Control**

Shipped. `authenticate` + `authorize(...roles)` on the server, `ProtectedRoute` on
the client, four roles, admin-only role changes, seeded first admin.

**Pattern:** Singleton (`config/database.js`), Repository (`BaseRepository`).

---

## Part 2 — Requests & Needs

Features 1–4. This is the core of the product; everything downstream consumes it.

| # | Feature | Owner |
| --- | --- | --- |
| 1 | Multi-category aid request form | A |
| 2 | Location-pinned submission (HTML5 Geolocation) | A |
| 3 | Request status tracking | B |
| 4 | Manual priority override / triage | B |

**Model — `AidRequest`**

```
requester      ref User (nullable — allow phone-only submissions)
contactPhone   String, required
categories     [{ type: FOOD|WATER|SHELTER|MEDICAL|CLOTHING, quantity: Number }]
location       { type: 'Point', coordinates: [lng, lat] }   // 2dsphere index
address        String
notes          String
status         PENDING | ASSIGNED | DISPATCHED | DELIVERED | CANCELLED
priority       CRITICAL | HIGH | MEDIUM | LOW
trackingCode   String, unique, indexed
statusHistory  [{ status, changedBy, changedAt, note }]
```

**Endpoints**

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/requests` | public |
| GET | `/api/requests/track/:code` | public |
| GET | `/api/requests` | manager, admin |
| PATCH | `/api/requests/:id/status` | manager, admin, assigned volunteer |
| PATCH | `/api/requests/:id/priority` | manager, admin |

**Screens** — request form (public), tracking lookup (public), triage queue (manager).

**Pattern: Observer.** `AidRequest` is the subject. When status changes, it notifies
registered observers without knowing who they are: an audit-log observer (feature 21),
a notice observer (feature 18), and later an SMS observer (feature 17). Put the subject
in `services/RequestStatusSubject.js` and observers in `services/observers/`.

> The coordinate order is `[longitude, latitude]` — GeoJSON, not the order the
> browser hands you. Getting this backwards puts every request in the wrong hemisphere.

---

## Part 3 — Shelters & Evacuation Hubs

Features 5–8.

| # | Feature | Owner |
| --- | --- | --- |
| 5 | Live occupancy dashboard | C |
| 6 | Facility check-ins | C |
| 7 | Amenities checklist / filters | D |
| 8 | Missing persons & safety registry | D |

**Models**

```
Shelter        name, address, location, maxCapacity, currentHeadcount,
               amenities [POWER|MEDICAL|HALAL_MEALS|PET_FRIENDLY|WHEELCHAIR|WIFI],
               manager ref User, isOpen

CheckInLog     shelter ref, delta Number (+in / −out), recordedBy ref User,
               reason, createdAt

ShelterOccupant shelter ref, fullName, hometown, ageGroup, checkedInAt,
                checkedOutAt (null while present)
```

Derive `remainingSpots` as `maxCapacity − currentHeadcount` rather than storing it.
Update `currentHeadcount` inside the check-in service so the log and the count can
never disagree.

**Endpoints** — `GET /api/shelters` (public, filterable by amenity),
`POST /api/shelters` (manager), `POST /api/shelters/:id/check-in` (shelter manager),
`GET /api/shelters/registry/search?name=` (public), `POST /api/shelters/:id/occupants`.

**Privacy note for the report:** the safety registry is a searchable list of
displaced people. Return name, hometown, and shelter only — never phone numbers
or exact ages. Worth a paragraph in your non-functional requirements.

---

## Part 4 — Inventory & Supply Chain

Features 9–12.

| # | Feature | Owner |
| --- | --- | --- |
| 9 | Multi-warehouse stock tracker | A |
| 10 | Donation inflow logging | B |
| 11 | Visual low-stock flagging | A |
| 12 | Dispatch order creator | C |

**Models**

```
Warehouse      name, location, address, manager ref User

InventoryItem  warehouse ref, name, category, unit, quantity, lowStockThreshold
               (compound unique index on warehouse + name)

Donation       warehouse ref, donorName, donorType CITIZEN|NGO|GOVT,
               items [{ name, quantity, unit }], loggedBy ref User

DispatchOrder  destinationType SHELTER|REQUEST, destination ref,
               items [{ inventoryItem ref, quantity }],
               status DRAFT|DISPATCHED|DELIVERED, routeNotes String,
               createdBy ref User
```

**The hard part:** creating a dispatch order subtracts stock, and two managers
dispatching the same crate at once must not drive quantity negative. Do the decrement
with a conditional update in the repository:

```js
this.model.findOneAndUpdate(
  { _id: itemId, quantity: { $gte: amount } },
  { $inc: { quantity: -amount } },
  { new: true }
);
```

A `null` return means insufficient stock — throw a 409 from the service. Mention this
in your report; it is a real concurrency argument, not a made-up one.

Low-stock flagging is a virtual (`quantity <= lowStockThreshold`), computed on read.
No cron job needed.

---

## Part 5 — Volunteers & Field Operations

Features 13–16.

| # | Feature | Owner |
| --- | --- | --- |
| 13 | Skill tagging at onboarding | D |
| 14 | Manual task assignment panel | B |
| 15 | Field task delivery checklists | D |
| 16 | Availability toggle | C |

**Models**

```
VolunteerProfile  user ref (unique), skills [DRIVER|FIRST_AID|HEAVY_LIFTING|
                  COOKING|TRANSLATION], isAvailable Boolean, activeTaskCount

Task              title, description, relatedRequest ref, relatedDispatch ref,
                  assignedTo ref User, assignedBy ref User,
                  status PENDING|IN_PROGRESS|COMPLETED,
                  checklist [{ label, done }], dueAt
```

The assignment dropdown should only list volunteers where `isAvailable` is true and
the account is active — that filter belongs in `VolunteerRepository.findAssignable()`,
not in the React component.

Task completion feeds back into Part 2: completing the last task on a request flips
that request to `DELIVERED`, which fires the Observer chain again.

---

## Part 6 — Coordination & Communication

Features 17–19.

| # | Feature | Owner |
| --- | --- | --- |
| 17 | SMS template generator | A |
| 18 | Official announcements noticeboard | B |
| 19 | Delivery driver route notes | C |

**Pattern: Adapter.** Define a `MessageChannel` target interface with `send(recipient, body)`.
Ship a `ClipboardAdapter` that formats copy-pasteable text (what the feature actually
asks for), and write a stub `TwilioAdapter` against the same interface to prove the
calling code never changes. That is the whole point of the pattern and it demos in
thirty seconds.

```
services/channels/MessageChannel.js      target interface
services/channels/ClipboardAdapter.js    adaptee: manual copy-paste flow
services/channels/TwilioAdapter.js       adaptee: third-party SDK, stubbed
```

Route notes (19) are a field on `DispatchOrder` — small, but it belongs to whoever
owns dispatch so the two do not collide.

**Model — `Announcement`:** title, body, severity `INFO|WARNING|URGENT`,
publishedBy, publishedAt, expiresAt. Public GET, admin-only POST.

---

## Part 7 — Analytics & Administration

Features 21–22.

| # | Feature | Owner |
| --- | --- | --- |
| 21 | Audit history logs | D |
| 22 | One-click CSV export | A |

**Model — `AuditLog`:** actor ref User, action, entityType, entityId, summary,
createdAt (indexed descending).

Most entries write themselves if you added the audit observer back in Part 2 —
that is the payoff for setting up Observer early rather than sprinkling
`AuditLog.create()` through every service.

CSV export streams three files: current inventory, active requests, shelter occupancy.
Build the rows in a service and set `Content-Disposition: attachment`.

---

## Sequencing

Parts must ship in order — 3 needs shelters to exist before dispatch can target them,
5 needs requests to attach tasks to, 7 needs the observer from 2.

Within a part, the four slices are independent. Take one each, branch from `develop`,
merge as you finish. Nobody waits.

## Per-sprint checklist

- [ ] Sprint planning: pick the part, split the four slices, estimate in points
- [ ] Branch per feature: `feature/<number>-<slug>`
- [ ] Every new route has `authorize()` unless it is deliberately public
- [ ] Every new query lives in a repository, not a service
- [ ] Update `docs/ARCHITECTURE.md` if a pattern lands this sprint
- [ ] Sprint review: demo against a fresh database
- [ ] Retrospective note in `docs/sprints/sprint-N.md`
