import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';

// Deterministic, dependency-free rasterization of a neutral browser/information icon.
const rounded = (x, y, left, top, right, bottom, radius) => {
  const cx = Math.max(left + radius, Math.min(x, right - radius));
  const cy = Math.max(top + radius, Math.min(y, bottom - radius));
  return (
    x >= left &&
    x <= right &&
    y >= top &&
    y <= bottom &&
    (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2
  );
};
function colorAt(x, y) {
  if (!rounded(x, y, 1, 1, 23, 23, 5)) return [0, 0, 0, 0];
  const frame =
    rounded(x, y, 4, 5, 20, 19, 2.5) &&
    !rounded(x, y, 5.3, 6.3, 18.7, 17.7, 1.2);
  const bar = x > 4 && x < 20 && Math.abs(y - 9.5) < 0.65;
  const dot = (x - 12) ** 2 + (y - 12) ** 2 < 0.6 ** 2;
  const stem = Math.abs(x - 12) < 0.65 && y > 13.6 && y < 16.7;
  return frame || bar || dot || stem ? [255, 255, 255, 255] : [33, 93, 70, 255];
}
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}
export async function generateDemoIcons(outputDirectory) {
  await mkdir(`${outputDirectory}/icons`, { recursive: true });
  for (const size of [16, 32, 48, 128]) {
    const pixels = Buffer.alloc((size * 4 + 1) * size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const sums = [0, 0, 0, 0];
        for (let sy = 0; sy < 4; sy++)
          for (let sx = 0; sx < 4; sx++) {
            const color = colorAt(
              ((x + (sx + 0.5) / 4) / size) * 24,
              ((y + (sy + 0.5) / 4) / size) * 24,
            );
            color.forEach((value, index) => {
              sums[index] += value;
            });
          }
        for (let channel = 0; channel < 4; channel++)
          pixels[y * (size * 4 + 1) + 1 + x * 4 + channel] = Math.round(
            sums[channel] / 16,
          );
      }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(size);
    header.writeUInt32BE(size, 4);
    header[8] = 8;
    header[9] = 6;
    const png = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', header),
      chunk('IDAT', deflateSync(pixels)),
      chunk('IEND', Buffer.alloc(0)),
    ]);
    await writeFile(`${outputDirectory}/icons/demo-${size}.png`, png);
  }
}
