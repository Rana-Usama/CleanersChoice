# Cleaner Work Hours and Earnings Flow

Step 1 specification, recorded 7 October 2026. This defines behavior for the staged integration; it does not enable work tracking in the app. The agreed rules come from the monthly stats PDF and the subsequent corrections. Edge-case defaults below are implementation decisions made for step 1.

## Core rules

- Work sessions add hours only. They never create payments, mark invoices paid, or change invoice amounts.
- Collected money comes from existing invoice logic: `paymentStatus === 'paid'` and a valid `paidAt`. Recognition belongs to the paid month, even if work happened in another month.
- Only confirmed sessions contribute to confirmed hours. Pending estimates, running time, and discarded records remain separate.
- One active session per cleaner across all devices. An unresolved automatically stopped session blocks another clock-in until resolved. A pending manual record does not block clock-in, provided it does not overlap.
- Breaks use clock-out and clock-in. There is no paused state or Take a break button.
- The cleaner confirms their own manual and recovered records. No admin approval queue is required.
- Preserve session history when jobs change, disappear, or the subscription expires.

## Clock eligibility and access

New clock-ins require a signed-in cleaner with active subscription access according to the existing shared entitlement predicate. Customers cannot start or modify work sessions. A job-linked clock-in also requires the cleaner to be the assigned `confirmedCleaner` and the job to be `confirmed`.

Clock-in without a job is available to an eligible cleaner. This records general work immediately without requiring a job search. It does not imply a customer assignment, invoice, or payment.

The server must validate eligibility and reserve the cleaner's active-session slot atomically. A double tap, retry, or second device must not create a second session. The app displays Working elsewhere when another job owns the slot.

### Subscription expiry during a session

Expiry blocks new clock-ins, including returning from a break. It does not clock the cleaner out or change confirmed hours. The existing session can finish normally within its deadline, and the normal recovery ladder applies if it is abandoned.

A signed-in cleaner whose subscription has expired retains limited access to clock out, review existing sessions, edit their records, and view work history and existing invoices/earnings. A saved manual record during expiry may only cover work ending on or before the recorded entitlement expiry; it cannot record new work after expiry. Renewal restores normal clock-in eligibility.

This limited access must not restore public cleaner visibility or bypass onboarding, account suspension, refund/revocation, or other account restrictions. Authentication and ownership checks still apply. Ordinary subscription expiry and security/account revocation are separate cases.

The current `resolveCleanerRoute` and `StackNavigator` route an expired cleaner to Premium. A later implementation stage must provide the limited-access entry point from that gate and recheck entitlement on new clock-in requests. Step 1 does not change those routes.

## Expected end and the recovery ladder

For a scheduled job, expected end is the job's scheduled start plus `expectedHours`, not clock-in plus a fixed reminder interval. A 9 AM job with six expected hours has a 3 PM reminder even if clock-in was at 9:04 AM. A break does not move the job's expected end.

Snapshot scheduled start, expected duration, expected end, timing configuration, and pay basis/rate when the session starts. Later job edits, profile rate changes, or configuration edits affect new sessions only. Store absolute timestamps; do not infer scheduled start from a creation timestamp. The existing `Jobs.createdAt` scheduled-date string needs explicit normalization in the implementation.

| Level | Trigger | Result |
| --- | --- | --- |
| L1 | Expected end | Still working reminder. Cancel it on clock-out or automatic stop. |
| L2 | App opens/resumes after expected end, before stop deadline | Yes continues the existing session within its deadline; No asks for actual finish time. |
| L3 | Earlier of expected end plus 3 hours or clock-in plus 12 hours | Automatically stop to `needsReview`; estimated duration contributes zero confirmed hours. |
| L4 | Hourly server sweep | Recover overdue active sessions even if the device never runs again. |

L4 uses the saved stop deadline as the cutoff, not the later sweep execution time. An hourly sweep can discover a cutoff up to roughly an hour later; that delay must never inflate the duration. Client and server stopping the same session must be idempotent. Once stopped, Yes cannot revive it; the cleaner resolves it or starts a new session after resolution.

Yes in the L2 prompt does not extend the stop deadline or the 12-hour cap. Dismissing a prompt or denying notifications never confirms hours. Local notifications are reminders, not the authority for session state.

### Missing expected duration and general work

New job posts require a valid `expectedHours` independently of flat, hourly, or sqft pricing. Pricing `hours` and tracking `expectedHours` remain distinct. Existing jobs must receive an explicit duration before a job-linked clock-in; do not infer it from price or silently fabricate it. The cleaner can still use general clock-in.

General sessions start without a required duration. If the cleaner supplies an optional planned finish, use that for L1/L2 and apply the same grace/cap. Otherwise expected end is unknown: do not send an invented expected-end reminder; the 12-hour cap and hourly sweep remain active. Offer an optional planned finish after starting so immediate clock-in stays available.

