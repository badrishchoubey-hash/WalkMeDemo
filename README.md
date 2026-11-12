# Windchill Extension Demo

A standalone PLM demo portal and a separately installed Manifest V3 browser extension. Synthetic local data only. This is not an official PTC integration or a complete WalkMe replacement.

The normal-user experience uses automatic contextual highlights and starts the published Parts, Documents, and Change Requests guide on tab entry. Documents focuses the search input. Escape cancels without restarting until another page entry; saved progress reloads paused. The tall floating **?** search panel is anchored inside the main section above annotations. There is no browser extension sidebar. The toolbar opens a separate developer/admin tab with local **Publish**, an automatic-entry preference, and **Sample documentation**. See [the current UI guide](docs/UI_REVISION.md) and [the November workflow handover](docs/NOVEMBER_POC.md).

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
4. Refresh the portal tab. Highlights appear automatically on supported fields. Click **?** to search available guidance. Open **Collaboration task** and select **See what's new with this task**. Follow Next to Setup Participants, then **Show me how** to rename the tab. The participant SmartTip links to sample process documentation.
5. Start **Create a new part** from Overview or Parts. Open the form, then use **Fill demo values** or enter values yourself. Manually entered text steps advance when you leave the field. Select values advance on change.
6. Select **Review part**, inspect the summary, and click **Confirm create**. Autofill never submits.
7. For authoring, click the extension toolbar icon (or its **Options** menu). Use **Create workflow** or **Edit selected workflow**, configure the steps, and **Save draft → Publish**. This editor updates guides in this browser without rebuilding; source-code changes still require a rebuild/reload.

### Show Important Information

On Parts, Documents, Change requests, and Setup Participants, subtle rings and small `i` buttons appear automatically beside configured fields. Hover an icon or focus it to read its title, current value, explanation, and documentation link where configured. Escape dismisses assistance. The search panel also offers Hide/Show Important Information for supported contexts.

Only existing fields are explained: part numbers, displayed revision/status labels, document identifiers/revisions/owners, and change identifiers/affected parts/statuses. The portal has no separate part-details page, lifecycle engine, last-modified field, or related-documents relationship; none was invented. Fixed `Released`, `In review`, and `A.1` labels are explicitly described as demonstration values.

The switch is independent of walkthrough controls. Running tours have visual priority, so information overlays hide temporarily during a running tour or an open modal form. They return when the tour pauses/ends and no modal is open. Disabling information does not cancel a tour. Counts reflect actual matching elements, including repeated rows.

Escape can hide highlights in the current tab. Navigation and reload enable automatic discovery again. Overview highlights the complete My tasks card and three statistics cards after the announcement closes. Asynchronous and empty results are handled automatically. Information values stay local and are never stored or sent to external services. No dependencies were added, and the sidebar permission was removed.

After changing extension code: run `npm run build`, click Reload on the extension card, then refresh the portal. Portal code updates through Vite during development.

## Check the project

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
$env:PLAYWRIGHT_BROWSERS_PATH = 'C:\AI_project\.cache\playwright'
npx playwright install chromium
npm run test:e2e
npm run build
```

Browser E2E tests use an isolated Chromium profile. Manual installed Chrome and Edge checks remain required before presenting. See [verification](docs/VERIFICATION.md) for recorded results.

## Structure

- `apps/demo-portal`: React portal, forms, synthetic records, localStorage records and per-tab sessionStorage drafts.
- `apps/extension`: separate admin tab, floating user help, worker, DOM adapters, pure engine, and session checkpoints.
- `packages/shared`: typed contracts, five versioned workflows, and local publication/release identities.
- `packages/shared/information-highlights.ts`: declarative selectors and information explanations.
- `apps/extension/src/content/information-controller.ts`: independent information lifecycle and tooltips, sharing selector, observer, and overlay primitives with tours.
- `tests`: engine/trust-boundary unit tests and browser tests.
- `scripts/build-extension.mjs`: explicit bundled MV3 entry points using esbuild.

The small extension uses esbuild directly rather than an extension framework: there are three explicit entry points and no extension hot-reload requirement. Portal builds use Vite. Scoped CSS avoids introducing Tailwind resets into host pages.

The neutral browser/information SVG is reused in the portal and panel. `scripts/generate-icons.mjs` creates PNG icons (16/32/48/128) during the existing build without a new dependency. Internal folders, message channels, overlay IDs, and storage namespaces retain their original names for compatibility. Supplied requirement files and previously generated PDFs are historical specifications/snapshots, not current display branding; use this README and current demo documentation when presenting.

## Permissions and data

`storage` is the only extension permission. It supports minimal per-tab guide checkpoints in `chrome.storage.session`, plus local release acknowledgment and published workflow availability. Host access is restricted to `http://127.0.0.1/*`; runtime checks enforce the exact `http://127.0.0.1:5173` origin. No `sidePanel`, `tabs`, `scripting`, `<all_urls>`, cookie, or network-service permissions are requested. Host access provides supported-tab URL visibility. Admin preview uses the active supported tab, or the most recently accessed supported tab in that window while the admin page is active.

