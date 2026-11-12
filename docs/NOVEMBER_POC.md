# November POC handover

**Current UI revision:** see [User and developer interfaces](UI_REVISION.md). The screenshots have now been reviewed, the browser sidebar has been removed, automatic highlights are enabled, ? opens search, and publishing/reset/documentation controls live in a separate admin tab. Earlier UI and verification descriptions below record the initial increment and are superseded by that guide and the latest verification entry.

All task names, participants, instructions, and documentation are synthetic. No client assets, document numbers, production URLs, or business rules were copied. Only the text brief was attached; no reference screenshot or recording was available for visual comparison. The task layout is representative, not a Windchill reproduction.

## Inspection and scope

The existing React portal, declarative workflow definitions, pure transition engine, DOM selector resolver, Shadow DOM overlays, information controller, typed messaging, and per-tab service-worker checkpoints were reused. Parts, Documents, and Change Requests remain independent portal features and retain their guides.

The missing capabilities were an on-page workflow launcher, collaboration task screens, linked rename guidance, release announcement, and document links in information tooltips. The implementation extends those existing modules without new dependencies, remote services, or additional extension permissions. Initial baseline: 21 unit tests and production build passed.

Implementation order: protect the baseline; add task DOM and configurable steps; connect the floating assistant; implement announcement persistence and SmartTip links; verify transitions and regressions; prepare this handover. This is a focused POC increment. Production adaptation needs a separately scoped DOM and browser assessment; the Friday deadline is not evidence of production readiness.

## Architecture and changed modules

| Module                                                                   | Responsibility                                                                                                                            |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/demo-portal/src/components/CollaborationTask.tsx`                  | Independent task tabs, customization menu, rename dialog, sample documentation                                                            |
| `apps/demo-portal/src/task.css`, `main.tsx`                              | Representative enterprise task layout, navigation and home task entry                                                                     |
| `packages/shared/workflows.ts`, `workflow-types.ts`                      | New route/ID contracts; tour and rename definitions; manual Next, configured navigation, autofill, linked workflow, expected visible text |
| `apps/extension/src/content/help-assistant.ts`                           | Isolated floating launcher, relevant workflows, lifecycle controls, release announcement and local acknowledgment                         |
| `apps/extension/src/content/content-script.ts`                           | Authoritative per-tab state, DOM actions and validation, linked transition, lifecycle cleanup                                             |
| `apps/extension/src/content/overlay-manager.ts`                          | Existing anchored rings and tooltips extended with informational Next/Show me how                                                         |
| `apps/extension/src/content/autofill.ts`                                 | Allowlisted example tab-name entry through native input events                                                                            |
| `packages/shared/information-highlights.ts`, `information-controller.ts` | Participant instruction highlight with a same-origin sample document hyperlink                                                            |
| `tests/e2e/collaboration.spec.ts`, `tests/unit/engine.test.ts`           | New browser acceptance scenarios and unsupported-route expectation                                                                        |

The content script owns guidance; the portal contains no walkthrough logic. Both the floating assistant and retained side panel call the same command handler. Existing service-worker checkpoint storage owns minimal per-tab recovery records; announcements use extension local storage with a versioned key containing the independent release identity. Host data is never sent externally. Scope remains the exact local portal origin.

## Workflow behavior

**Collaboration tour:** contextual launcher → task summary → updated instructions → Next clicks the configured Setup Participants tab → wait for participant instructions → Did you know → Show me how. The parent completes before the linked child starts. This explicit finish-parent policy avoids simultaneous tours.

**Rename:** click Customize tab → click Rename → allowlisted example `Review team` is filled and validated → click OK → verify the visible tab label → completion. Only user confirmation saves. Incorrect clicks do not progress. Cancel or Escape exits safely; missing targets time out with retry/exit controls. A cancelled rename keeps its previous name.

**Announcement:** open Overview → process update and working local document links → explicitly Acknowledge. Closing does not acknowledge. The same release remains acknowledged across refreshes. Help → Reset release announcement for demo removes only this release's acknowledgment. Local sample pages explain that no official quality policy or latest-revision resolution is implemented.

**SmartTip:** on Setup Participants, Help → Show Important Information. Hover, focus, or click the participant information icon; read the visible instructions and open the sample process guide. Existing information highlighting remains available on other supported pages.

## Coverage and limitations

| Capability                             | Implementation and verification scope                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Floating workflow launcher and context | Implemented; browser scenario runs after closing the fixture's panel                                    |
| Highlighting and anchored tooltips     | Reused; shared scroll/resize positioning and target replacement                                         |
| Collaboration tour and tab continuity  | Implemented; automatic navigation occurs only after Next                                                |
| Linked walkthrough                     | Implemented with finish-parent policy                                                                   |
| Validated rename                       | Actual target clicks, native field events, user OK, then label verification                             |
| Release announcement                   | Separate popup, local acknowledgment per release, explicit reset                                        |
| SmartTips and hyperlinks               | Participant instructions plus working same-origin sample documentation                                  |
| Existing workflows                     | Preserved and included in regression suite                                                              |
| Refresh recovery                       | Existing paused checkpoint policy reused; missing task tabs/dialogs must be restored or guide restarted |
| Browser support                        | Automated Chromium verification; manual installed Chrome and Edge checks still required                 |
| Production integration                 | Excluded; no real Windchill selectors, frames, authentication or customer systems verified              |

The task tab name lives in React state and resets when the task component remounts. A full refresh restores guidance paused, but does not reconstruct a task customization menu or dialog. Exit and restart if the saved target is unavailable. Refresh open portal tabs after disabling or reloading the extension; automatic removal of already injected DOM on browser-level disable is not implemented. Side-panel compatibility is retained. Configure the launcher's corner through the `position` argument in `createHelpAssistant` (default left). No full-page cross-origin navigation or real workflow policy is claimed.

Authoring, publishing, AI guidance, analytics, feedback collection, SSO, enterprise rollout, and real Windchill integration remain future work.

## Setup and six-minute demo

Run `npm run build`, then `npm run dev`. Load `dist/extension` unpacked through `chrome://extensions` or `edge://extensions`, refresh `http://127.0.0.1:5173/#/dashboard`, and leave the browser side panel closed. After extension changes, rebuild, reload the extension card, and refresh the portal. Use only synthetic demo data while recording.

