# Hours-based earnings (accrual) alongside collected cash

Status: **spec, not implemented.** Needs sign-off on the open decisions at the
end before any code lands.

## What changes

Today the work feature reports one money number: `collected`, the sum of paid
invoices in the month they were paid. That is cash actually received.

This adds a second number: **earned** — what the work is worth once hours are
confirmed, whether or not anyone has paid yet. The invoice flow does not
change. Nothing about `collected` changes.

The two are presented as a pipeline, never as peer totals:

```
Earned $945   →   Invoiced $820   →   Collected $700
                  ($125 unbilled)     ($120 billed, unpaid)
```

The gap is the point. "You have done $125 of work you have not invoiced" is
more actionable than either total alone.

## Recognition rules, by pay basis

The governing rule from the existing flow stands: **a fixed-price job is never
divided across its sessions.** So the two bases recognise money differently.

| Basis | Earned from | Recognised | Splits across months? |
|---|---|---|---|
| `hourly` | confirmed hours x `paySnapshot.hourlyRate` | per session, as hours confirm | yes, naturally |
| `general` | cleaner-entered total `expectedEarnings` | once hours confirm, in the saved-zone finish month | no; the total counts once |
| `flat` | the job's agreed price | **once**, when the job completes | no |
| `sqft` | the job's computed total | **once**, when the job completes | no |

Hourly money is legitimately session-level because the rate *is* per hour, and
`workTimeInMonth` already splits an overnight session between months — so
`in-month duration x rate` composes correctly with no extra work.

Flat and sqft money is job-level. It cannot be derived from hours at all: a $50
job is worth $50 whether it took 2h or 7h.

## The constraint that drives the design

`buildWorkMonthlyReport(sessions, invoices, month, now)` is a **pure function**.
It reads no collections — the hook supplies month-scoped sessions and invoices,
and the report is computable offline and from cache. That is worth keeping.

So flat/sqft job value cannot be fetched from `Jobs` at report time.

### Revision to my earlier recommendation

I previously said to snapshot the job's price into `paySnapshot` at clock-in.
**Having read the code, that is wrong**, for three reasons:

1. `paySnapshot` is per session. A flat job with three sessions would carry the
   $50 three times, and the report would have to dedupe by job — fragile.
2. Clock-in is the wrong recognition moment. If the scope and price change
   mid-job, the agreed price at *completion* is the real one.
3. A job can be completed with no session at all (`autoCompleteJobs` runs on a
   schedule), so there may be no snapshot to carry it.

Flat/sqft value belongs on a **job-level ledger written at completion**, not on
the session.

`paySnapshot.hourlyRate` stays exactly as it is — capturing the rate at
clock-in is correct for hourly work, and it means **hourly accrual works
retroactively on existing data with no migration.**

## New collection: `JobEarnings`

One document per job, keyed by job id, so every write is an idempotent upsert
and a double completion cannot double-count.

```ts
// JobEarnings/{jobId}
{
  jobId: string;
  cleanerId: string;          // the confirmed cleaner at completion
  basis: 'flat' | 'sqft';     // hourly/general never appear here
  amount: number;             // the agreed job total, in dollars
  completedAt: number;        // authoritative server commit timestamp
  source: 'jobCompletion';
  revision: number;
}
```

Hourly and general jobs are deliberately absent: their money is already
derivable from sessions, and writing it here too would double-count.

### Server: extend the existing trigger

`reconcileJobWorkSessionChanges` (`functions/src/workSessions/tasks.ts`) is
already an `onDocumentWritten` on `Jobs/{jobId}` with before/after data and an
authoritative commit timestamp. The ledger write hangs off it — no new trigger.

```
on Jobs/{jobId} written:
  if before.status != 'completed' and after.status == 'completed':
      if after.budgetType in ('flat','sqft') and parsed amount > 0:
          upsert JobEarnings/{jobId}
  if after.status reverts from 'completed':
      delete JobEarnings/{jobId}      # keeps the ledger truthful
```

This must be server-side: `autoCompleteJobs` completes jobs on a schedule with
no client present.

### Client: report changes

`useWorkMonthlyReport` adds a third scoped query — `JobEarnings` where
`cleanerId == uid` and `completedAt` within the month — exactly parallel to how
invoices are already loaded. `buildWorkMonthlyReport` takes it as a fourth
argument and stays pure.

New fields on `WorkMonthlyReport`:

```ts
earnedHourly: number;       // sum over sessions: in-month confirmed hours x rate
earnedJobs: number;         // sum over JobEarnings rows in this month
earnedGeneralReported: number; // explicit confirmed general-work totals
earned: number;             // earnedHourly + earnedJobs + earnedGeneralReported
unratedMs: number;          // confirmed hours with no usable rate
unbilled: number;           // earned - invoiced
```

and on `MonthWorkJob`: `earned: number`, `unratedMs: number`.

## Unrated hours

`rateSource: 'unavailable'` is a real state — an hourly job with no job rate and
no cleaner default. Those hours **must not** contribute $0 silently, or the
month total understates what the cleaner is owed.

