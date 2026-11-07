# Your hands-on ownership checklist

Do these in order while running the app. Spend your limited preparation time tracing one complete workflow rather than memorizing every file.

## 1. Understand the portal (10 minutes)

Disable the extension and create a part. Read `RecordForm.tsx`: the first submit moves to review; only the second submit calls `onSave`. Find where duplicate part numbers are rejected in `main.tsx`. Explain why the portal must work independently.

## 2. Trace the extension (15 minutes)

Read these files in order:

1. `apps/extension/public/manifest.json`: which file runs in which browser context? Why only localhost host access?
2. `packages/shared/workflow-types.ts`: how do requests and responses correlate? Where is runtime input validated?
3. `apps/extension/src/background/service-worker.ts`: why can this file not query the portal DOM?
4. `apps/extension/src/content/content-script.ts`: who owns progress? What happens when a step changes?
5. `apps/extension/src/engine/workflow-engine.ts`: why does a repeated old step event not advance twice?

Say this in your own words: “The panel sends an intent, the worker selects the supported tab, and the content script verifies the actual page interaction before the pure engine advances.”

## 3. Make your first visible change (10 minutes)

In `packages/shared/workflows.ts`, change the Create Part first-step title and instruction. Build, reload the extension, refresh the portal, and show the changed guidance. Notice that no generic engine code changed.

## 4. Debug a real failure (10 minutes)

Start Create Part. In portal DevTools, select its highlighted button and change its `data-guide` attribute to `temporarily-missing`. Wait ten seconds. Explain why this is a bounded error rather than an infinite wait. Restore the attribute and select Retry step in the panel. Cancel and inspect that `#smartguide-overlay` is gone.

## 5. Rehearse answers (15 minutes)

- Why MV3? It is the required current extension architecture; the background worker is suspendable.
- Why content scripts? They can interact with the host DOM in an isolated JavaScript world; the worker cannot access the page DOM.
- Why MutationObserver? React can render or replace targets later, so a one-time query is insufficient.
- Why not trust TypeScript alone? Types disappear at runtime; browser messages still need validation.
- Why require real clicks? The engine should represent actual workflow progress, not a sequence of Next buttons.
- How is React autofill handled? A native value setter followed by input/change events updates controlled state; the final form is still reviewed and submitted by the user.
- What is needed for real Windchill? A representative environment, DOM assessment, workflow approval, security review, and browser validation. Demo selectors prove only the demo.
- What did AI do? Explain honestly which implementation was AI-assisted and which decisions, changes, reviews, and tests you personally completed.

## Record your contribution

After each exercise, write your actual change, reason, and verification here or in a focused commit. Do not claim exercises you have not done.