If expected end is already past at clock-in but its grace deadline is still future, present Still working immediately instead of scheduling a past reminder. If the grace deadline has already passed, require an explicit revised planned finish for this session before starting. The revised finish is audited and must be after the start and within the hard cap; it does not change the job's schedule or pricing.

Timing defaults are 3 hours of grace and a 12-hour hard cap in `AppConfig/workSessions`. The feature is disabled until the configuration, duration prerequisites, and backend recovery are available. Config changes cannot retroactively move an existing session's deadlines.

## Session transitions and recovery

Use lifecycle state separately from provenance. `edited` describes how a record was corrected, not a second counted status; `autoStopped` is a history event/reason leading to `needsReview`.

| Action | Resulting state | Counts as confirmed hours |
| --- | --- | --- |
| Clock in | `active` | No |
| Normal clock-out before deadline with valid times | `confirmed` | Yes |
| Automatic stop or external job interruption | `needsReview` | No |
| Save manual record | `needsReview`, source `manualCleaner` | No |
| Cleaner confirms actual times | `confirmed` | Yes |
| Cleaner corrects a confirmed session with valid times | `confirmed`, audit entry added | Yes, recalculated |
| Cleaner discards a record | `discarded` | No |

The cleaner resolves each pending session independently. Quick 4h/6h/8h choices derive an actual end from its saved start and must pass the same validation as Pick time. Show the resulting start/end before confirmation. Discard preserves the original record and adds an audit entry; it does not delete the session.

An active session that has crossed its deadline cannot become confirmed through a late clock-out shortcut. Reconcile it to `needsReview`, then let the cleaner supply actual times. A rejected validation attempt is a form error, not a saved rejected lifecycle state; there is no rejecting approver in this version.

### Manual records and edits

- Enter explicit start and end dates/times, optional job, and a note. Never infer an overnight end from an earlier time of day.
- End must be strictly after start and no later than server time. Duration may be at most 12 hours; exactly 12 hours is valid.
- New manual records may cover only the preceding seven days, measured from server time to start. This limit does not prevent resolving older automatically stopped records or correcting existing history.
- Prevent overlap with other active, confirmed, or pending sessions; ignore discarded records and the session being edited. Adjacent intervals sharing an endpoint are valid.
- A job-linked manual record requires evidence that the cleaner was assigned for that work. If the job is deleted or assignment cannot be verified, save it as general work instead of attaching it to another cleaner's job.
- Save manual entries as pending. Confirmation is a separate explicit cleaner action, so Save alone never adds hours.
- Validate again on the server when saving or confirming. A failed/offline request must not appear confirmed locally.
- Keep original and changed times, actor, server timestamp, reason/source, and automatic-stop events. An existing session's pay snapshot remains unchanged by a time edit.

## Job completion and cancellation

Work-session state is independent from job and invoice state. Completing, cancelling, deleting, reopening, or reassigning a job never confirms worked time or erases history.

| Job event | Work-session behavior |
| --- | --- |
| Cleaner requests completion while clocked in | Offer Clock out and request completion. Confirm the valid clock-out first; if it fails, do not submit completion. Completion success/failure must be reported separately and retry safely. |
| Cleaner cancels their assignment while clocked in | Ask for actual finish time or Discard before cancellation. Preserve any confirmed time even when cancellation removes `confirmedCleaner`. |
| Customer/admin cancellation, reassignment, completion, or job deletion while a session runs | Stop to `needsReview` at the earlier of event time or existing deadline. Ask the cleaner to confirm actual times; do not treat the event as proof of hours. |
| Backend automatically completes a job | Same review behavior as external completion. Automatic job completion is not clock-out evidence. |
| Job is reopened or completion request is rejected | Existing sessions remain unchanged. A new session requires restored assignment, eligible job state, and normal clock-in checks. |
| Invoice is generated or paid | Sessions remain unchanged; existing invoice/payment logic handles money. |

If the interruption reaches the app late, use the authoritative event timestamp, not the app-open time. A background handler must cover external changes and deletions. Snapshot job identity/title, cleaner assignment, timing, and pricing information so history remains readable if the job no longer exists.

The current My Jobs cancellation resets the job to `active` and clears `confirmedCleaner`. Both that path and Job Details/completion functions need integration later; protecting only one screen would leave a bypass.

## Overnight work and monthly accounting

Store absolute start/end instants and an IANA reporting timezone saved with the session. Select the cleaner's reporting timezone when the feature is configured, defaulting visibly to their device timezone. Travel or changing the phone timezone must not silently move previously recorded work between months.

Calculate elapsed duration from timestamps, including daylight-saving changes. Keep full precision for calculations; format hours/minutes for display. Split confirmed time at local month boundaries in the session's saved reporting timezone, without creating duplicate session records. Session history can appear in both months with only that month's duration counted.

