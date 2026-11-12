# User and developer interfaces

The supplied screenshots were reviewed as references for contextual launchers, anchored tips, explicit confirmation, search, and separate build/published experiences. No customer names, document numbers, URLs, policies, screenshots, or branding were copied into application assets or sample records.

## Normal user

There is no browser extension sidebar or sidebar permission. Supported pages automatically discover fields and show highlights. Entering Parts, Documents, or Change Requests also starts its published guide; Documents focuses the search input without entering a value. The user performs the required clicks and confirms record changes. Escape cancels without restarting on DOM changes. Reload preserves recovered progress paused rather than replaying actions. The task launcher still starts the collaboration tour on request. Admins can disable automatic entry for manual preview using **Start page guidance automatically**.

The **?** launcher opens a bounded, floating search panel. Search matches published workflows applicable to the current page and related process documentation. Unsupported routes offer an informative empty state rather than unrelated executable guides. Search is disabled during a running guide; exit the current guide before searching again. Escape closes the panel or active guidance and can hide automatic highlights. Navigation/reload re-enables discovery.

The launcher uses `left: 20%` and flex centering (`align-items: center; justify-content: center`) for its question mark. The search panel opens 12px to the right of the launcher, rather than at the screen edge. It fills the visible main section from its top to the viewport bottom and shrinks in width when space is limited. Position and size update on scroll and viewport changes. The separate Process documentation navigation tab has been removed; sample documents remain reachable from tips and release links. Developer documentation and publication controls are separate.

Opening help or a release announcement temporarily hides information rings/icons and walkthrough overlays. Closing the surface restores enabled annotations or the same current walkthrough step; it does not change the highlight preference or complete a step. This prevents page highlights from painting across help controls, including overlays in the browser's top layer.

Overview uses four complete-card outlines: My tasks and the three statistics cards. Information icons sit at their corners; there are no separate outlines around task links or numeric values. Tooltip values still use the task link or count, and sample documentation remains linked. Portal, help, and tooltip hyperlinks use the green theme.

Extension styling is bundled separately from the Vite portal. After editing `help-assistant.ts`, run `npm run build`, reload the unpacked extension in the browser's extensions page, then refresh the portal. Portal hot reload alone does not update an already injected extension script. The saved panel top is currently 60px, with a 645px height.

## Developer / admin

Open the browser's Extensions menu (puzzle-piece icon) and click **Windchill Extension Demo**, or click its pinned toolbar icon, to open `admin.html` in a separate tab. The toolbar tooltip reads **Open developer / publish mode**. Alternatively, right-click its toolbar icon and choose **Options**. The existing React controls are retained here as a preview tool; their source directory retains its legacy `sidepanel` name. Nothing is registered or opened as a browser sidebar.

Use **Create workflow** or choose a workflow and click **Edit selected workflow**. The form edits its name, description, starting page, and ordered steps. Each step has instructions, a real portal selector, optional separate highlight selector, and Next/click/input/confirmation/visible-result progression. Add, remove, and reorder steps. Use single `data-guide`, `data-info`, `data-route`, or element ID selectors; arbitrary scripts and page-wide selectors are rejected. Existing confirmation steps and allowlisted automation remain protected.

**Save draft** stores content under `guidance:workflowDrafts:v1`. It does not change normal-user content. **Publish** validates the drafts and writes a versioned catalog under `guidance:workflowCatalog:v1`, alongside availability in `guidance:publication:v1`. Open portal tabs receive those changes without rebuilding or refreshing. A workflow whose definition changes is cancelled safely and can be restarted with the new version. Newly created IDs use the `custom-` namespace. Drafts and publications survive page/browser refreshes in extension local storage; uninstalling the extension clears them.

Select the workflows normal users should see, then click **Publish**. Definitions are validated; publishing a parent without its linked workflow is rejected. Publication affects this browser only and does not provide production authorization. Active guides with unchanged definitions can finish; changed definitions cancel the old guide. Refresh recovery validates the published definition version and restores only compatible progress paused.

**Sample documentation** explains the editor and publication flow. Editor content needs no rebuild. New engine capabilities or automated actions still require source changes, tests, and a build/reload. Guides run on their starting page; navigating to another route cancels them. This POC has no cloud publication, authentication, production role enforcement, drag-and-drop designer, or document API integration.

The release reset control is admin-only. Open Overview in the portal, then use **Reset release announcement for demo** in the admin tab. Normal users acknowledge or close announcements without seeing developer reset controls.

## UI changes and verification

Release links use a vertical list, separate from a flex action footer with consistent button height, spacing, and alignment. The release popup is centered and constrained to the viewport. Rename and walkthrough actions use aligned flex footers. Overview has a 24px gap between My tasks and statistics.

Portal typography uses a system font stack, a consistent h1/h2/h3 hierarchy, readable descriptions, table text and metadata, and improved color contrast. The normal page title is Overview. Working sample content is preserved.

Browser tests cover search and empty results, automatic highlights and Escape, local publication and linked-workflow validation, admin-only documentation, release action geometry, Overview spacing, compact layout screenshots, and existing workflows. See `VERIFICATION.md` for actual results. Manual installed Chrome/Edge, screen-reader review, and full performance measurements remain outstanding.

After rebuilding, reload the extension card and refresh open portal tabs. Refresh after disabling the extension as well, because injected DOM is not automatically removed on browser-level disable.
