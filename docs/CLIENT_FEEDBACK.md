# Client feedback implementation

## Delivered behavior

The visible name is **Windchill Extension Demo**, shortened to **Extension Demo** in the portal sidebar. A neutral browser/information SVG replaces the letter logo. The existing build generates four PNG icon sizes for the manifest and toolbar. There is no new icon dependency or additional permission. The portal, panel, browser titles, guide overlay, relevant errors, README, and demo script use neutral naming and retain proof-of-concept disclaimers.

**Show Important Information** is a separate side-panel switch. It explains existing table/list fields without starting a tour. Current values are read only from configured `data-info` elements and rendered with textContent. No values leave the page or enter extension storage. The tooltips explicitly distinguish static demo statuses/revisions from a real lifecycle policy.

## Feature architecture

1. The panel sends typed `SET_INFORMATION_HIGHLIGHTS` through the existing worker router.
2. The content script owns an independent information controller and reports its state/count in context replies.
3. Route-specific declarative definitions select actual portal fields through the shared selector utility.
4. A shared, root-scoped observer coalesces mutations and ignores extension overlay hosts. Reconciliation preserves unchanged icons, disposes removed entries/listeners, and adds new ones.
5. Shared Shadow DOM/viewport primitives isolate and position the visuals. Scroll and resize schedule position updates, not polling scans.
6. Hover/focus opens a tooltip; Escape dismisses it without moving focus. Hover remains available while moving onto the tooltip. Disabling cleans up the layer, event listeners, observers, resize observation, and timers.

Walkthroughs have visual priority: information visuals hide during running tours or open native modal dialogs. The toggle remains enabled independently and restores highlights after those interruptions. Turning it off cannot cancel a tour. It remains per tab across SPA navigation and resets off on page reload; guide checkpoint recovery has its own existing policy.

## Files created

| File                                                                   | Purpose                                           |
| ---------------------------------------------------------------------- | ------------------------------------------------- |
| `packages/shared/information-highlights.ts`                            | Definitions and feature state type                |
| `packages/shared/demo-icon.tsx`                                        | Shared neutral SVG                                |
| `apps/extension/src/content/information-controller.ts`                 | Independent information assistance lifecycle      |
| `apps/extension/src/content/dom-observer.ts`                           | Shared scoped/coalesced DOM observation           |
| `apps/extension/src/content/overlay-primitives.ts`                     | Shared isolated host and viewport placement       |
| `scripts/generate-icons.mjs`                                           | Dependency-free PNG asset generation              |
| `tests/e2e/extension-fixture.ts`                                       | Extracted existing fixture, reused by both suites |
| `tests/e2e/information.spec.ts`                                        | Seven browser scenarios for both feedback items   |
| `tests/unit/information.test.ts`                                       | Five contract/configuration/placement tests       |
| `docs/CLIENT_FEEDBACK.md`                                              | Implementation and demonstration reference        |
| `artifacts/information-panel.png`, `artifacts/information-tooltip.png` | Verified screenshots                              |

## Files modified

- `apps/demo-portal/index.html`, `src/main.tsx`, `src/styles.css`: neutral display branding, reusable icon, existing-field annotations, and label fitting. No new domain fields or business behavior.
- `apps/extension/public/manifest.json`, `sidepanel.html`: neutral name/title/description and generated icon references.
- `apps/extension/src/sidepanel/main.tsx`, `styles.css`: neutral header plus toggle, support/count/empty/suspended status.
- `apps/extension/src/background/service-worker.ts`, `storage/session-checkpoints.ts`: neutral user-facing error labels; routing/storage behavior preserved.
- `apps/extension/src/content/content-script.ts`: information controller integration and shared observer use. Tour engine and checkpoint contracts remain independent.
- `apps/extension/src/content/selector-resolver.ts`, `overlay-manager.ts`: reuse multi-target resolution and shared overlay primitives; neutral walkthrough metadata.
- `packages/shared/workflow-types.ts`: validated toggle payload and optional information state in replies.
- `scripts/build-extension.mjs`: generate packaged icons during the existing build.
- `tests/e2e/extension.spec.ts`: import the extracted fixture without changing existing scenarios.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/DEMO_SCRIPT.md`, `docs/VERIFICATION.md`: current behavior, compatibility choices, instructions, and actual results.
- Existing portal/panel/form screenshots in `artifacts/`: refreshed with the neutral UI.

Internal channels, storage keys, directory names, and existing overlay IDs retain their original names for compatibility. Supplied requirement files and earlier exact-copy PDFs remain historical documents rather than being silently rewritten.

## Verification and limits

- Build and strict TypeScript: passed.
- ESLint and Prettier: passed.
- Unit tests: 21 passed.
- Full Playwright Chromium suite: 26 passed.
- New renderings and icon inspected visually; tooltip stacking also checked by hit testing.

This targets the local demo only. Overview is intentionally an unconfigured information context. The portal has no separate part-details page, lifecycle transitions, last-modified field, or related-documents relationship. Those fields were not added. Browser tests exercise the panel HTML as an extension tab; manual Chrome/Edge toolbar/sidebar mounting and full screen-reader checks remain release checks.

## Demonstrate it

1. Run `npm run dev` if the portal is not running. The production extension is already rebuilt under `dist/extension`.
2. Reload the existing unpacked extension in `chrome://extensions` or `edge://extensions`, then refresh `http://127.0.0.1:5173`.
3. Verify the neutral name/icon and open Parts.
4. Enable **Show Important Information**. Hover a part number, then focus Revision or Part status. Show the current value and explanation; press Escape.
5. Filter the table to show that highlights update. Navigate to Documents and Change requests for their corresponding fields.
6. Start a tour to show visual priority. Pause before opening a form, or complete the tour, to restore information visuals.
7. Disable the switch to remove the feature. Refresh resets it off. An existing saved guide still follows its separate paused-recovery rules.
