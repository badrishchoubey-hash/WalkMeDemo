# Windchill SmartGuide

A standalone PLM demo portal and a separately installed Manifest V3 browser extension. Synthetic local data only. This is not an official PTC integration or a complete WalkMe replacement.

## Run the demo

Requires Node.js 22.12+ (or a compatible newer version) and npm.

```powershell
cd C:\AI_project\windchill-smartguide
npm install
npm run build
npm run dev
```

1. Open **http://127.0.0.1:5173**. Use this exact address, not localhost.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable **Developer mode**, choose **Load unpacked**, and select `C:\AI_project\windchill-smartguide\dist\extension`.
4. Refresh the portal tab. Pin SmartGuide through the browser's extensions menu and click its toolbar icon to open the side panel.
5. Start **Create a new part** from Overview or Parts. Open the form, then use **Fill demo values** or enter values yourself. Manually entered text steps advance when you leave the field. Select values advance on change.
6. Select **Review part**, inspect the summary, and click **Confirm create**. Autofill never submits.

After changing extension code: run `npm run build`, click Reload on the extension card, then refresh the portal. Portal code updates through Vite during development.

## Check the project

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Browser E2E tests use an isolated Chromium profile. Manual Chrome and Edge installation/side-panel smoke checks are still required before presenting. See [verification](docs/VERIFICATION.md) for the actual recorded results and remaining checks.

## Structure

- `apps/demo-portal`: React portal, forms, synthetic records, localStorage persistence.
- `apps/extension`: side panel, stateless worker, content script, DOM adapters, pure engine.
- `packages/shared`: message contracts and three versioned workflow definitions.
- `tests`: engine/trust-boundary unit tests and browser tests.
- `scripts/build-extension.mjs`: explicit bundled MV3 entry points using esbuild.

The small extension uses esbuild directly rather than an extension framework: there are three explicit entry points and no extension hot-reload requirement. Portal builds use Vite. Scoped CSS avoids introducing Tailwind resets into host pages.

## Permissions and data

`sidePanel` opens the extension UI. Host access is restricted to `http://127.0.0.1/*`; the content script and worker additionally enforce the exact `http://127.0.0.1:5173` origin before reading portal DOM or forwarding commands. No `tabs`, `scripting`, `<all_urls>`, storage, cookie, or network-service permissions are requested. Host access provides URL visibility for the supported tabs.

No analytics, AI calls, remote scripts, credentials, or production endpoints. Portal records remain in that portal origin's localStorage. Tour state is transient in each tab's isolated content script; no DOM snapshots or field values are persisted by the extension. Error messages contain step titles, not entered data.

## Lifecycle rules

- Close/reopen the panel: live tour remains in the tab; reopening queries its current state.
- Worker suspension/restart: tour continues because the worker owns no execution state.
- Switch tabs: each tab retains its own tour. Panel queries the active supported tab.
- Navigate to another portal route: running, paused, or failed tour cancels and removes guidance.
- Reload page: tour resets to idle; no form replay or automatic data changes.
- Pause: all step listeners, observers, timers, and overlays are removed. Resume re-resolves the current target. Actions performed while paused do not count.
- Missing target: ten-second bounded wait, then retry/cancel. Waiting for a person to act on an existing target has no timer.

## Learn and present

Read [architecture and decisions](docs/ARCHITECTURE.md), [your hands-on walkthrough](docs/LEARNING_GUIDE.md), and [the five-minute demo](docs/DEMO_SCRIPT.md).

## Limits

No real Windchill testing, nested-frame traversal, arbitrary host shadow-root discovery, enterprise distribution, workflow authoring studio, or production authentication. The local portal is the only supported target. WCAG conformance and performance are not certified. Browser brand compatibility must be checked on the installed versions.

## AI assistance

Codex assisted with implementation, documentation, and tests. Developer ownership should be demonstrated through review, understanding, changes, debugging, and verification. Do not describe this as code authored without AI assistance.
