/**
 * "Nearby" search radius used across the app to decide what a Cleaner or
 * Customer sees as local:
 *  - Customer Home (Home.tsx): services shown within this radius of the
 *    customer's location.
 *  - Cleaner Jobs (CleanerJobs.tsx): jobs shown within this radius of the
 *    cleaner's location.
 *  - Cloud Function nearby-job push (functions/src/index.ts): who gets
 *    notified when a Customer posts a job.
 *
 * Client-side this feeds `haversine(..., {unit: 'mile'})` directly, so the
 * comparison is a true mile distance rather than a km distance reused under
 * a renamed threshold.
 *
 * The Cloud Function lives in a separate Node project (`functions/`) and
 * cannot import from `src/`, so it keeps its own mirrored constant of the
 * same value — see NEARBY_RADIUS_MILES in functions/src/index.ts. Keep both
 * in sync if this ever changes.
 */
export const NEARBY_RADIUS_MILES = 50;
