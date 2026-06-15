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
GOOGLE_SHEETS_ID="your-sheet-id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
APP_SECRET="change-this-long-random-secret"
YOUTUBE_API_KEY="optional-youtube-data-api-key"
GOOGLE_DRIVE_CLIENT_ID="oauth-client-id"
GOOGLE_DRIVE_CLIENT_SECRET="oauth-client-secret"
GOOGLE_DRIVE_REFRESH_TOKEN="oauth-refresh-token"
GOOGLE_DRIVE_FOLDER_ID="optional-google-drive-folder-id"
```

If these variables are missing, the app uses mock data from `src/lib/mock-data.ts` so local development still works.
`YOUTUBE_API_KEY` is optional, but required when you want upload date and view count to come from the real YouTube Data API instead of stored values.
`GOOGLE_DRIVE_FOLDER_ID` enables persistent image uploads to Google Drive through OAuth. If Drive env is missing, uploads fall back to `public/uploads` for local development only.

## Google Sheets

Create sheets with these tab names:

- `users`
- `admins`
- `knowledge`
- `profiles`
- `news`
- `categories`
- `audit_logs`
- `preview_tokens`

The headers are defined in `src/lib/google-sheets.ts`. Share the Sheet with the service account email as Editor.

## Google Drive Uploads

The upload API optimizes images with `sharp`, uploads WebP files to the configured My Drive folder using OAuth refresh tokens, makes each file readable by link, and stores the public image URL in Google Sheets. Google Sheets still uses the service account integration unchanged.

Required outside Codex:

- Enable Google Drive API in Google Cloud.
- Create an OAuth Client ID/Secret, typically Web application or Desktop app for token generation.
- Use OAuth Playground or a small local OAuth script to authorize the Drive scope `https://www.googleapis.com/auth/drive`.
- Exchange the authorization code for a refresh token.
- Add `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`, and `GOOGLE_DRIVE_FOLDER_ID` to local and production environment variables.
- The refresh token must belong to the Google account that owns or can write to the target My Drive folder.

## Architecture

- UI primitives: `src/components/ui`
- Shared layouts/cards/navigation: `src/components/shared`
- Admin reusable manager: `src/components/admin/AdminResourceManager.tsx`
- Business logic: `src/lib/visibility.ts`, `src/lib/publish.ts`
- Data layer: `src/lib/google-sheets.ts`
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
- Create a Google Cloud service account.
- Share the Google Sheet with the service account email.
- Add production environment variables in the hosting provider.

## Notes

- Local uploads are only a fallback for development. Production should use `GOOGLE_DRIVE_FOLDER_ID` so uploaded images survive restart/redeploy.
- YouTube metadata in mock mode uses stored upload date/view count. A YouTube Data API adapter can be added later without changing UI cards.
