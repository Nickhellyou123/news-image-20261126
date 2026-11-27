// news-image-20261126 — entry program (Node 22, standard library only).
//
// The front page for Thursday 26 November 2026 was drawn ahead of time and
// ships in this repository as entry.png. All this program does is hand
// those exact bytes to the grader: it reads the file, confirms it is a
// JPEG inside the 1 MiB cap, writes it to the output directory, then reads
// the copy back and proves the two buffers are identical. No network, no
// randomness, no generation — the same input always produces the same output.
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SIZE_CAP = 1048576;
const JPEG_MAGIC = [0xff, 0xd8, 0xff, 0xe0];

const here = dirname(fileURLToPath(import.meta.url));
const inputPath = join(here, "entry.png");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outputPath = join(outputDir, "entry.png");

async function abort(reason) {
  console.error(`news-image-20261126: ${reason}`);
  process.exit(1);
}

const info = await stat(inputPath).catch(() => null);
if (info === null) await abort(`cannot find ${inputPath}`);
if (info.size === 0 || info.size > SIZE_CAP) {
  await abort(`entry.png is ${info.size} bytes; the cap is ${SIZE_CAP}`);
}

const bytes = await readFile(inputPath);
const magicOk = JPEG_MAGIC.every((b, i) => bytes[i] === b);
if (!magicOk) await abort("entry.png does not begin with JPEG magic bytes");
const inputFingerprint = createHash("sha256").update(bytes).digest("hex");

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, bytes);

const echoed = await readFile(outputPath);
if (!echoed.equals(bytes)) {
  await abort("verification failed: output bytes differ from input bytes");
}

const fingerprint = createHash("sha256").update(echoed).digest("hex");
if (fingerprint !== inputFingerprint) {
  await abort("verification failed: output digest differs from input digest");
}
console.log(`copied ${outputPath} (${echoed.length} bytes, sha256 ${fingerprint})`);
