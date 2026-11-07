# Windchill SmartGuide — Project Requirements

**Version:** 1.0  
**Status:** Proposed MVP  
**Project type:** Chrome / Microsoft Edge browser extension (Manifest V3) + standalone Windchill-like demo portal

## 1. Project overview

Build a standalone, production-minded browser extension that demonstrates selected WalkMe-style digital adoption capabilities for a Windchill-like Product Lifecycle Management (PLM) application. The extension will provide context-aware, step-by-step guidance, DOM-driven interaction, and safe workflow assistance.

The project is a **proof of concept**, not an official PTC Windchill integration or a complete WalkMe replacement. It must work with a separately developed demo portal so that it can be demonstrated without client credentials or access to a production environment.

## 2. Objectives

1. Demonstrate hands-on Chrome/Edge extension development using Manifest V3, browser APIs, content scripts, and service workers.
2. Demonstrate strong TypeScript, JavaScript, React, DOM manipulation, and event handling skills.
3. Build a reusable, configurable workflow guidance engine instead of hardcoding every tour.
4. Demonstrate reliable behavior on dynamic React pages and graceful handling of missing or changing DOM elements.
5. Showcase safe, user-approved automation and practical extension security.
6. Provide a polished client demo and engineering artifacts that explain architecture and implementation choices.

## 3. Target users

- **End user:** Employee working in a Windchill-like PLM portal who needs help completing tasks.
- **Demo presenter / developer:** Engineer showcasing extension implementation, debugging, testing, and architectural decisions.
- **Future workflow administrator (post-MVP):** Person configuring tours and contextual guidance without changing extension source code.

## 4. Solution scope

### 4.1 Deliverables

- **Demo portal:** Separate React + TypeScript web app with Parts, Documents, and Engineering Change Requests pages; seeded mock data; functional forms and navigation.
- **Browser extension:** Installable unpacked Chrome/Edge MV3 extension with a React side panel, content script, background service worker, workflow engine, and contextual UI overlays.
- **Workflow definitions:** Declarative TypeScript or JSON-compatible configurations for at least three guided workflows.
- **Automated tests:** Unit and end-to-end tests covering normal flows and critical failure scenarios.
- **Documentation:** README, installation instructions, architecture overview, permissions/security explanation, demo script, known limitations, and AI-assistance disclosure.

### 4.2 MVP features (P0)

#### FR-01: Extension setup and browser compatibility
- Use Manifest V3.
- Load and run as an unpacked extension in recent stable Chrome and Edge versions.
- Request only permissions required for the demo; restrict host access to the local demo portal origin.
- Provide a React-based extension side panel.
- Communicate between side panel, service worker, and content script with typed messages.

**Acceptance criteria:** Extension loads without manifest errors; side panel opens; supported portal tabs can exchange messages with the extension; unsupported sites are not modified.

#### FR-02: Demo PLM portal
- Implement a dashboard and navigation for Parts, Documents, and Change Requests.
- Parts page: searchable table, create-part dialog/form, validation, and success state.
- Documents page: searchable list and document detail view.
- Change Requests page: list and create-request form.
- Use local mock data; persistence may use localStorage or an in-memory mock API.
- Include stable `data-guide` selectors on selected demo elements.
- Include at least one asynchronously rendered element or React rerender scenario for robustness testing.

**Acceptance criteria:** Each page and required form works independently when the extension is disabled.

#### FR-03: Context awareness
- Detect the supported portal origin, active page/route, and relevant visible UI state.
- Display only workflows applicable to the current context.
- Refresh context when the SPA route changes, without requiring a full-page reload.

**Acceptance criteria:** Navigating among Parts, Documents, and Change Requests updates available workflows appropriately.

#### FR-04: Guided walkthrough engine
- Define workflows as ordered steps with identifiers, target selectors, titles, instructions, expected events, and timeout behavior.
- Locate target DOM elements, scroll them into view, highlight them, and display a positioned tooltip.
- Advance when the expected action actually occurs; do not advance solely because the user clicks “Next” on an action-required step.
- Support start, pause, resume, cancel, completion, and restart.
- Track progress per tab and workflow.
- Restore or reset safely after side-panel closure, page reload, or service-worker restart, according to documented rules.

**Acceptance criteria:** The Create Part tour can run end to end without manually changing step indices; the extension cleans up overlays and listeners on exit.

#### FR-05: Dynamic DOM resilience
- Use `MutationObserver` where appropriate, with bounded retries and timeouts.
- Re-resolve targets after React rerenders; reposition overlays after scrolling and resizing.
- Detect missing, hidden, or detached elements and display an actionable error or retry option.
- Prefer stable attributes and semantic selectors; support documented fallback selectors.

**Acceptance criteria:** Delayed rendering does not break the tour; removing a required target causes a controlled timeout rather than a crash or infinite wait.

#### FR-06: Safe workflow assistance
- Offer optional autofill for non-sensitive fields in the demo portal.
- Dispatch appropriate DOM input/change events so React-controlled fields update correctly.
- Validate required fields before proceeding.
- Require explicit user confirmation before submitting or changing data.
- Never bypass native validation or silently submit forms.

