# License Administration System

## Overview
Build a production-ready license management application backed by Lovable Cloud. The first verified signup becomes the administrator through an atomic database operation; later signups receive no access unless an administrator role is granted. Administrator profiles store a display name only, while roles remain in a separate protected table.

## What will be built

### Authentication and access
- Add email/password and Google sign-in, password recovery, sign-out, and session-aware navigation.
- Add a protected administration area; signed-out users are sent to the authentication screen.
- Atomically assign the first registered account the administrator role, preventing simultaneous signups from claiming it twice.
- Enforce administrator authorization again for every server operation, not only in the interface.

### Dashboard and license management
- Build a responsive operations dashboard with total, active, expired, revoked, trial, and unactivated counts.
- Add a searchable, filterable license table covering keys, customers, contact details, type, status, creation/expiration dates, and device state.
- Add real workflows for creating, viewing, copying, editing, extending, revoking, reactivating, resetting devices, and archiving licenses.
- Use confirmations for destructive actions and clear loading, success, empty, and error states.
- Add license detail views with customer, payment, activation, device, and audit history information.

### Database and audit trail
- Create normalized tables for administrator profiles, roles, products, customers, licenses, device activations, audit logs, and API rate-limit buckets.
- Use UUIDs, timezone-aware timestamps, unique secure license keys, searchable indexes, explicit grants, and row-level security.
- Seed one unique browser-extension product identifier, but no mock licenses.
- Derive expiration state from the stored timestamp and authoritative database time rather than a recurring job.
- Record every requested administrative action atomically with relevant before/after details.

### License behavior
- Generate high-entropy readable keys on the server; expiration is never encoded in the key.
- Store a server-verifiable key hash and an encrypted recoverable copy so authorized administrators can copy the same key later without exposing it publicly.
- Support trial, paid, and custom licenses with durations composed from days, hours, minutes, and seconds.
- Start the license term when it is first activated; until then it remains unactivated. Extending preserves the license ID and key and adds time to the current future expiration, or from database time if already expired.
- Bind each license to one device at a time; reset removes that binding without deleting customer or license data.
- Archive rather than hard-delete licenses so audit history remains intact.

### Extension-facing API
- Add a public versioned endpoint for activation, status checks, and deactivation/reset where allowed.
- Validate all request bodies and determine status, expiration, revocation, product match, and device binding on the server.
- Return only the minimum validation result and never return customer or payment data.
- Add database-backed throttling with generic failure responses to reduce brute-force key discovery.

## Interface direction
- Create a focused desktop-first administration workspace that remains fully usable on phones.
- Use a restrained neutral palette with green, amber, and red semantic states; dense tables on large screens and readable stacked rows on small screens.
- Keep primary actions prominent and secondary license actions in concise menus and dialogs.

## Technical details
- Keep TanStack Start file-based routing, with public auth/reset pages and protected routes under the managed authenticated layout.
- Use authenticated server functions for all administration reads and mutations, with schema validation and role checks.
- Use a TanStack public server route for the extension API; do not create an edge function.
- Add database functions for atomic first-admin claiming, license creation/state transitions, device binding, validation, throttling, and audit writes.
- Keep privileged credentials server-only and use the generated Lovable Cloud clients and bearer middleware.
- Add route-specific metadata for every content page and mount notifications once at the application root.

## Verification
- Verify signup, confirmation-aware login, Google login configuration, password reset, protected-route redirects, and sign-out cleanup.
- Verify real license creation and persistence, customer edits, key copying, extension without key changes, revoke/reactivate, device reset, and audit entries.
- Exercise the public API for activation, valid checks, expiration, revocation, wrong product, mismatched device, malformed input, and throttling.
- Run database security checks and confirm unauthorized users cannot read or mutate administration data.
- Check the live interface at desktop and mobile sizes, then confirm the current preview build has no errors.
