# Five-minute client demo

The current UI has no extension sidebar. Use [the current UI guide](UI_REVISION.md) and the [November workflow sequence](NOVEMBER_POC.md) for presentation. The toolbar opens an admin tab; normal users use automatic highlights and ? search. The older script below documents the original MVP and is retained as history.

## Before the meeting

- Run `npm run build`, then `npm run dev`.
- Load/reload `dist/extension` in the browser you will present; refresh the portal.
- Use http://127.0.0.1:5173 and open the Windchill Extension Demo side panel. It is an independent proof of concept, not an official PTC product.
- Use a fresh demo browser profile or clear only this portal origin's site data if you want the seed records restored. Do not clear unrelated browser data.
- Keep the server terminal, `workflows.ts`, and `workflow-engine.ts` ready.
- Run the checks and rehearse once in that exact browser. Keep the result report accurate.

## 0:00–0:30 — State the problem and scope

“Employees need contextual help for unfamiliar PLM workflows. This proof of concept adds a separate browser extension to a standalone PLM simulation. It demonstrates selected digital-adoption capabilities; it is not yet integrated with a real Windchill instance.”

## 0:30–1:00 — Prove separation

Show the portal and the extension card. Explain that the portal runs independently, while the extension supplies guidance. Show the current page's applicable workflows in the panel.

## 1:00–2:30 — Create a part

Start Create a new part. Click Create part. Show a highlighted field, then choose Fill demo values. Explain that form state updates through native setters and DOM events. Click Review part, inspect the summary, and click Confirm create yourself. Point out the success notification and completed tour.

## 2:30–3:15 — Context and asynchronous rendering

Navigate to Documents and show the changed workflow list. Start the document tour, type bracket, leave the field, and open the matching result after delayed rendering. Explain that a scoped observer re-resolves targets.

## 3:15–4:15 — Explain the architecture

“The React panel sends typed commands through the service worker to the active supported tab. The content script owns DOM interaction and tour state. A pure state machine checks transitions. The worker manages minimal session checkpoints. Refresh restores the guide paused at the saved step; the demo portal restores its draft independently. Resume never replays clicks or submits a form.”

For an optional refresh demonstration, refresh while reviewing a part. Show the restored review and Resume saved step, then explicitly confirm creation. Explain that recovery is per tab in the current browser session, not across browser restarts.

Show the workflow definition and the small transition function. Mention origin restrictions, no remote execution, and user-confirmed submission.

## 4:15–5:00 — Controlled failure and next steps

On Parts, start a tour and temporarily rename the highlighted target's `data-guide` attribute in DevTools. Explain the ten-second timeout and show Retry/Cancel. Restore the attribute and retry, or cancel cleanly.

Finish with the actual test results. State that real Windchill work requires target-site assessment and approved workflows. Accurately describe AI assistance and your own review/debugging contributions.

## If something fails during the meeting

Cancel the tour, close any form, refresh the portal, and restart. If the extension is disconnected after a rebuild, reload its extension card and refresh the portal. Do not describe a failed workflow as completed.

## Additional capability: contextual information (one minute)

1. Open Parts with no tour running and no modal open. Enable **Show Important Information**.
2. Hover the `i` icon beside a part number. Explain that this capability explains existing information independently of a task walkthrough.
3. Focus the Revision or Part status icon by keyboard. Read the current value and why it matters. Note that the demo's revision/status labels are static, not a production approval policy. Escape dismisses the tooltip.
4. Navigate to Documents: identifiers, owners, and revision labels are explained. Search for `bracket` to show delayed-result recovery.
5. Navigate to Change requests and show the Change status tooltip with its actual `In review` value.
6. Start a guide: information overlays temporarily yield to the tour. Pause or complete it to restore them, provided no modal remains open.
7. Disable the switch to remove all information overlays. Explain that the setting is per tab and resets off on reload, while the separate guide checkpoint policy still applies.
