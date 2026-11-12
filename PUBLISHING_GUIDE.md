# Build and distribute

Run commands from the directory containing the root `package.json`. Use Node.js 22.12+ and npm. Install locked dependencies with `npm ci`.

## Extension

```powershell
npm run build:extension:production
npm run package:release
```

The production default is `https://walk-me-demo-silk.vercel.app`. To target a different deployment, set `$env:PORTAL_ORIGIN='https://your-exact-host.example'` before both commands. Node scripts read the environment; copying `.env.example` does not automatically load it. Changing the host requires rebuilding and redistributing the extension. Preview deployments are deliberately not wildcarded.

`dist/extension` is the unpacked extension. `dist/releases/windchill-extension-demo-0.1.0-unpacked.zip` is the user download. Its root contains `manifest.json`, bundled JavaScript/CSS, admin HTML, icons and license notices. The packager validates Manifest V3, least privileges, build hashes and the file allowlist. It excludes source files, environment files, dependencies, screenshots and portal files. Compiled JavaScript necessarily remains in the extension.

Version comes from root `package.json`. Before a subsequent release, run `npm version patch --no-git-tag-version`, then rebuild. Versioned filenames follow that value. `SHA256SUMS.txt` and `release-info.json` record the artifact hashes, target origin and sizes. The identical `-store.zip` is preparation only; generating it does not submit or approve a store listing.

## Portal and Vercel

```powershell
npm run build:portal
```

Output is `dist/portal`; no extension build is required. `npm run build:production` builds both applications. Optional `npm run package:release -- --include-portal` also archives a previously built portal separately.

Use the existing GitHub repository in Vercel. Root Directory must be the directory containing this `package.json` and `vercel.json`: `.` when the repository root is this project, or `windchill-smartguide` when nested. Do not select `apps/demo-portal`, because shared imports and the lockfile are above it.

| Setting          | Value                                             |
| ---------------- | ------------------------------------------------- |
| Framework        | Vite                                              |
| Install command  | `npm ci`                                          |
| Build command    | `npm run build:portal`                            |
| Output directory | `dist/portal`                                     |
| Node.js          | A Vercel-supported version satisfying Node 22.12+ |

`vercel.json` already supplies build/output settings and security headers. Routes use `/#/parts`, `/#/task`, etc.; fragments are handled in the browser, so no SPA rewrite is needed. Assets use root-relative URLs suitable for this root-hosted deployment. See [Vercel's Vite documentation](https://vercel.com/docs/frameworks/frontend/vite).

Deploy only after reviewing the changes. Keep the production alias `walk-me-demo-silk.vercel.app` attached to the intended project. There are no required portal secrets or backend services.

## Existing GitHub repository release

1. Review and commit the intended source changes in the existing repository. Do not upload internal requirements, client screenshots, test profiles or historical artifacts without a confidentiality review.
2. Run validation and build the production extension. Inspect `release-info.json` for the exact hostname and version.
3. In that repository, open Releases → Draft a new release. Select/create the version tag for the reviewed commit.
4. Attach the `-unpacked.zip`, `SHA256SUMS.txt`, `release-info.json`, and installation instructions. The separate store ZIP need not be attached for user installation.
5. Explain that this is an independent synthetic demonstration requiring Developer mode and the specified hosted portal. Review the draft before manually publishing it.

GitHub's automatically generated source archives are not the installable extension. Distribution through Releases does not install updates automatically. Users replace their extracted files, reload the extension, and refresh portal tabs. Keep a stable extracted directory to preserve the unpacked extension identity where supported.

## Verification

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run test:e2e
npm run build:extension:production
$env:HOSTED_SMOKE='1'
npx playwright test tests/e2e/hosted-production.spec.ts
Remove-Item Env:HOSTED_SMOKE
npm run package:release
```

Ordinary E2E tests require the local development extension built by `npm run build`. The hosted test is opt-in and requires a production extension plus internet access. Do not run the local suite with a production-only host manifest. Installed Chrome and Edge installation, site-access prompts, reload/update, browser restart, zoom and narrow-window checks remain manual release checks. Island compatibility is unverified. Nothing in these scripts creates a repository, deploys, uploads or publishes a release.
