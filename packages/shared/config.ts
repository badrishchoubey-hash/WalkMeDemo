// Replaced by the extension bundler. Unit tests and the independent portal use the local default.
declare const __GUIDANCE_PORTAL_ORIGIN__: string | undefined;
export const PORTAL_ORIGIN =
  typeof __GUIDANCE_PORTAL_ORIGIN__ === 'string'
    ? __GUIDANCE_PORTAL_ORIGIN__
    : 'http://127.0.0.1:5173';
export const PORTAL_MATCH_PATTERN = `${new URL(PORTAL_ORIGIN).protocol}//${new URL(PORTAL_ORIGIN).hostname}/*`;
export const portalUrl = (route = 'dashboard') => `${PORTAL_ORIGIN}/#/${route}`;