Example: a confirmed session from 31 October 11 PM to 1 November 1 AM contributes one hour to October and one hour to November. Pending time remains pending in each relevant month and contributes zero confirmed hours until resolved.

Collected money continues to use `earningsService` paid-month semantics. That service currently uses device-local `Date.getFullYear()`/`getMonth()`; this integration must not silently migrate existing invoice totals to a new timezone. Any future unified invoice reporting timezone requires a separate explicit migration.

Effective monthly rate is collected money for the selected month divided by confirmed hours for that month. When confirmed hours are zero, show unavailable rather than zero or infinity. Cash received in a later month can legitimately produce a different effective rate; it is a cash-to-hours comparison, not a contractual wage.

A running preview may show confirmed plus active duration, separately labelled Including current session with a provisional effective rate. It never replaces the confirmed headline or includes pending estimates. At automatic stop, the preview disappears and estimated time moves to pending.

Hourly rate belongs to the job. Use the cleaner default only when an hourly/general session lacks a valid job rate. Flat and sqft sessions retain their pay basis and do not receive invented hourly earnings. A missing fallback rate leaves hours trackable and the hourly estimate unavailable. Manual entries snapshot the available rate at creation and label that provenance; they cannot claim a historical rate that was never recorded.

Fixed-price invoices count once through existing paid invoices. Never divide a fixed amount across work sessions. Any hourly session amount is labelled an estimate and is not added to Collected. Unpaid invoices and unbilled work must be derived without counting the same obligation twice; general sessions do not imply an unbilled charge automatically.

### Reconciled display example

| Figure | Value |
| --- | --- |
| Confirmed headline | 42h 30m |
| Pending | 9h, two sessions of 6h and 3h |
| John's House | 2h 30m, $50 collected |
| Mike's Apartment | 5h, $20 collected |
| Sandra's Office | 35h, $875 collected |
| Collected total | $945.00 |
| Effective confirmed rate | $22.24/hr |
| Including current session | 44h 44m, provisional $21.13/hr |

The separate 7h 30m/$70 FlowMap illustration is labelled Worked example - two jobs and is not the monthly dataset.

## Implementation boundaries and acceptance

The app's current behavior remains in place during step 1. Later stages implement these rules in the following locations:

- `PostJob` and job edit signatures: expected duration and schedule normalization.
- New session types/services and server operations: ownership, atomic clock-in, validation, deadlines, and audit history.
- `firestore.rules` and indexes: session access and supported queries.
- `functions/src/index.ts`: hourly recovery and job-event reconciliation alongside existing schedules.
- `resolveCleanerRoute`, `StackNavigator`, and subscription gate: limited access after ordinary expiry.
- `CleanerNavigator`, Dashboard, `JobCard`, My Jobs, and Job Details: shared clock controls and lifecycle handling.
- New Work Hours, session details, manual entry, and recovery interfaces: confirmed/pending presentation.
- `earningsService`: reuse its paid-invoice calculation; no session-generated money ledger.

Before exposing clock-in, verify these acceptance scenarios:

1. A 9 AM/six-hour job reminds at 3 PM, stops at 6 PM unless the 12-hour cap occurs first, and remains uncounted until resolved.
2. A killed app is recovered by the backend using the saved cutoff, not sweep time; client/server races produce one transition.
3. Two devices cannot start concurrent sessions, and retrying clock-out cannot count time twice.
4. Expiry mid-shift permits clock-out/review/history, blocks new starts, and preserves customer-facing visibility restrictions.
5. Missing legacy duration does not invent an expected end; general sessions still have a hard cap.
6. Manual Save remains pending; explicit confirmation counts it once, invalid/overlapping/future times are rejected, and audit history survives edits/discard.
7. Overnight sessions use explicit dates and month splitting; invoice money remains in its paid month.
8. Cleaner and external job lifecycle changes preserve records and do not auto-confirm time or generate payments.
9. The reconciled monthly example displays 42h 30m confirmed, 9h pending, $945 collected, and $22.24/hr across all relevant screens.
10. Disabling the feature stops new clock-ins while preserving finish/review access for existing records.

Next stage: implement expected duration and feature configuration before adding session storage or timer UI.

## Step 2 implementation

Job posting, editing, and reposting now require numeric `expectedHours` greater than zero and at most 12, with up to two decimal places. The shared form covers customer and admin paths. The field does not change budget/pricing hours, and existing documents are not automatically backfilled. Job Details displays Not specified for older jobs. Editing an older job requires explicitly supplying duration.

New/saved jobs also store `scheduledStartAt` as a Firestore Timestamp and `scheduleTimeZone` as an IANA timezone, while retaining the legacy `createdAt` schedule string for compatibility. Creation time remains in `createdAt2`. Later timer code must use the normalized schedule, never creation time.

