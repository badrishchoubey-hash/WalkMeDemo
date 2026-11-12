import { deflateRawSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  return crc >>> 0;
});
export function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}
// Small standard ZIP writer: deflate, UTF-8 names, fixed DOS date, no ZIP64 dependency.
export function makeZip(entries) {
  const local = []; const central = []; const names = new Set(); let offset = 0;
  for (const [name, data] of entries) {
    if (!name || !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(name) || name.startsWith('/') || name.includes('\\') || name.split('/').some(part => !part || part === '.' || part === '..') || names.has(name)) throw new Error('Unsafe or duplicate ZIP entry.');
    names.add(name);
    const filename = Buffer.from(name, 'utf8'); const content = Buffer.from(data); const compressed = deflateRawSync(content); const checksum = crc32(content);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6); header.writeUInt16LE(8, 8); header.writeUInt16LE(33, 12);
    header.writeUInt32LE(checksum, 14); header.writeUInt32LE(compressed.length, 18); header.writeUInt32LE(content.length, 22); header.writeUInt16LE(filename.length, 26);
    local.push(header, filename, compressed);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6); directory.writeUInt16LE(0x800, 8); directory.writeUInt16LE(8, 10); directory.writeUInt16LE(33, 14);
    directory.writeUInt32LE(checksum, 16); directory.writeUInt32LE(compressed.length, 20); directory.writeUInt32LE(content.length, 24); directory.writeUInt16LE(filename.length, 28); directory.writeUInt32LE(offset, 42);
    central.push(directory, filename); offset += header.length + filename.length + compressed.length;
  }
  if (entries.length > 65535 || offset > 0xffffffff) throw new Error('Release exceeds the supported ZIP size.');
  const directory = Buffer.concat(central); const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
