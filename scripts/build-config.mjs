import { isIP } from 'node:net';
export const DEVELOPMENT_ORIGIN = 'http://127.0.0.1:5173';
export const PRODUCTION_ORIGIN = 'https://walk-me-demo-silk.vercel.app';
export function getBuildConfig({ mode = 'development', origin, version } = {}) {
  if (mode !== 'development' && mode !== 'production')
    throw new Error('Build mode must be development or production.');
  if (
    typeof version !== 'string' ||
    !/^(0|[1-9]\d{0,4})(\.(0|[1-9]\d{0,4})){0,3}$/.test(version) ||
    version.split('.').some((part) => Number(part) > 65535) ||
    !version.split('.').some((part) => Number(part) > 0)
  )
    throw new Error(
      'package.json version must be a nonzero browser-compatible numeric version (for example 0.1.1).',
    );
  const configured =
    origin ?? (mode === 'development' ? DEVELOPMENT_ORIGIN : PRODUCTION_ORIGIN);
  if (!configured)
    throw new Error(
      'Production builds require PORTAL_ORIGIN: use the exact assigned public HTTPS origin.',
    );
  const url = new URL(configured);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    !/^[a-z0-9.-]+$/.test(url.hostname)
  )
    throw new Error(
      'PORTAL_ORIGIN must be one exact HTTP(S) origin, without paths, credentials, queries, fragments, or wildcards.',
    );
  if (
    mode === 'development' &&
    !['localhost', '127.0.0.1'].includes(url.hostname)
  )
    throw new Error(
      'Development builds are limited to localhost or 127.0.0.1. Use production mode for a public HTTPS host.',
    );
  if (
    mode === 'production' &&
    (url.protocol !== 'https:' ||
      isIP(url.hostname) ||
      !url.hostname.includes('.') ||
      /(^|\.)(localhost|local|internal)$/.test(url.hostname))
  )
    throw new Error(
      'Production builds require a named public HTTPS host. Loopback, IP addresses, and local/internal hosts are not supported.',
    );
  if (
    url.hostname
      .split('.')
      .some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
  )
    throw new Error('Invalid portal hostname.');
  return {
    mode,
    version,
    portalOrigin: url.origin,
    matchPattern: `${url.protocol}//${url.hostname}/*`,
    provisional: url.hostname.endsWith('.invalid'),
  };
}