Cleaner Edit Profile now supports optional numeric `defaultHourlyRate`. Clearing the field stores null; customers do not see or write the preference. It does not change invoices or job prices. Session snapshotting will be implemented in step 3.

`workSessionConfigService` reads `AppConfig/workSessions` from the server. Missing, invalid, inaccessible, or offline configuration returns disabled defaults. It has no timer consumer yet. Existing sessions must later remain recoverable even if this read disables new starts.

Publish the fields in `work-sessions-config.json` to `AppConfig/workSessions` via Firebase Console or Admin SDK, keeping `enabled` false. This JSON is a deployment template, not an automatic seed or a live remote change. The included rules permit signed-in single-document reads and deny client writes; deploy them only after comparing against live rules as required by the existing header in `firestore.rules`. No production rules/configuration were deployed in step 2.

Configuration accepts finite grace/cap hours greater than zero and at most 12, grace no greater than cap, and an integer manual-entry age from 1 to 30 days. Invalid configuration fails closed as a whole. The shipped defaults are 3/12/7. Enabling the document is not sufficient to launch tracking: session services, recovery, and UI must be completed first.

Verification covers fractional/invalid durations, legacy missing values, duration-only edit detection, admin field preservation, invalid/disabled remote configuration, and network failure. Next stage: session storage, validated operations, ownership, and atomic one-active-session enforcement.

## Step 3 implementation

The session layer is implemented locally, with no timer controls or production deployment. `workSessionOperation` is a Firebase Functions HTTP endpoint in `us-central1`. It accepts POST requests with a Firebase ID token, checks revocation, derives ownership from the verified UID, and validates every mutation in a transaction.

The mobile `workSessionService` provides clock-in/out, manual Save, confirmation, time edits, discard, monthly-range listeners, current-session listeners, and audit-history reads. It uses existing Firebase Auth and fetch; no native dependency was added. The endpoint address derives from the configured Firebase project. Keep the generated `requestId` with the pending action and reuse it unchanged after a timeout/network failure. A successful request ID cannot be reused for another action or payload. A late clock-out returns `needsReview`, not confirmed hours.

| Storage | Purpose |
| --- | --- |
| `WorkSessions/{id}` | Owned session, immutable job/rate/timing/timezone snapshots, lifecycle, confirmed duration, and pending estimate |
| `WorkSessions/{id}/history/{requestId}` | Complete immutable audit events |
| `WorkSessionLocks/{cleanerId}` | One active or automatically stopped session reservation and a transaction revision |
| `WorkSessionOperations/{cleanerId}/requests/{requestId}` | Server-only successful operation receipts for safe retries |

Session timestamps are integer epoch milliseconds set or validated by the server. Normal clock-out takes server time; explicit changes to start/end must use manual/review/edit operations. Lifecycle is `active`, `needsReview`, `confirmed`, or `discarded`. Editing and automatic stopping are audit events, not additional counted states. Confirmed duration is zero in every non-confirmed state.

The session document retains the latest 20 audit events as `editHistory[]` for a small preview. All events remain in the history subcollection; older events are not deleted. Pay and timing snapshots remain unchanged when times are edited. No operation writes to Jobs, Invoices, Payments, or subscription fields.

All operations that change a session also reserve/update the same cleaner lock. Combined with transaction reads and overlap validation, this serializes starts, manual entries, and edits across devices. Overlap queries inspect non-discarded records in the relevant interval, including active/pending work. Saved intervals are at most 12 hours, so the lookback is bounded to 12 hours. Pending manual entries do not occupy the active slot; an automatically stopped clock session retains its slot until confirmed or discarded. Repeated clock-out/discard requests do not append duplicate events or count time twice.

New clock-ins require enabled configuration, a usable cleaner account, active subscription access, current instructions acceptance, and required business information. Linked starts additionally require a confirmed job assigned to the caller, numeric expected duration, and a normalized schedule. General work uses the hard cap without an invented expected end, or an optional supplied planned finish. An elapsed job grace deadline requires an explicit revised finish within the cap.

Manual Save requires enabled configuration and completed onboarding, valid recent non-overlapping times, and work ending within the caller's recorded entitlement. It stays pending until the cleaner confirms. Ordinary subscription expiry or disabling configuration does not block finishing, confirming, editing, or discarding existing records; refunded/revoked/suspended accounts are rejected. Time edits to manual records cannot extend them past recorded entitlement. A deleted/reassigned job cannot be newly linked without assignment evidence; the caller must choose general work instead.

The Firestore additions allow usable cleaners to read only their own sessions/lock/history, including after ordinary expiry. Client writes to sessions, audit history, locks, and receipts are denied. The two added composite indexes support range subscriptions and overlap validation.

