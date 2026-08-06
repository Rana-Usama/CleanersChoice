#!/usr/bin/env node
/**
 * One-off backfill: sets a long-lived `Cache-Control` header on every image
 * already sitting in Firebase Storage.
 *
 * Why
 * ---
 * Objects uploaded before the `cacheControl` metadata fix in
 * `src/screens/cleanerflow/homescreens/home/ServiceTwo.tsx` are still served
 * as non-cacheable, so the OS HTTP layer re-downloads them. The app's own disk
 * cache (`src/utils/imageCache.ts`) already shields users from this, but
 * fixing the metadata makes the very first load cheaper too and helps anything
 * that reads these URLs outside the app (invoice PDFs, web, email).
 *
 * Run it once, from the repo root. Easiest way — reuse the service account that
 * already lives in the server repo's .env (same Firebase project):
 *
 *   node --env-file=../cleanerChoiceServer/CleanersChoice-Server/.env \
 *        --env-file=.env \
 *        ./scripts/backfillImageCacheControl.js --dry-run
 *
 * Drop `--dry-run` once the output looks right.
 *
 * Credentials — either works:
 *   a) PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY   (the server .env format)
 *   b) GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *
 * Bucket — first of these that is set:
 *   STORAGE_BUCKET, FIREBASE_STORAGE_BUCKET, else `${PROJECT_ID}.firebasestorage.app`
 *
 * `firebase-admin` is resolved from ./functions/node_modules, so no extra
 * install is needed.
 */

const path = require('path');

const admin = require(path.join(
  __dirname,
  '..',
  'functions',
  'node_modules',
  'firebase-admin',
));

/**
 * Per-prefix cache policy.
 *
 * `immutable` + 1 year is only safe when the object NAME is unique per upload,
 * because the name is the cache key.
 *
 *  - serviceImages/   -> `service_${Date.now()}_${index}.jpg`, unique per
 *                        upload (ServiceTwo.tsx:66). Safe to freeze.
 *  - chat-attachments/ -> `${chatId}/${Date.now()}_${name}`, unique. Safe.
 *  - profileImages/   -> `profile_${uid}.jpg` — a STABLE name that is
 *                        overwritten every time the user changes their photo
 *                        (SignUp.tsx:184, EditProfile.tsx:96). Firebase does
 *                        mint a fresh download token on overwrite, which
 *                        changes the URL and therefore the cache key, so
 *                        `immutable` would probably be fine — but the failure
 *                        mode if that ever doesn't hold is users staring at a
 *                        year-old avatar. Avatars are small and the app has its
 *                        own disk cache (utils/imageCache.ts), so a day costs
 *                        almost nothing. Raise it if you'd rather.
 */
const IMMUTABLE_YEAR = 'public, max-age=31536000, immutable';
const CACHE_POLICIES = [
  {prefix: 'serviceImages/', cacheControl: IMMUTABLE_YEAR},
  // NOTE: was 'chatAttachments/', which matched nothing. Chat.tsx:190 uploads
  // to `chat-attachments/` (hyphenated) — the old prefix silently skipped
  // every chat attachment in the bucket.
  {prefix: 'chat-attachments/', cacheControl: IMMUTABLE_YEAR},
  {prefix: 'profileImages/', cacheControl: 'public, max-age=86400'},
];

const DRY_RUN = process.argv.includes('--dry-run');