1. **0:00–0:45 — Introduction and release.** Explain the independent portal and extension. Open the release links, then Acknowledge. Refresh to demonstrate persistence. This popup communicates an update without changing a record.
2. **0:45–1:30 — Floating help.** Open ? to show relevant workflows and local documentation. Navigate to Collaboration task and show the contextual launcher. Explain deterministic route/DOM detection.
3. **1:30–3:00 — Guided tour.** Start See what's new; use Next through task instructions. The extension highlights real elements, navigates to Setup Participants, and resolves the new content.
4. **3:00–4:15 — Linked rename.** Select Show me how. Click Customize tab and Rename. Show the example text, then personally click OK. Point out label verification and the completion message.
5. **4:15–5:15 — SmartTip.** Enable Show Important Information; open the participant tip and its sample document link. Explain that the extension supplies links and does not resolve real document revisions.
6. **5:15–6:00 — Reliability and reset.** Restart Rename, then Cancel to show cleanup. Explain the minimal checkpoint, Shadow DOM isolation, and user confirmation boundary. Return to Overview and reset the release for another recording.

If a target is missing, restore the expected task tab/dialog and choose Retry in Help, or Exit guidance and restart. If the extension is not visible, confirm the exact origin, reload the extension card, and refresh. No production connection is needed.

## Verification

Final automated results on 2026-11-12, Windows: **24 unit tests and all 33 Chromium browser tests passed**. Strict TypeScript, production portal/extension build, ESLint, and repository-wide Prettier checks also passed. The collaboration screenshot was inspected. No installed Chrome or Edge manual verification is claimed.

Run `npm run build`, `npm test`, `npm run lint`, `npm run format:check`, and `npm run test:e2e`. Playwright requires `npx playwright install chromium` first. Do not change `PLAYWRIGHT_BROWSERS_PATH` between installing and running unless the binaries are installed there too. The new browser cases cover the entire floating-only tour, wrong clicks, acknowledgment persistence/reset, SmartTip document link, and cancelled rename. Final results are recorded after the completed verification run; manual Chrome/Edge, extension disable/re-enable, screen-reader review, and performance measurements remain unverified unless separately reported.

AI assistance was used to implement this increment; reviewers should inspect the definitions and browser scenarios before presenting it as verified integration.