### Deployment and verification

Keep `AppConfig/workSessions.enabled` false. Before live use, deploy the function, the WorkSessions indexes, and the reviewed Firestore rules; then implement step 4 recovery and job-event handling, followed by the UI stages. Existing rules must still be compared against live Console rules before deployment as described in their header. These local changes do not deploy any cloud resource.

New-work entitlement checks use the app's existing `subscriptionEndDate`/`visibilityGraceUntil` policy, with account/refund vetoes. The existing rule file notes that some legacy subscription fields remain client-writable for optimistic purchase flows. This stage does not migrate those writes; removing that pre-existing entitlement limitation requires updating the payment integrations separately.

Automated checks cover authenticated HTTP handling, mobile requests/error propagation, idempotency, overlapping edits, two-device start attempts, snapshots, expiry, manual limits, discarded history, and full audit retention. The transaction tests use a serializable in-memory harness; they do not claim a live Firebase/emulator concurrency or rules test. Firebase Functions must build and lint successfully, and the app must add no TypeScript diagnostics beyond its existing baseline.

Next stage: hourly abandoned-session recovery and external job-event reconciliation using the same cleaner lock. There is no proactive sweep in step 3; late clock-out already enforces the saved deadline, but an unopened app requires step 4.

## Step 4 implementation

Backend recovery is implemented locally. It does not expose clock controls or enable tracking. Recovery uses each session's saved timing configuration and continues even if new clock-ins are disabled or the cleaner's subscription has expired.

| Cloud function | Behavior |
| --- | --- |
| `recoverOverdueWorkSessions` | Runs hourly in UTC, finds overdue active sessions, and stops them at their saved `autoStopAt`, rather than the sweep execution time. |
| `reconcileJobWorkSessionChanges` | Handles completion requests, completion, cancellation/status interruption, assignment removal/reassignment, and deletion. Uses the job commit/event timestamp, capped by the existing stop deadline. Reopening and unrelated job edits do not revive or stop timers. |
| `notifyWorkSessionReview` | Sends an FCM notification for a server-created recovery notice while the record still needs review. Resolved records and missing/invalid device tokens are skipped; transient delivery failures retry. |

Automatic stopping sets `needsReview`, records an estimated interval, and resets counted duration to zero. It never confirms time, changes invoices, or creates money. The transaction updates the session, audit history, cleaner lock, and one deterministic in-app notification together. Existing notifications display this notice with an amber clock icon. Opening a session review screen and expired-subscription access will be wired in the later UI stages.

The cleaner lock now retains `reviewSessionIds` alongside its active pointer. A delayed job event can flag an earlier normal clock-out without replacing a newer active timer; resolving one record leaves other reservations intact. Unresolved automatically stopped records prevent further starts. Earlier delayed events can refine a pending cutoff, but an explicit confirmation or edit by the cleaner is preserved. Manual and discarded records are unaffected.

Clock-out also checks the current job inside its transaction, closing the gap before a background job handler runs. A new `reconcile` operation lets the later app-resume/L3 flow check deadlines and interruptions without treating that check as a clock-out or confirming hours. Client/server races and repeated event delivery share the same lock and produce harmless retries.

Recovery queries paginate, and partial failures propagate for retry while retaining successful transactions. Two additional WorkSessions indexes support deadline and job-event queries. Firestore rules reserve recovery notice types/IDs for the server and allow recipients to update only their read flag on those notices, preventing ordinary client notification writes from fabricating recovery pushes.

### Deployment and verification

No cloud resources or remote configuration were changed. Keep `AppConfig/workSessions.enabled` false. Before UI rollout, deploy the reviewed rules, all WorkSessions indexes, `workSessionOperation`, and the three functions listed above. Wait for indexes to finish building, then verify recovery, ownership rules, job-event handling, and real-device push delivery in staging. Follow the live-rules comparison requirement already recorded in `firestore.rules`.

Checks passed: 175 tests across 11 relevant suites, plus Firebase Functions build and lint. Coverage includes deadline/grace/cap behavior, killed-device recovery, equal-cutoff pagination, partial failure retries, external job changes, delayed events, newer active reservations, explicit review protection, automatic reconciliation, and notification delivery decisions. These are unit/transaction-harness checks, not live Firebase/emulator or device validation. The app's full TypeScript check still has its existing baseline errors; this stage adds no diagnostics.

The in-app notice and recovery transition are idempotent. FCM is at-least-once: a process failure after sending but before saving the delivery marker can repeat a push. Push failure never reverses the saved session state or removes its in-app notice.

Next stage: step 5 clock controls, app lifecycle checks, expected-end reminders, job-action integration, and limited access after ordinary subscription expiry. Review/manual-entry screens and monthly reporting remain later stages.