They accumulate in `unratedMs` and surface as a distinct line:

> 6h 30m confirmed with no saved rate — not included in earned.

with a link to set a default hourly rate. `CleanerWorkPreferences.defaultHourlyRate`
already exists in `src/types/workSession.ts`.

## Effective rate keeps its current meaning

`effectiveRate` stays `collected / confirmedMs`. It is not recomputed against
earned, because for an hourly job `(hours x rate) / hours` is the rate by
definition — a tautology that tells the cleaner nothing. The signal in that
metric comes precisely from dividing a *fixed* price by *actual* hours.

A second rate against earned can be added later for flat jobs specifically, but
it duplicates what the collected-based rate already shows.

## Migration

- **Hourly / general:** nothing to do. `paySnapshot.hourlyRate` is already on
  every existing session, so historical months compute correctly on first run.
- **Flat / sqft:** jobs completed before the trigger ships have no ledger row,
  so their historical earned shows as 0 while collected stays correct. A
  backfill script walks `Jobs` where `status == 'completed'` and
  `budgetType in ('flat','sqft')` and writes the rows, using the job's
  completion timestamp. Same dry-run / `--commit` shape as the visibility
  backfill in the server repo.
- Until the backfill runs, months containing flat work show earned below
  collected. The UI should not present that as "unbilled negative" — clamp
  `unbilled` at 0 and treat earned < collected as "ledger incomplete".

## Blocking bug: the price parser

`parseNumericValue` in `JobDetails.tsx` is:

```js
parseInt(String(value ?? '').replace(/[^0-9]/g, ''), 10)
```

It strips the decimal point, so **`$50.50` parses as `5050`**. Today that is a
display-only bug. The moment it feeds the ledger it becomes a money bug off by
100x. This must be fixed, and the fix verified against existing `priceRange`
values, **before** the ledger ships.

## Security rules

```
match /JobEarnings/{jobId} {
  allow read: if request.auth.uid == resource.data.cleanerId;
  allow write: if false;   // server only
}
```

Client writes are closed entirely — the ledger is money, and the existing
pattern of client-written subscription fields is already flagged as something
to move server-side.

## UI surfaces

The current user decision is to show only work hours and earned amounts in work
tracking. Payment collection details stay in the existing financial modules.

1. **Work Hours header card** — confirmed hours and Earned, with pending/running
   hours kept separate. No collected, unpaid/unbilled, or cash-based rate tiles.
2. **By job rows** — confirmed hours and earned amounts per job.
3. **Dashboard month summary** — two tiles: Work hours and Earned.
4. **Session Details** — general work shows its editable total. Hourly sessions show their
   contribution (`duration x rate`). Flat sessions keep showing no amount, with
   the existing explanation that the job price is not divided across sessions.

## Open decisions — need your call

1. **General work — resolved 10 October 2026.** The cleaner enters a total
   amount for that work, not an hourly rate. It is stored as `expectedEarnings`
   and enters Earned only after the session is confirmed. The amount is counted
   once in the month containing the last worked instant (`endedAt - 1`) in the
   record's reporting timezone, so an exact midnight finish belongs to the
   preceding work day. Hours still split across month boundaries. Old records
   without an explicit total keep their hours; their saved default-rate values
   remain outside Earned until the cleaner enters a total. Amount edits refresh
   that record's finish-month earned figure and retain before/after amounts in
   audit history. No invoice or cash recognition is created.
2. **Who owns the flat price** when a job is edited after completion? The ledger
   captures it at completion and will not follow later edits. I think that is
   right — but it means a corrected price needs an explicit re-sync.
3. **Multi-cleaner jobs.** If a job can ever have more than one confirmed
   cleaner, `JobEarnings` needs a split rule. Currently it assumes one
   `confirmedCleaner`. Worth confirming before the schema sets.
4. **Does `sqft` behave as flat?** Treated here as a computed total recognised
   once. If sqft jobs are ever billed per visit, that changes.

## What I would not do

- Prorate a flat price across sessions by duration. Adding a session next week
  would retroactively change last week's earnings.
- Treat earned as cash received. The current work UI shows earned, while payment
  history retains its separate cash-basis recognition in Earnings and Invoices.
- Recompute `effectiveRate` from earned. See above — it goes tautological.


## General-work total implementation — 10 October 2026

- Start work and unlinked manual entry offer a compact Expected earnings field.
  Blank remains hours-only; zero is a valid explicitly reported amount.
- Valid totals range from $0 to $1,000,000 with at most two decimal places.
- Record details exposes Edit earnings for running, pending, and confirmed
  general work. Linked jobs retain their own existing pricing; discarded work
  cannot be edited and contributes no earnings.
- `editEarnings` changes only the amount, requires the current record revision,
  persists through the existing request queue, and stores before/after amounts.
  Correcting retained records remains available after subscription expiry.
- Deploy `functions:workSessionOperation` before testing the updated app.
  This feature requires no new rules, indexes, configuration, or migration.
