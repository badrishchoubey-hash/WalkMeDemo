# Verification record

Latest client-feedback verification: Windows, 2026-11-09, Node 26.13.0 and npm 12.2.1. Original MVP baseline was verified on 2026-11-07.

## Automated checks

Neutral branding and contextual information, 2026-11-09: production build/strict TypeScript, ESLint, Prettier, all **21 unit tests**, and the full **26 browser tests** passed. New checks cover display titles/logos, generated manifest icon paths/PNG sizes, unchanged permissions, side-panel toggle, actual counts, tooltip hover/focus/Escape, current values and literal unsafe-text rendering, dynamic insertion/removal/replacement and React filtering, repeated toggling, unsupported contexts, async documents, change statuses, multi-tab isolation, viewport placement, tooltip stacking hit tests, and walkthrough coexistence/priority. Existing tours, validation, and refresh recovery remain covered.

Rendered neutral portal/panel, manifest icon, and contextual tooltip screenshots were inspected. Updated screenshots are in `artifacts/`, including `information-panel.png` and `information-tooltip.png`. Real Chrome/Edge toolbar mounting and full screen-reader/accessibility conformance still require manual verification. No new permissions/dependencies were added. Original requirement documents and earlier PDFs remain historical snapshots; current UI/demo docs use Windchill Extension Demo.

## Earlier verification history

Part-number pattern fix, 2026-11-09: reproduced the original invalid `/v` expression in Chromium, then escaped the literal hyphen. All 16 unit tests and 4 targeted browser tests passed (new pattern regression, required/duplicate validation, real extension creation, and refresh at confirmation). Build, TypeScript, lint, and formatting passed. The expanded full 19-test browser suite was not rerun for this small fix; the 18-test baseline below is the preceding full run.

- TypeScript strict checks: passed.
- Portal production build and locally bundled MV3 extension: passed.
- ESLint: passed (final rerun recorded in the development session).
- Prettier: passed for project source; supplied specification documents are preserved verbatim and excluded from formatting.
- Unit tests: 16 passed, including the original engine/trust-boundary cases plus checkpoint version/route/step validation, safe paused recovery, completed/cancelled handling, draft validation, and document-context validation.
- Browser tests: all 18 passed together in Playwright Chromium 158.0.8127.18. Covers the original workflows and resilience plus refresh during input/review, preserved document search, restored change review, completion without duplicate records, missing restored targets, cancel clearing, incompatible checkpoints, tab isolation after reload, independent portal drafts, and visible storage failure.
- Additional modal overlay hit-testing verifies guidance stays above native dialogs and accepts pointer input.
- Dependency audit on 2026-11-07 reported 0 known vulnerabilities; not rerun for this change. This is an advisory database result, not a security certification.
- Rendered screenshots inspected: overview, panel, and highlighted Create Part form. Screenshots in `artifacts/`.
- Refresh-recovery panel screenshot inspected during the new browser test: restored step, paused state, and Resume saved step are visible without an overlay or replay.

The extension tests run the side-panel HTML as an extension tab to exercise its React UI and runtime sender identity. They do not automate clicking a branded browser's toolbar icon or prove its native sidebar mounting.

## Scope limitations in the tests

The unsupported-origin browser check uses about:blank; exact alternate ports and external origin rejection are unit tested. Active target re-resolution is implemented, but the replacement browser scenario currently exercises replacement while paused before resume. Worker restart, full accessibility, and measured overhead remain manual checks below.

## Manual release checks

- Chrome: unpacked install, toolbar icon opens side panel, all three workflows.
- Edge: unpacked install, toolbar icon opens sidebar, all three workflows.
- Keyboard: form focus, Tab order, Escape/cancel, visible focus, zoom.
- Screen reader: labels and step/success announcements.
- Worker restart during an active tour; close/reopen panel.
- DevTools overhead and packaged asset/permission review.

Do not mark these passed based only on a successful build or headless test.
