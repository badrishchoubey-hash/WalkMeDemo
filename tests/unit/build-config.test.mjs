import { describe, expect, it } from 'vitest';
import { inflateRawSync } from 'node:zlib';
import { getBuildConfig } from '../../scripts/build-config.mjs';
import { makeZip, crc32 } from '../../scripts/zip.mjs';
import { validateReleaseManifest } from '../../scripts/release-validation.mjs';
import { readFileSync } from 'node:fs';
describe('production demo build boundaries', () => {
  it('retains the exact local origin and scopes a public production host without a wildcard', () => {
    expect(getBuildConfig({ version: '0.1.0' }).portalOrigin).toBe(
      'http://127.0.0.1:5173',
    );
    const result = getBuildConfig({
      mode: 'production',
      origin: 'https://demo.example.invalid',
      version: '0.1.2',
    });
    expect(result.matchPattern).toBe('https://demo.example.invalid/*');
    expect(result.provisional).toBe(true);
  });
  it('defaults production to the assigned host and rejects insecure/broad origins, credentials, subpaths and unsupported versions', () => {
    expect(
      getBuildConfig({ mode: 'production', version: '0.1.0' }).portalOrigin,
    ).toBe('https://walk-me-demo-silk.vercel.app');
    for (const origin of [
      'http://demo.example.invalid',
      'https://*.vercel.app',
      'https://name:secret@demo.example.invalid',
      'https://demo.example.invalid/app',
      'https://localhost',
      'https://127.0.0.1',
      'https://10.0.0.1',
      'https://demo.example.invalid?debug=1',
      'https://demo.example.invalid/#/parts',
      'javascript:alert(1)',
    ])
      expect(() =>
        getBuildConfig({ mode: 'production', origin, version: '0.1.0' }),
      ).toThrow();
    for (const version of ['0.0.0', '0.1.0-beta', '65536.0.0', '01.0.0'])
      expect(() => getBuildConfig({ version })).toThrow();
  });
  it('rejects unexpected generated manifest privileges and wrong versions', () => {
    const manifest = JSON.parse(
      readFileSync('apps/extension/public/manifest.json', 'utf8'),
    );
    const config = getBuildConfig({ version: manifest.version });
    expect(validateReleaseManifest(manifest, config)).toBe(true);
    expect(() =>
      validateReleaseManifest(
        { ...manifest, permissions: ['storage', 'tabs'] },
        config,
      ),
    ).toThrow();
    expect(() =>
      validateReleaseManifest(
        { ...manifest, host_permissions: ['<all_urls>'] },
        config,
      ),
    ).toThrow();
    expect(() =>
      validateReleaseManifest({ ...manifest, version: '9.0.0' }, config),
    ).toThrow();
  });
});
describe('release ZIP writer', () => {
  it('writes a root manifest with a correct deflate payload and standard checksum', () => {
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926);
    const content = Buffer.from('{"manifest_version":3}');
    const zip = makeZip([['manifest.json', content]]);
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    const nameLength = zip.readUInt16LE(26);
    expect(zip.subarray(30, 30 + nameLength).toString()).toBe('manifest.json');
    expect(
      inflateRawSync(
        zip.subarray(30 + nameLength, 30 + nameLength + zip.readUInt32LE(18)),
      ),
    ).toEqual(content);
    expect(zip.readUInt32LE(zip.length - 22)).toBe(0x06054b50);
    expect(makeZip([['manifest.json', content]])).toEqual(zip);
  });
  it('rejects traversal, absolute and duplicate filenames', () => {
    for (const name of ['../secret', '/manifest.json', 'icons\\test.png'])
      expect(() => makeZip([[name, Buffer.from('x')]])).toThrow();
    expect(() =>
      makeZip([
        ['a', Buffer.from('x')],
        ['a', Buffer.from('x')],
      ]),
    ).toThrow();
  });
});
