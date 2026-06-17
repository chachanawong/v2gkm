# V2G KM

Production-ready starter for a compact V2G knowledge management web app built with Next.js App Router, React, TypeScript, API Routes, Google Sheets, Google Drive image upload, RBAC, secure preview tokens, and reusable UI/business/data layers.

## Stack

- Frontend: Next.js App Router, React, TypeScript
- Backend: Next.js API Routes
- Database: Google Sheets with mock-data fallback
- Auth: user phone login, admin email/password login
- Storage: Google Drive uploads with local fallback, optimized to WebP through `sharp`
- Font: Google Sans Thai preferred in CSS, `Noto Sans Thai` loaded through `next/font`

## Demo Accounts

- General user: `0811111111`
- Silver user: `0822222222`
- Platinum user: `0833333333`
- Admin: `admin@v2g.local` / `admin1234`

## Environment

Create `.env.local`:

```bash
GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/your-deployment-id/exec"
GOOGLE_SCRIPT_SECRET="shared-secret-between-app-and-script"
APP_SECRET="change-this-long-random-secret"
YOUTUBE_API_KEY="optional-youtube-data-api-key"
GOOGLE_DRIVE_CLIENT_ID="oauth-client-id"
GOOGLE_DRIVE_CLIENT_SECRET="oauth-client-secret"
GOOGLE_DRIVE_REFRESH_TOKEN="oauth-refresh-token"
```

Recommended setup is to let both local and production talk to the same Apps Script deployment. That keeps Google Sheet access centralized and avoids duplicating Spreadsheet credentials/config in Railway.
If these variables are missing, the app uses mock data from `src/lib/mock-data.ts` so local development still works.
`YOUTUBE_API_KEY` is optional, but required when you want upload date and view count to come from the real YouTube Data API instead of stored values.
Admin uploads are hard-wired to Google Drive folder `1by5EUSXxgd39h1sN6CTXesfg77XYqMxk`. If Drive OAuth env is missing, uploads fall back to `public/uploads` for local development only.

Optional direct Google Sheets fallback:

```bash
GOOGLE_SHEETS_ID="your-app-sheet-id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Use the direct Sheets fallback only when Apps Script is unavailable.

## Google Sheets

Create sheets with these tab names:

- `users`
- `admins`
- `knowledge`
- `profiles`
- `news`
- `categories`
- `events`
- `event_registrations`
- `learning_paths`
- `lessons`
- `user_progress`
- `audit_logs`
- `preview_tokens`
- `user_pins`
- `register`

The headers are defined in `src/lib/google-sheets.ts`. If you use the direct Sheets fallback, share the Sheet with the service account email as Editor.

## Google Drive Uploads

The upload API optimizes images with `sharp`, uploads WebP files to the configured My Drive folder using OAuth refresh tokens, makes each file readable by link, and stores the public image URL in Google Sheets.

Required outside Codex:

- Enable Google Drive API in Google Cloud.
- Create an OAuth Client ID/Secret, typically Web application or Desktop app for token generation.
- Use OAuth Playground or a small local OAuth script to authorize the Drive scope `https://www.googleapis.com/auth/drive`.
- Exchange the authorization code for a refresh token.
- Add `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, and `GOOGLE_DRIVE_REFRESH_TOKEN` to local and production environment variables.
- The refresh token must belong to the Google account that owns or can write to the target My Drive folder.

## Architecture

- UI primitives: `src/components/ui`
- Shared layouts/cards/navigation: `src/components/shared`
- Admin reusable manager: `src/components/admin/AdminResourceManager.tsx`
- Business logic: `src/lib/visibility.ts`, `src/lib/publish.ts`
- Data layer: `src/lib/google-sheets.ts`
- Shared Apps Script deployment: `apps-script-full-deploy.js`
- Auth/audit/content helpers: `src/lib/auth.ts`, `src/lib/audit.ts`, `src/lib/content.ts`
- API routes: `src/app/api`

Visibility and publish rules are centralized. Draft content is hidden from user APIs unless accessed through a valid preview token.

## Local Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify

```bash
npm run lint
npm run build
```

## Deploy From Terminal

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Login:

```bash
vercel login
```

3. Add environment variables:

```bash
vercel env add GOOGLE_SCRIPT_URL
vercel env add GOOGLE_SCRIPT_SECRET
```

If you are using the optional direct Sheets fallback, also add:

```bash
vercel env add GOOGLE_SHEETS_ID
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
vercel env add GOOGLE_PRIVATE_KEY
```

4. Deploy preview:

```bash
vercel
```

5. Deploy production:

```bash
vercel --prod
```

## Manual Setup Needed Outside Codex

- Create the Google Sheet and tabs.
- Deploy `apps-script-full-deploy.js` to Google Apps Script and keep its `SPREADSHEET_ID` pointed at the single source-of-truth sheet.
- Add `GOOGLE_SCRIPT_URL` and `GOOGLE_SCRIPT_SECRET` to local and production env.
- Create a Google Cloud service account only if you want the optional direct Sheets fallback.

## Notes

- Local uploads are only a fallback for development. Production should keep Google Drive OAuth configured so uploaded images survive restart/redeploy.
- YouTube metadata in mock mode uses stored upload date/view count. A YouTube Data API adapter can be added later without changing UI cards.
