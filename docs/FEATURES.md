# Feature → code map

Where each of the 22 backlog features actually lives. Useful when writing the
report, and when a marker asks "show me feature 11".

| # | Feature | Server | Client |
| --- | --- | --- | --- |
| 1 | Multi-category aid request form | `models/AidRequest.js`, `services/RequestService.js#submit` | `pages/RequestAid.jsx` |
| 2 | Location-pinned submission | `models/AidRequest.js` (2dsphere index) | `pages/RequestAid.jsx#captureLocation` |
| 3 | Request status tracking | `services/RequestService.js#track` | `pages/TrackRequest.jsx` |
| 4 | Manual priority override | `services/RequestService.js#setPriority` | `pages/Triage.jsx` |
| 5 | Live shelter occupancy | `models/Shelter.js` (`remainingSpots` virtual) | `pages/PublicShelters.jsx` |
| 6 | Shelter check-ins | `services/ShelterService.js#recordCheckIn` | `pages/SheltersAdmin.jsx` |
| 7 | Amenities checklist and filters | `repositories/ShelterRepository.js#findFiltered` | `pages/PublicShelters.jsx` |
| 8 | Missing persons registry | `models/ShelterOccupant.js`, `repositories/OccupantRepository.js#search` | `pages/FindPeople.jsx` |
| 9 | Multi-warehouse stock tracker | `models/InventoryItem.js`, `models/Warehouse.js` | `pages/Inventory.jsx` |
| 10 | Donation inflow logging | `services/InventoryService.js#logDonation` | `pages/Inventory.jsx` (donations tab) |
| 11 | Visual low-stock flagging | `InventoryItem.isLowStock` virtual, `InventoryRepository#lowStock` | `pages/Inventory.jsx` (`.row-flagged`) |
| 12 | Dispatch order creator | `services/DispatchService.js#create` | `pages/Dispatch.jsx` |
| 13 | Volunteer skill tagging | `models/VolunteerProfile.js` | `pages/Dashboard.jsx` (field profile) |
| 14 | Manual task assignment | `services/TaskService.js#assign`, `VolunteerRepository#findAssignable` | `pages/Tasks.jsx` |
| 15 | Field delivery checklists | `services/TaskService.js#toggleChecklistItem` | `pages/MyTasks.jsx` |
| 16 | Availability toggle | `services/VolunteerService.js#setAvailability` | `pages/Dashboard.jsx` (shift toggle) |
| 17 | SMS template generator | `services/AlertService.js`, `services/channels/` | `pages/Alerts.jsx` |
| 18 | Announcements noticeboard | `services/AnnouncementService.js` | `pages/Noticeboard.jsx` |
| 19 | Delivery route notes | `DispatchOrder.routeNotes`, `DispatchService#setRouteNotes` | `pages/Dispatch.jsx` |
| 20 | Role-based access control | `middleware/authenticate.js`, `middleware/authorize.js` | `components/ProtectedRoute.jsx` |
| 21 | Audit history logs | `models/AuditLog.js`, `services/observers/AuditObserver.js` | `pages/AuditTrail.jsx` |
| 22 | One-click CSV export | `services/ExportService.js` | `pages/AuditTrail.jsx` |

## Cross-feature behaviour worth demoing

- Completing the **last open task** on a request flips the request to Delivered
  (`TaskService#updateStatus`), which fires the Observer chain and writes an audit
  entry without any code in the task service knowing about auditing.
- Creating a **dispatch order against a request** advances that request to
  Dispatched (`DispatchService#updateStatus`).
- Dispatching more stock than exists returns **409 and no partial deduction** —
  any lines already taken are returned (`DispatchService#create`).