**Acceptance criteria:** Autofill populates the demo form correctly, errors are visible, and submission only occurs after user confirmation.

#### FR-07: Guided workflows
1. **Create New Part:** Open Parts → highlight Create Part → fill Part Name/Number/Category/Description → validate → review and confirm → detect success.
2. **Find a Document:** Open Documents → locate search → enter query → identify result → open document details.
3. **Create Engineering Change Request:** Open Change Requests → open form → explain required fields → validate → confirm submission → detect success.

**Acceptance criteria:** All three workflows run successfully against the standalone portal and use the same core engine.

### 4.3 Differentiating features (P1)

#### FR-08: Inline smart validation
- Show contextual help for missing or invalid fields without overwriting portal errors.
- Prevent duplicate automation actions while an operation is in progress.

#### FR-09: Workflow configuration extensibility
- Add a new walkthrough primarily by creating a workflow definition.
- Version workflow definitions and provide a clear schema/types.
- Separate workflow configuration from browser-specific DOM execution.

#### FR-10: Diagnostics and developer tools
- Provide structured debug logs with workflow ID, step ID, tab ID, and failure reason.
- Offer a demo-only diagnostics view or toggle.
- Avoid logging sensitive field values or document content.

### 4.4 Out of scope for MVP

- Integration with an actual client Windchill environment or proprietary APIs.
- Complete WalkMe feature parity, analytics platform, or no-code authoring studio.
- AI-generated executable scripts or autonomous modification of enterprise data.
- Cross-origin automation, bypassing authentication, or privileged browser access beyond required permissions.
- Enterprise deployment, SSO, central workflow management, and multi-tenant administration.

## 5. Technical architecture

```text
windchill-smartguide/
├── apps/
│   ├── demo-portal/
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       └── mock-data/
│   └── extension/
│       ├── public/manifest.json
│       └── src/
│           ├── background/service-worker.ts
│           ├── content/
│           │   ├── content-script.ts
│           │   ├── dom-observer.ts
│           │   └── overlay-manager.ts
│           ├── sidepanel/
│           ├── engine/
│           │   ├── workflow-engine.ts
│           │   ├── selector-resolver.ts
│           │   └── step-validator.ts
│           └── messaging/message-types.ts
├── packages/shared/
│   └── workflow-types.ts
├── tests/
└── docs/
```

### Component responsibilities

| Component | Responsibility |
| --- | --- |
| MV3 manifest | Entry points, permissions, supported host origins |
| React side panel | Workflow discovery, controls, progress, help |
| Content script | Read/interact with the host DOM; draw overlays; listen to page events |
| Service worker | Browser event handling, message routing, coordination; no direct page DOM access |
| Workflow engine | Step state machine, validation, transitions, cancellation |
| Selector resolver | Stable selectors, fallback resolution, bounded retries |
| Storage layer | Preferences and explicitly chosen resumable state |
| Demo portal | Independent simulated PLM workflows and test fixtures |

**Implementation note:** The service worker can be suspended; do not rely on long-lived in-memory worker state. Keep DOM observers and overlays in the content script, and persist only the state necessary for safe recovery.

## 6. Suggested stack

- **Language:** TypeScript (strict mode)
- **Extension UI:** React + Tailwind CSS
- **Build:** Vite with a maintained MV3-compatible extension build solution
- **Demo portal:** React + TypeScript + Vite
- **State management:** React Context or Zustand as needed
- **Browser APIs:** `chrome.runtime`, `chrome.tabs`, `chrome.storage`, `chrome.sidePanel` where supported
- **DOM handling:** Native DOM APIs, `MutationObserver`, `ResizeObserver` if needed
- **Testing:** Vitest + Playwright, with browser-specific smoke testing
- **Formatting and linting:** ESLint + Prettier

## 7. Workflow configuration contract

Each step should support at least:

```ts
export type GuideStep = {
  id: string;
  title: string;
  description: string;
  selector: string;
  fallbackSelectors?: string[];
  action: 'click' | 'input' | 'wait' | 'confirm';
  timeoutMs?: number;
};

export type GuideWorkflow = {
  id: string;
  version: number;
  title: string;
  supportedRoutes: string[];
  steps: GuideStep[];
};
```

Implement event-specific completion rules separately, including validation that the correct target was interacted with. Avoid `eval`, dynamic remote JavaScript, and arbitrary code execution in configuration.

## 8. Non-functional requirements

### NFR-01: Reliability
- No unhandled errors when targets are absent, detached, or hidden.
- Cleanup observers, listeners, timers, and overlays after completion or cancellation.
- Avoid duplicate step transitions caused by repeated events.

### NFR-02: Performance
- Avoid constant whole-document polling and unnecessary full-tree scans.
- Scope DOM observers and disconnect them when no longer needed.
- Keep UI interactions responsive and measure any noticeable overhead in the demo.

### NFR-03: Security and privacy
- Apply least-privilege host permissions and extension permissions.
- Never collect passwords, tokens, or confidential portal data.
- Treat page DOM content as untrusted; render guidance text safely.
- Avoid remote executable code and unsafe HTML injection.
- Ask for explicit confirmation before any data-changing action.
- Keep workflow data local for the MVP.

