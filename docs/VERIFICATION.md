# Verification record

Verified on Windows on 2026-11-07 with Node 26.13.0 and npm 12.2.1.

## Automated checks

- TypeScript strict checks: passed.
- Portal production build and locally bundled MV3 extension: passed.
- ESLint: passed (final rerun recorded in the development session).
- Prettier: passed for project source; supplied specification documents are preserved verbatim and excluded from formatting.
- Unit tests: 8 passed, covering ordered completion, wrong/duplicate events, pause/cancel, retry/restart, exact origin checks, message validation, routes, and workflow validation.
- Browser tests: 10 passed in Playwright Chromium 158.0.8127.18. Includes real unpacked extension messaging and all three workflows, React autofill, user-confirmed creation, missing-target timeout/retry, pause/resume, route cancellation, reload reset, tab isolation, and independent portal operation.
- Additional modal overlay hit-testing verifies guidance stays above native dialogs and accepts pointer input.
- Dependency installation after updates: npm audit reported 0 known vulnerabilities. This is an advisory database result, not a security certification.
- Rendered screenshots inspected: overview, panel, and highlighted Create Part form. Screenshots in `artifacts/`.

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