## Step 5 implementation

Clock controls are integrated locally behind the existing disabled-by-default configuration. An app-wide WorkSessionProvider owns the authenticated cleaner's open-session subscription, configuration refresh, pending saves, foreground checks, reminder cancellation, and shared dialogs. Screens use that shared state; they do not own independent timers.

### App flow

- Dashboard offers General work clock-in, displays the running job/title and elapsed time, and provides Clock out and Work history.
- Assigned-job cards in My Jobs and Job Details offer job clock-in when the job is confirmed and assigned. If another session owns the timer, they show Working elsewhere. Starts re-read the job and are validated again by the server.
- Start confirmation shows a reporting timezone, saved per account on the device for subsequent sessions. Travelling does not silently change it. General work can omit a planned finish and add one while running; a job whose old grace deadline has elapsed requires an explicit revised finish. Missing legacy duration/schedule requires a job update or General work.
- Existing sessions remain finishable/reviewable when configuration is disabled. New starts require fresh enabled configuration, a usable/onboarded cleaner, active subscription access, and no unresolved clock reservation. Customers never see clock controls.
- Work tracking provides running/pending state, actual-time confirmation or discard, paginated work history, existing invoices in read-only previews, and the existing cash-basis Earnings screen. It does not introduce monthly aggregation, invoice writes, or a new money calculation.

### Reminders and recovery

The existing Notifee dependency schedules L1 at the session's saved expected end, rather than an interval from clock-in. Cancellation/scheduling is serialized, and a persisted reminder ID permits cleanup after restart or sign-out. Finish, automatic stop, and account changes cancel the reminder. General work without a planned finish has no invented reminder. Denied/unavailable notifications show a message without confirming time or changing the server deadline. Device notifications remain best effort; the backend is the stop authority.

On opening/resuming, the app refreshes configuration and reads, then uses `reconcile` for the existing timer. Foreground checks also reconcile at the stop deadline. L2 asks Still working after expected end: Yes keeps the original deadline; No opens actual dates/times. An open L2 prompt cannot hold the timer past L3. The hourly server sweep still covers killed apps and phones that never reconnect.

Two additional validated operations support these choices:

| Operation | Effect |
| --- | --- |
| `requestReview` | Explicitly moves active work to pending, retaining its reservation and counted duration of zero. Confirmation of actual times is a separate action. |
| `setPlannedFinish` | Adds an expected finish once to active General work, using saved grace/cap settings. It cannot extend the original cap or revise job-linked deadlines. The change is audited. |

Dates chosen in the finish dialog are explicitly labelled with the device timezone; the record's reporting timezone remains saved separately. Confirming validates future/end-before-start, duration, ownership, and overlap on the backend.

All work mutations persist their exact request ID and payload before sending. Timeouts/network uncertainty leave an explicit Retry unfinished work update action, including after an app restart. Another mutation cannot replace that unresolved intent. Definitive server validation/access rejections allow the form to be corrected. Pending operations are scoped to the signed-in account; account changes never replay another cleaner's intent. A failed local cleanup after a successful server response retains the same request for idempotent retry.

### Job actions and subscription access

Both My Jobs and Job Details check for linked open clock sessions before cleaner completion/cancellation. Completion offers Clock out and request completion; the saved hours must succeed first. Late/pending sessions need explicit review. Cancellation requires choosing actual finish dates/times or discarding before releasing the job. Closing the time picker leaves the job unchanged. A failed job update does not undo saved hours; its message directs the cleaner to retry the job action. External customer/admin job changes remain covered by step 4.

Job Details now sends a cleaner's completion request to the customer with the completion-request notification type and timestamp, consistent with My Jobs. Customer completion continues to notify the cleaner.

The Premium screen offers access to existing work records after ordinary expiry. Launch routing can use known work-history evidence, and a live navigation guard removes access to job tabs/new-work screens when the subscription lapses. Work tracking, existing Earnings, and read-only invoice previews remain accessible; renewal restores the usual cleaner flow. Invoice previews already open when access lapses also lose generation/payment/delete actions. This is UI routing/access integration; existing invoice/payment backend permissions are not redesigned in this stage. Public cleaner visibility remains governed by its existing subscription policy.

Work review pushes and local reminders route to Work tracking, including after expiry. Ordinary job pushes retain their paywall behavior. Foreground, background, and cold-start notification entry points use the shared routing utility; session ownership is checked by Firestore when opening the record. Refunds, suspended/deleted accounts, customers, and incomplete onboarding do not receive the limited-record bypass.

### Verification and rollout

Keep `AppConfig/workSessions.enabled` false until the later UI/reporting stages and staging checks are complete. No cloud resources, configuration, or app release were deployed. Deploy the updated `workSessionOperation` before testing this UI, along with step 4 functions, reviewed rules, all WorkSessions indexes, and the new `Invoices(cleanerId, createdAt DESC)` index for paginated read-only invoice history.

