# DisasterAid — Architecture

## Architectural style

**Client–server**, with a **layered** server.

The React client and the Express API are separate processes that talk over HTTP/JSON.
The client never touches MongoDB; the database sits on an internal network behind
the API. Advantages and trade-offs are the standard ones for this style: the server
can be distributed or moved to a managed host, but each service is a single point of
failure and response time depends on the network as well as the code.

```
Browser  ──HTTPS──▶  Express API  ──internal──▶  MongoDB
(React)              (Node)                     (Mongoose)
```

## Layers on the server

Each layer only calls the one below it. That rule is what keeps the parts testable
and replaceable.

| Layer | Folder | Responsibility | Must not |
| --- | --- | --- | --- |
| Presentation | `routes/`, `controllers/`, `middleware/` | Parse the request, call a service, format the response | Contain business rules or queries |
| Business | `services/` | Rules, permissions, orchestration | Import Mongoose or touch `req`/`res` |
| Persistence | `repositories/` | Every database query, named | Contain business rules |
| Database | `models/` | Schema, indexes, hooks | Know about HTTP |

The layers are **closed**: a controller cannot skip the service and call a repository
directly. It costs an extra file per feature and buys the ability to change the
database or the transport without rewriting the rules.

## Patterns in use

**Singleton** — `config/database.js`. One connection pool per process, created lazily
on first use. A second pool would waste sockets and split connection state.

**Repository** — `repositories/`. Services depend on `userRepository.findByEmail(...)`,
not on `User.findOne({ email })`. Swapping Mongoose for something else means rewriting
one folder.

**Observer** *(arrives in Part 2)* — request status changes will notify subscribers:
the assigned volunteer, the noticeboard, the audit log. Subject = the aid request,
observers = the channels that care about it.

**Adapter** *(arrives in Part 6)* — the SMS template generator will sit behind a target
interface so a real gateway can be dropped in without changing the calling code.

## Request lifecycle

Registering a volunteer, end to end:

1. React posts `{ name, email, phone, password, role }` to `/api/auth/register`.
2. `express-validator` rules reject malformed input with `422` and per-field messages.
3. `AuthService.register` checks for a duplicate email, forces the role down to a
   self-assignable one, and asks the repository to create the user.
4. The model's `pre('save')` hook hashes the password with bcrypt (cost 12).
5. The service signs a JWT and returns the user without the password hash.
6. The controller responds `201`; the client stores the token and the context holds
   the user in memory.

## Authentication vs authorization

Two separate middlewares, deliberately:

- `authenticate` answers *who is this?* — verifies the JWT and loads the current user.
- `authorize(...roles)` answers *are they allowed?* — checks the role on that user.

The role is read from the database on every request rather than trusted from the
token, so demoting someone takes effect immediately instead of when their token
expires. Guards in React only hide screens; the API is where access is enforced.

## Roles

| Role | Can |
| --- | --- |
| `PUBLIC` | Submit aid requests, track their own request status |
| `VOLUNTEER` | See assigned tasks, update task state, set availability |
| `SHELTER_MANAGER` | Log check-ins/check-outs and maintain the safety registry on existing shelters |
| `RELIEF_MANAGER` | Triage requests, manage inventory, open/configure shelters, assignments |
| `ADMIN` | Everything, plus changing roles |

Registration only ever grants `PUBLIC` or `VOLUNTEER`. Manager, shelter-manager, and
admin come from an existing admin, which is why the repo ships a seed script for the
first one.

`SHELTER_MANAGER` covers exactly the SRS's FR-06/FR-08 duties (check-ins, occupant
registry) on shelters that already exist; opening a *new* shelter (`POST /shelters`)
stays with `RELIEF_MANAGER`/`ADMIN`, since that's a capacity-planning decision, not a
day-to-day operation. `RELIEF_MANAGER` and `ADMIN` can still do everything a shelter
manager can — nobody loses access, the role only adds a narrower option.