### NFR-04: Accessibility
- Tooltips and side-panel controls should be keyboard accessible.
- Provide visible focus indicators and meaningful accessible labels.
- Ensure spotlight overlays do not trap the user or block cancellation.
- Respect reduced-motion preferences where practical.

### NFR-05: Maintainability
- Separate UI, DOM integration, workflow logic, and messaging.
- Use typed message contracts and consistent error types.
- Keep business-specific selectors out of generic engine logic.
- Document assumptions and known limitations.

## 9. Test requirements

| ID | Scenario | Expected result |
| --- | --- | --- |
| T-01 | Install extension in Chrome | Loads and side panel opens |
| T-02 | Install extension in Edge | Loads and side panel opens |
| T-03 | Open unsupported site | No injected guidance or automation |
| T-04 | Start Create Part workflow | Correct element highlighted |
| T-05 | Click incorrect element | Step does not advance |
| T-06 | Target appears after delay | Step resolves within timeout |
| T-07 | Target never appears | Clear error/retry option |
| T-08 | React rerenders target | Guidance recovers or fails gracefully |
| T-09 | SPA route changes mid-tour | Workflow pauses/cancels safely |
| T-10 | Switch tabs | State remains isolated per tab |
| T-11 | Close/reopen side panel | State behavior follows documented policy |
| T-12 | Autofill React form | UI state and validation update correctly |
| T-13 | Submit without confirmation | No submission occurs |
| T-14 | Cancel workflow | Observers, listeners, overlays cleaned up |
| T-15 | Complete all three workflows | Success detected and progress shown |

## 10. Delivery milestones

| Day | Milestone | Exit criteria |
| --- | --- | --- |
| 1 | Demo portal | Three functional PLM areas and mock forms |
| 2 | MV3 foundation | Extension installs; typed messaging works |
| 3 | React side panel | Contextual workflows and controls appear |
| 4 | Workflow engine | Guided Create Part flow works |
| 5 | Automation and additional tours | Three workflows and confirmation behavior work |
| 6 | Resilience and tests | Key edge cases covered; Chrome/Edge smoke tests pass |
| 7 | Client demo readiness | README, architecture, demo script, recording, and clean repo |

**Planning assumption:** Approximately three focused hours per day for a tightly scoped MVP. Extend the schedule if browser compatibility or robustness testing requires more time.

## 11. Definition of done

The MVP is complete when:

- [ ] The demo portal runs independently.
- [ ] The MV3 extension installs and works in Chrome and Edge.
- [ ] The React side panel displays context-relevant workflows.
- [ ] All three guided workflows run using a shared workflow engine.
- [ ] Dynamic rendering, missing elements, and navigation are handled gracefully.
- [ ] Optional autofill works and data-changing actions require confirmation.
- [ ] Per-tab state and lifecycle cleanup are verified.
- [ ] Permissions are minimized and security requirements are documented.
- [ ] Critical unit and end-to-end tests pass.
- [ ] The repository contains setup instructions, architecture documentation, and a five-minute demo script.

## 12. Client demonstration plan (five minutes)

1. **0:00–0:30:** Explain the business problem and limited WalkMe-style replacement scope.
2. **0:30–1:00:** Show the extension installed independently from the demo portal.
3. **1:00–2:30:** Run Create Part walkthrough with highlights, validation, and confirmation.
4. **2:30–3:15:** Show contextual guidance and safe automation.
5. **3:15–4:15:** Explain content scripts, service workers, messaging, and DOM resilience.
6. **4:15–5:00:** Demonstrate one controlled failure, show tests, and discuss future Windchill integration.

## 13. Evidence of independent engineering ownership

- Commit incrementally with descriptive messages and maintain a clear Git history.
- Include an architecture diagram and a short design-decisions log.
- Be able to explain every major browser API, component boundary, and workflow transition.
- Demonstrate live modification of a workflow definition and debugging of a missing selector.
- If using Claude Code or Codex, disclose their role accurately; document code review, testing, and decisions made by the developer. Do not claim code was written without AI if it was not.

## 14. Risks and assumptions

- Real Windchill DOM structures and customizations are unknown; selectors in the demo are not proof of production compatibility.
- Real deployment will require a target-site assessment, security review, permission approval, and representative workflow testing.
- SPA navigation, nested frames, shadow DOM, and browser differences may require additional adapters beyond the MVP.
- Some WalkMe capabilities (analytics, segmentation, content authoring, and governance) are not included.
- The client must identify the exact WalkMe functions to replace before a production scope or effort estimate can be finalized.

## 15. Future enhancements

- Workflow authoring interface and versioned workflow publishing.
- Role-based targeting and conditional branching.
- Opt-in usage analytics with privacy controls.
- Localization and accessibility improvements.
- Approved Windchill-specific adapters and enterprise deployment support.
- AI-assisted natural-language help grounded in approved documentation, without executing generated scripts.

---

**Project success statement:** Demonstrate a secure, maintainable, context-aware Chrome/Edge extension that guides users through realistic PLM workflows and provides credible evidence of browser-extension engineering skills.