Automated checks pass: 214 tests across 17 relevant suites. They cover saved request retries/restarts, owner isolation, reminder timing/cancellation/permission denial, Still working/deadline behavior, actual-time review, late clock-out, completion ordering, cancellation abandonment, expiry access, open invoice-sheet expiry, notification routing, and the earlier backend safeguards. Firebase Functions build/lint and focused new mobile-code lint pass; app TypeScript diagnostics remain at their pre-existing baseline. Real-device iOS/Android notification scheduling/taps, actual Firebase rules/indexes, multi-device concurrency, and cloud job-event timing still require staging verification before enabling tracking.

Next stage: step 6 richer recovery/manual-entry/session-detail interfaces, followed by monthly hours/earnings reporting. The basic actual-time picker here keeps the step 5 clock and job actions usable while those screens are added.

## Step 6 implementation

Recovery, manual entry, record details, and corrections are integrated locally. Work tracking now opens each record's details, including resolved or discarded records reached through an older work notification. Returning to work tracking refreshes history.

### App flow

- **Add past work manually:** choose General work or an assigned job, explicit start/finish dates and times, a reporting timezone, and an optional note. Assigned jobs paginate; a failed job read leaves General work available without silently changing a selected job. New manual entries use the configured age/cap (defaults: preceding seven days, maximum twelve hours) and cannot extend beyond recorded subscription access. Server overlap, eligibility, and interval checks remain authoritative.
- **Save pending record:** saving opens the separate Work record screen. It never confirms the record, starts a timer, creates an invoice, or calculates collected money. The cleaner must explicitly review and confirm actual times before hours count.
- **Review actual times:** the shared recovery form previews explicit dates, elapsed duration, and the saved reporting timezone. Clock recovery offers 4h/6h/8h choices from the saved start; future or over-cap choices are disabled. Choosing a shortcut changes the preview only. Discard remains a separate explicit choice and retains history.
- **Work record:** shows status and provenance, confirmed duration or an uncounted pending/running estimate, notes, interruption explanation, original recorded times, and saved job/rate context with its capture date. The creation audit is queried by action rather than assuming the earliest timestamp is unique. The full history loads in pages, showing actor, before/after times and status, notes, and automatic-stop reasons; the bounded inline editHistory does not truncate the visible full audit.
- **Correct this record:** confirmed records open the shared time form, require a short correction reason, and remain confirmed after a valid saved correction. Existing server checks prevent invalid/future/overlapping intervals and retain the old times. Discard removes counted hours without deleting the record or its history.

New manual entry is available only with enabled configuration and a usable/onboarded cleaner account. A recently expired cleaner may enter eligible past work even without existing session history, while the gate still blocks new clock-ins and ordinary job screens. Existing details, confirmation, correction, and history remain available after ordinary expiry or feature disablement. Customers, refunded/suspended/deleted accounts, and incomplete onboarding retain their restrictions.

### Save reliability and concurrent edits

The provider exposes the existing persisted pending request to these forms. An uncertain manual save freezes and displays its original dates, timezone, and note, including after restart; Retry sends the same stored intent and opens its resulting record. A pending operation of another kind must be resolved before a new manual save. Definitive server validation errors remain form errors. Async reads/results are scoped to the screen's authenticated account.

Sessions now have a monotonic revision. Confirm, correct, discard, and active-to-review forms send the revision they opened with. The transaction rejects a stale form after another device or a recovery event changed the record, including changes within the same millisecond. The user closes and reopens the form to load the current record. Recovery also increments the revision; successful receipt retries remain replayable before the revision check. Legacy records use revision zero, optional revisions retain compatibility with earlier callers, and requests without a revision retain their previous receipt hash.

### Verification and rollout

Automated checks pass: 230 tests across 21 relevant suites. New coverage includes separate manual save/confirmation, original-request retry after restart, invalid interval and overlap feedback, job-read failure, quick-choice preview without saving, explicit correction/discard, detail access failure, original history and pagination, stale confirmations/corrections/discards, same-millisecond changes, legacy revisions, and recovery revision updates. Firebase Functions build/lint and focused mobile lint pass (non-blocking no-void warnings remain). App TypeScript diagnostics match the pre-existing baseline; no new errors were introduced.

No cloud deployment, remote configuration change, or app release was performed. Keep `AppConfig/workSessions.enabled` false. Before staging this step, deploy the revised `workSessionOperation` and recovery functions alongside the earlier rules/index changes; then verify native time pickers, keyboard layout, ownership rules, notification entry, retries, and two-device edits on iOS/Android with Firebase. Unit and transaction-harness checks do not replace those device/cloud checks.

