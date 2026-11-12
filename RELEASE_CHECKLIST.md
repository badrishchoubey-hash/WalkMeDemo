# Manual release checks

- [ ] Review intended changes and confidentiality of release attachments. Do not attach client screenshots or internal source documents.
- [ ] Confirm version, target hostname and checksums in release metadata.
- [ ] Run typecheck, lint, formatting, unit tests, local browser suite and opt-in hosted check as described in PUBLISHING_GUIDE.md.
- [ ] Build portal and extension separately; extract ZIP and confirm root manifest and all assets.
- [ ] Load extracted release in installed Chrome and Microsoft Edge. Check permissions/site access and toolbar editor.
- [ ] Check Overview whole-card highlights, information tooltips, help stacking, Parts form confirmation, document search, changes and collaboration/rename navigation.
- [ ] Check Escape, pause/resume, refresh recovery, multiple tabs, worker restart, extension update, disable/remove plus portal refresh.
- [ ] Check narrow windows, zoom, keyboard access and help placement in installed browsers.
- [ ] Verify deployed portal routes/assets/security headers and usability with extension disabled.
- [ ] Review GitHub release draft and attachments, then publish manually only when authorized.

No store submission or approval is implied. Chrome/Edge store listings additionally require publisher accounts, accurate privacy disclosures, listing assets and their own reviews. Island and managed-browser deployment remain unverified.