// `--limit=N` stops after N objects have been updated. Use it to canary a
// handful of real writes and confirm the app still loads those images before
// committing to the full run. Re-running is safe: objects that already carry the
// right header are skipped, so this doubles as resume-after-Ctrl-C.
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
if (limitArg && (!Number.isFinite(LIMIT) || LIMIT <= 0)) {
  console.error(`Invalid --limit value: ${limitArg}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Credentials
 * ------------------------------------------------------------------ */

const {
  GOOGLE_APPLICATION_CREDENTIALS,
  PROJECT_ID,
  CLIENT_EMAIL,
  PRIVATE_KEY,
} = process.env;

const hasInlineServiceAccount = !!(PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY);

if (!GOOGLE_APPLICATION_CREDENTIALS && !hasInlineServiceAccount) {
  console.error(
    [
      'No Firebase credentials found. Provide either:',
      '',
      '  a) the service-account env vars the server repo already uses —',
      '     PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY. Easiest way:',
      '',
      '       node --env-file=../cleanerChoiceServer/CleanersChoice-Server/.env \\',
      '            --env-file=.env \\',
      '            ./scripts/backfillImageCacheControl.js --dry-run',
      '',
      '  b) a downloaded key file:',
      '',
      '       GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/serviceAccount.json \\',
      '       STORAGE_BUCKET=<bucket> ./scripts/backfillImageCacheControl.js --dry-run',
      '',
      '     (Firebase Console -> Project Settings -> Service Accounts ->',
      '      Generate new private key. Save it OUTSIDE this repo.)',
    ].join('\n'),
  );
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Bucket
 * ------------------------------------------------------------------ */

// Newer Firebase projects default to <project>.firebasestorage.app; older ones
// to <project>.appspot.com. Derived only as a last resort, and always logged so
// a wrong guess is obvious rather than silent.
const derivedBucket = PROJECT_ID ? `${PROJECT_ID}.firebasestorage.app` : null;
const bucketName =
  process.env.STORAGE_BUCKET ||
  process.env.FIREBASE_STORAGE_BUCKET ||
  derivedBucket;

if (!bucketName) {
  console.error(
    'No storage bucket. Set STORAGE_BUCKET (or FIREBASE_STORAGE_BUCKET, which\n' +
      'is already in this repo\'s .env — pass --env-file=.env to pick it up).',
  );
  process.exit(1);
}

const bucketSource = process.env.STORAGE_BUCKET
  ? 'STORAGE_BUCKET'
  : process.env.FIREBASE_STORAGE_BUCKET
  ? 'FIREBASE_STORAGE_BUCKET'
  : 'derived from PROJECT_ID';

/* ------------------------------------------------------------------ *
 * Init
 * ------------------------------------------------------------------ */

if (hasInlineServiceAccount) {
  admin.initializeApp({
    // PRIVATE_KEY is stored with literal \n escapes in .env — same unescaping
    // the Vercel endpoints do.
    credential: admin.credential.cert({
      projectId: PROJECT_ID,
      clientEmail: CLIENT_EMAIL,
      privateKey: PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: bucketName,
  });
  console.log(`credentials: service-account env vars (${CLIENT_EMAIL})`);
} else {
  admin.initializeApp({storageBucket: bucketName});
  console.log(
    `credentials: GOOGLE_APPLICATION_CREDENTIALS (${GOOGLE_APPLICATION_CREDENTIALS})`,
  );
}

console.log(`bucket:      ${bucketName}  [${bucketSource}]`);
console.log(
  `mode:        ${DRY_RUN ? 'DRY RUN — nothing will be written' : 'LIVE — metadata will be updated'}` +
    (Number.isFinite(LIMIT) ? `, capped at ${LIMIT} object(s)` : ''),
);

const bucket = admin.storage().bucket();

const isImage = file => {
  const contentType = file.metadata && file.metadata.contentType;
  return typeof contentType === 'string' && contentType.startsWith('image/');
};

const run = async () => {
  let updated = 0;
  let skipped = 0;
  let totalSeen = 0;

  let failed = 0;

  for (const {prefix, cacheControl} of CACHE_POLICIES) {
    if (updated >= LIMIT) break;

    const [files] = await bucket.getFiles({prefix});
    totalSeen += files.length;
    console.log(`\n${prefix} — ${files.length} object(s)  ->  ${cacheControl}`);

    for (const file of files) {
      if (updated >= LIMIT) {
        console.log(`  reached --limit=${LIMIT}, stopping`);
        break;
      }

      if (!isImage(file)) {
        skipped += 1;
        continue;
      }
      if (file.metadata.cacheControl === cacheControl) {
        skipped += 1;
        continue;
      }

      if (DRY_RUN) {
        console.log(`  would update ${file.name}`);
        updated += 1;
        continue;
      }

      try {
        // PATCH that touches only `cacheControl`. Custom metadata — crucially
        // `firebaseStorageDownloadTokens`, which every stored download URL
        // depends on — is not in the request body and is left untouched.
        await file.setMetadata({cacheControl});
        updated += 1;
        if (updated % 25 === 0) {
          console.log(`  ...${updated} updated`);
        }
      } catch (error) {
        failed += 1;
        console.error(`  failed ${file.name}: ${error.message}`);
      }
    }
  }

  if (failed > 0) {
    console.warn(
      `\n${failed} object(s) failed. Re-run the same command — objects already ` +
        'carrying the header are skipped, so only the failures are retried.',
    );
  }

  console.log(
    `\n${DRY_RUN ? '[dry run] ' : ''}done — ${updated} updated, ${skipped} skipped.`,
  );

  // Zero objects across every prefix almost always means the bucket name is
  // wrong rather than that Storage is empty — say so instead of "done, 0".
  if (totalSeen === 0) {
    console.warn(
      `\nWarning: found 0 objects in "${bucketName}" across all prefixes.\n` +
        'Check the bucket name in the Firebase Console (Storage -> the gs:// URL\n' +
        'at the top). Older projects use <project>.appspot.com instead of\n' +
        '<project>.firebasestorage.app.',
    );
  }
};

run().catch(error => {
  console.error(error);
  process.exit(1);
});