Next stage: step 7 monthly confirmed/pending hours, month-boundary splitting, and comparison with the existing paid-invoice earnings totals. Work sessions continue to add hours only.

## Step 7 implementation

Monthly hours and collected earnings are integrated locally. Dashboard shows the current month's summary and a link to the full Monthly hours & earnings screen. Work tracking and the existing Earnings screen also link there. The prior dashboard Earnings card now names its year so its annual figure is distinct from the new monthly summary.

### Monthly reporting flow

- Previous/Next and a month/date picker select the report month and year. The confirmed headline, pending estimates/count, collected amount, and effective cash-to-hours rate share one calculation between Dashboard and the full monthly screen.
- Only confirmed intervals count as confirmed hours. Pending estimates remain separate. A running preview shows confirmed plus current-session time and a provisional rate without replacing the confirmed headline. Once the saved stop deadline arrives, an overdue active record is shown as a pending estimate even if the hourly server sweep has not arrived; its running preview disappears.
- Work is clipped to local month boundaries in each session's saved IANA timezone. A crossing session appears in both months with only the respective portion counted, while details retain the single original interval and audit history. Boundary conversion uses Intl calendar parts and elapsed timestamps, including daylight-saving and leap/year changes. Calculations keep millisecond precision; hours/minutes are display formatting only.
- The session query covers the UTC month plus timezone margins and the existing twelve-hour lookback, so a record beginning outside the selected UTC month is still fetched when it contributes in its saved timezone. Monthly totals use the complete matching query, not the recent-history page or the first 25 records.
- Money reuses `buildAnnualEarningsSummary`, `getInvoicePaidMonth`, and `parseInvoiceAmount` from earningsService. Only paid invoices with valid paidAt contribute, in their paid month, using the same device-local date convention as existing Earnings. Sessions do not calculate money, mark invoices paid, or create invoices. The report explains the distinct work/invoice timezone conventions. Zero confirmed hours yields an unavailable effective rate, including months with cash collected for earlier work.
- By-job rows reconcile confirmed/pending/running time and monthly collected money. Every paid invoice is attributed once, including fixed-price invoices spanning multiple sessions. Money-only jobs remain visible when work occurred in another month. Invoices without a job have their own row and are never attributed to General work.
- Confirmed/Pending/All filters and record-detail links support review and correction. Job, session, and paid-invoice lists render in batches while totals still include the full datasets. Paid-invoice drill-down opens the existing preview with payment actions disabled.

### Invoice follow-up and live data

Invoice follow-up labels outstanding invoices as **all dates**, separate from this month's collected total. The count of jobs with confirmed hours this month and no saved invoice excludes any job with an existing paid or unpaid invoice from any month. This is conservative job-level coverage, not an invented unbilled dollar amount. General work does not imply a charge.

The account-scoped report hook listens to owned monthly work and the owned invoice ledger while its screen is focused. Reads include legacy invoice paidAt representations, so the ledger is not narrowed to a Timestamp-only paidAt range. Corrections, confirmations, discards, payments, payment reversals, and invoice deletions update the report live. Background listeners stop on blur; inactive reports avoid recalculating on timer ticks. Full invoice reads preserve the existing ledger's semantics; a future large-ledger optimization would require normalized indexed reporting fields and an explicit migration.

Month/account changes clear previous totals and ignore late callbacks. Partial/failed reads do not appear as zero collected or confirmed totals; they display loading/error and Retry. Cache metadata labels potentially incomplete cached totals. New monthly access follows the tracking/history feature gate and usable-cleaner checks. Existing history remains accessible after ordinary expiry or configuration disablement, with WorkHours added to the limited-access navigation guard. Customer, refund, suspension, and onboarding restrictions remain intact.

### Verification and rollout

Checks pass: 255 tests across 24 relevant suites; Firebase Functions build/lint; focused reporting/mobile lint. Full app TypeScript diagnostics match the pre-existing baseline. New coverage includes the reconciled 42h30m/9h/$945/$22.24 example and 44h44m/$21.13 running preview; overnight confirmed/pending/running splitting; DST, leap/year boundaries, UTC+14/UTC-11/fractional offsets; fixed invoice counting; paid-later recognition and legacy paidAt formats; money-only/unlinked jobs; conservative invoice follow-up; correction/discard/payment-reversal updates; zero-hour rates; overdue cutoff; screen drill-down; cache/read errors; focus cleanup; month and account isolation.

No app release, cloud deployment, or remote configuration change was performed. Tracking remains disabled by default. This step introduces no new cloud function, collection, index, payment operation, or data migration; it uses the session indexes and invoice ownership rules already staged. Final rollout still requires the previous backend/rules/index deployment checks, real-device month selection/timezone changes, multi-device recovery/review, invoice updates, and iOS/Android acceptance testing before enabling AppConfig/workSessions.
