export const extensionFiles = ['admin.html', 'background.js', 'content.js', 'manifest.json', 'sidepanel.css', 'sidepanel.js', 'THIRD_PARTY_NOTICES.txt', 'icons/demo-16.png', 'icons/demo-32.png', 'icons/demo-48.png', 'icons/demo-128.png'];
export function validateReleaseManifest(manifest, config) {
  if (manifest.manifest_version !== 3 || manifest.version !== config.version) throw new Error('Manifest/version does not match the build.');
  if (JSON.stringify(manifest.permissions) !== JSON.stringify(['storage']) || JSON.stringify(manifest.host_permissions) !== JSON.stringify([config.matchPattern])) throw new Error('Unexpected permissions or host access.');
  if (manifest.content_scripts?.length !== 1 || JSON.stringify(manifest.content_scripts[0].matches) !== JSON.stringify([config.matchPattern]) || JSON.stringify(manifest.content_scripts[0].js) !== JSON.stringify(['content.js']) || manifest.content_scripts[0].all_frames) throw new Error('Unexpected content-script configuration.');
  if (manifest.background?.service_worker !== 'background.js' || manifest.options_ui?.page !== 'admin.html' || manifest.externally_connectable || manifest.web_accessible_resources || manifest.side_panel) throw new Error('Unexpected extension entry points or external access.');
  if (manifest.content_security_policy?.extension_pages !== "script-src 'self'; object-src 'none'") throw new Error('Unexpected extension CSP.');
  for (const size of [16, 32, 48, 128]) if (manifest.icons?.[size] !== `icons/demo-${size}.png`) throw new Error('Unexpected icon path.');
  return true;
}
