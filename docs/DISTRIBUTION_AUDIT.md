# Distribution audit — 12 November 2026

## Existing configuration and decisions

| Area                 | Finding and action                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager      | npm and package-lock.json; one root package.json. The application folders and packages/shared have no independent package manifests. No workspace migration needed.                                                                                                                                                                                       |
| Portal               | React/TypeScript; apps/demo-portal/vite.config.ts sets the application root and dist/portal output. Root package resolves shared dependencies.                                                                                                                                                                                                            |
| Extension            | scripts/build-extension.mjs uses esbuild directly, not Vite. Three independent entry points produce background.js, content.js and sidepanel.js/CSS. admin.html and generated PNG icons are included.                                                                                                                                                      |
| Shared contracts     | Both applications import packages/shared through relative TypeScript imports; both bundlers resolve and inline these files without a separately published package.                                                                                                                                                                                        |
| Development          | npm run build retains the local 127.0.0.1:5173 target. Vite's development server and local test URLs remain development-only.                                                                                                                                                                                                                             |
| Production           | Dedicated build:extension:production is independent of the portal. Default origin is the user's exact https://walk-me-demo-silk.vercel.app hostname; explicit PORTAL_ORIGIN overrides remain validated.                                                                                                                                                   |
| Permissions          | Generated MV3 manifest uses storage and one exact HTTPS host match. No all-URLs, wildcard Vercel domain, tabs permission, remote executable code, external-message bridge or browser sidebar permission added. Runtime checks retain exact origin validation.                                                                                             |
| Packaging            | Existing ZIP writer and release manifest/hash validation reused. Portal packaging is now optional so extension packaging does not depend on a portal build. Manifest is at archive root.                                                                                                                                                                  |
| Vercel               | Existing vercel.json retained; formatting only. Root is the folder containing package.json, install npm ci, build npm run build:portal, output dist/portal. Hash routing requires no rewrite.                                                                                                                                                             |
| Hosted compatibility | Public root responded 200. The deployed JS/CSS filenames matched the local portal build. Opt-in live Chromium integration check passed against the actual public URL, without network interception.                                                                                                                                                       |
| Privacy              | Release allowlist excludes source documents, screenshots, environment files, dependencies, test output and portal files. Only compiled runtime assets and license notices enter extension ZIPs. No client screenshot data was introduced. Public repository history and manually attached release files still require the owner's confidentiality review. |

No new dependencies, repository, backend, automatic deployment or release publication were introduced. Existing authoring, confirmation and workflow behavior was retained. The developer editor publishes settings locally in a browser; it is not an authenticated multi-user administration system.

## Modified files and reasons

- package.json: independent production extension build command.
- scripts/build-config.mjs and .env.example: assigned production hostname; development behavior retained.
- scripts/package-release.mjs: extension-only default; optional --include-portal preserves separate portal archives.
- tests/unit/build-config.test.mjs: assert the assigned default and retain invalid-origin/version checks.
- tests/e2e/hosted-production.spec.ts: opt-in real hosted portal integration check.
- README.md, PUBLISHING_GUIDE.md, INSTALLATION_GUIDE.md, RELEASE_CHECKLIST.md and this audit: commands, deployment settings, distribution and manual validation instructions.
- apps/extension/src/background/service-worker.ts, apps/extension/src/content/help-assistant.ts, apps/extension/src/sidepanel/AdminGuide.tsx, packages/shared/config.ts, scripts/build-extension.mjs, scripts/build-production.mjs, scripts/release-validation.mjs, scripts/zip.mjs, vercel.json and vitest.config.ts: formatting normalization only in this continuation; their existing production preparation was reused.

## Verification scope

The live hosted check covers announcement acknowledgement, Overview information layer, help panel, collaboration steps, participant tab navigation, linked rename with explicit user confirmation, automatic document search focus and production admin URL. The local suite additionally covers form confirmation, SmartTips, complete highlight boundaries, help stacking, asynchronous results, authoring, per-tab state and recovery.

Manual installed Chrome and Edge checks remain necessary: extracted ZIP installation, permission prompts, stable-directory updates, browser restart, zoom, keyboard use and organization policies. Automated Chromium is not a claim of manual Chrome/Edge completion. Island remains unverified. No public release or store submission has been performed.

See PUBLISHING_GUIDE.md for reproducible commands and docs/VERIFICATION.md for earlier workflow verification history.

## Recorded results

- Combined production build: passed; portal output dist/portal, extension output dist/extension.
- Dedicated production extension build and separate portal build path: verified through the existing build scripts; extension packaging no longer reads portal output unless explicitly requested.
- Development build: passed.
- Unit tests: 34 passed across 7 files.
- Complete local Chromium suite: 43 passed, 1 intentionally skipped opt-in hosted test.
- Live hosted production check: passed separately with HOSTED_SMOKE=1.
- TypeScript, ESLint and repository formatting checks: passed.
- npm audit: zero reported vulnerabilities across production and development dependencies.
- ZIP opened independently using .NET ZIP APIs: 11 runtime entries, valid root MV3 manifest and exact production hostname; no unrelated files.
- Initial Vite/Vitest sandbox temporary-file restrictions were resolved by rerunning with filesystem access. The first hosted test used an incorrect test-only information-layer ID; corrected to the existing smartguide-information ID and reran successfully.

These results do not replace the manual installed-browser checklist or authorize publication.