No analytics, AI calls, remote scripts, credentials, or production endpoints. Portal records remain in that portal origin's localStorage. The portal independently stores its demo draft, review stage, success notice, and document search/detail context in that tab's sessionStorage. Drafts clear when their form closes, saves, or the route changes. The extension persists only schema/workflow versions, route, step ID, status, and last transition; no DOM snapshots or field values. A separate document-owner ID prevents late writes from an older document overwriting refreshed progress. Error messages contain step titles, not entered data.

## Lifecycle rules

- Close/reopen search: the live tour remains in the portal tab. Normal users do not open an extension sidebar.
- Worker suspension/restart: live tour continues in the content script; saved checkpoints remain in session storage.
- Switch tabs: each tab retains its own tour. Admin preview uses the active or most recently accessed supported portal tab in its window.
- Navigate to another portal route: running, paused, or failed tour cancels and removes guidance.
- Reload page: compatible guide progress returns **paused at the saved step**. The portal independently restores its unfinished form/review or document context. Select **Resume saved step** to continue; no clicks, autofill, or submissions are replayed. Completed guides remain completed.
- Recovery validates schema, workflow version, route, step ID, and current target. Incompatible checkpoints are discarded. If the page no longer has the saved target, resuming is refused with instructions to reopen the required form or cancel/restart.
- Cancelling or navigating away clears the active checkpoint. Closing a tab removes its extension checkpoint. Browser restart or extension reload clears extension session storage; cross-session recovery is outside this feature.
- Storage failure: an explicit warning says refresh recovery is unavailable; normal guidance can still run. Recovery is based on the last successfully saved checkpoint, not a guarantee against a browser crash during a write.
- Pause: all step listeners, observers, timers, and overlays are removed. Resume re-resolves the current target. Actions performed while paused do not count.
- Missing target: ten-second bounded wait, then retry/cancel. Waiting for a person to act on an existing target has no timer.

### Try refresh recovery

1. Start Create Part, open the form, enter a name, and move to Part number.
2. Refresh the portal. The draft and saved step return; the guide is paused.
3. Select **Resume saved step**, complete the form, and select Review part.
4. Refresh again: review returns, but no record is created until you explicitly confirm.

After installing this update, reload the extension card and refresh the portal once before starting a new tour. Existing tours from the previous version have no saved checkpoint. Previously generated presentation PDFs describe the old reset-on-refresh behavior and are historical snapshots.

## Learn and present

Read [architecture and decisions](docs/ARCHITECTURE.md), [your hands-on walkthrough](docs/LEARNING_GUIDE.md), and [the five-minute demo](docs/DEMO_SCRIPT.md).

## Limits

No real Windchill testing, nested-frame traversal, arbitrary host shadow-root discovery, enterprise distribution, workflow authoring studio, or production authentication. The local portal is the only supported target. WCAG conformance and performance are not certified. Browser brand compatibility must be checked on the installed versions.

## AI assistance

Codex assisted with implementation, documentation, and tests. Developer ownership should be demonstrated through review, understanding, changes, debugging, and verification. Do not describe this as code authored without AI assistance.
