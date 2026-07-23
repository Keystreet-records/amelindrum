/**
 * Ensure MP4 has `moov` before `mdat` (web faststart) so browsers can
 * play progressively without downloading the whole file first.
 *
 * Remux is memory-safe for large files: only the `moov` atom is loaded;
 * `mdat` and prefix boxes are composed via Blob slices (no full-file copy).
 */

export type TopBox = {
  type: string;
  start: number;
  size: number;
  headerSize: number;
};

export type Mp4LayoutInfo = {
  faststart: boolean;
  hasMoov: boolean;
  hasMdat: boolean;
  size: number;
  moovSize: number;
};

function readTopBoxes(buf: Uint8Array, fileSize = buf.byteLength): TopBox[] {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const boxes: TopBox[] = [];
  let offset = 0;

  while (offset + 8 <= buf.byteLength) {
    let size = view.getUint32(offset);
    const type = String.fromCharCode(
      buf[offset + 4],
      buf[offset + 5],
      buf[offset + 6],
      buf[offset + 7],
    );
    let headerSize = 8;

    if (size === 1) {
      if (offset + 16 > buf.byteLength) break;
      const high = view.getUint32(offset + 8);
      const low = view.getUint32(offset + 12);
      size = high * 2 ** 32 + low;
      headerSize = 16;
    } else if (size === 0) {
      size = fileSize - offset;
    }

    if (size < headerSize) break;
    boxes.push({ type, start: offset, size, headerSize });
    offset += size;
    if (boxes.length > 64) break;
  }

  return boxes;
}

/** Read top-level MP4 boxes from a Blob without loading the whole file. */
export async function readTopBoxesFromBlob(blob: Blob): Promise<TopBox[]> {
  const boxes: TopBox[] = [];
  let offset = 0;

  while (offset + 8 <= blob.size) {
    const hdrBuf = new Uint8Array(await blob.slice(offset, offset + 16).arrayBuffer());
    if (hdrBuf.byteLength < 8) break;

    const view = new DataView(hdrBuf.buffer, hdrBuf.byteOffset, hdrBuf.byteLength);
    let size = view.getUint32(0);
    const type = String.fromCharCode(hdrBuf[4], hdrBuf[5], hdrBuf[6], hdrBuf[7]);
    let headerSize = 8;

    if (size === 1) {
      if (hdrBuf.byteLength < 16) break;
      const high = view.getUint32(8);
      const low = view.getUint32(12);
      size = high * 2 ** 32 + low;
      headerSize = 16;
    } else if (size === 0) {
      size = blob.size - offset;
    }

    if (size < headerSize || offset + size > blob.size) break;
    boxes.push({ type, start: offset, size, headerSize });
    offset += size;
    if (boxes.length > 64) break;
  }

  return boxes;
}

/** Patch chunk offsets inside a moov atom copy by `delta` bytes. */
export function patchMoovChunkOffsets(moov: Uint8Array, delta: number): void {
  const view = new DataView(moov.buffer, moov.byteOffset, moov.byteLength);
  const containers = new Set(["moov", "trak", "mdia", "minf", "stbl", "edts", "udta", "moof"]);

  const walk = (start: number, end: number) => {
    let offset = start;
    while (offset + 8 <= end) {
      let size = view.getUint32(offset);
      const type = String.fromCharCode(
        moov[offset + 4],
        moov[offset + 5],
        moov[offset + 6],
        moov[offset + 7],
      );
      let headerSize = 8;

      if (size === 1) {
        if (offset + 16 > end) break;
        const high = view.getUint32(offset + 8);
        const low = view.getUint32(offset + 12);
        size = high * 2 ** 32 + low;
        headerSize = 16;
      } else if (size === 0) {
        size = end - offset;
      }

      if (size < headerSize || offset + size > end) break;

      if (type === "stco") {
        const entryCount = view.getUint32(offset + headerSize + 4);
        let p = offset + headerSize + 8;
        for (let i = 0; i < entryCount && p + 4 <= offset + size; i += 1) {
          view.setUint32(p, (view.getUint32(p) + delta) >>> 0);
          p += 4;
        }
      } else if (type === "co64") {
        const entryCount = view.getUint32(offset + headerSize + 4);
        let p = offset + headerSize + 8;
        for (let i = 0; i < entryCount && p + 8 <= offset + size; i += 1) {
          const high = view.getUint32(p);
          const low = view.getUint32(p + 4);
          const abs = high * 2 ** 32 + low + delta;
          view.setUint32(p, Math.floor(abs / 2 ** 32));
          view.setUint32(p + 4, abs >>> 0);
          p += 8;
        }
      } else if (containers.has(type)) {
        walk(offset + headerSize, offset + size);
      }

      offset += size;
    }
  };

  if (moov.byteLength < 8) return;
  let rootHeader = 8;
  const rootSize = view.getUint32(0);
  if (rootSize === 1 && moov.byteLength >= 16) {
    rootHeader = 16;
  }
  walk(rootHeader, moov.byteLength);
}

export function isMp4LikeFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "video/mp4" ||
    file.type === "video/quicktime" ||
    name.endsWith(".mp4") ||
    name.endsWith(".m4v") ||
    name.endsWith(".mov")
  );
}

export function layoutFromBoxes(boxes: TopBox[], size: number): Mp4LayoutInfo {
  const moov = boxes.find((b) => b.type === "moov");
  const mdat = boxes.find((b) => b.type === "mdat");
  return {
    faststart: Boolean(moov && mdat && moov.start < mdat.start),
    hasMoov: Boolean(moov),
    hasMdat: Boolean(mdat),
    size,
    moovSize: moov?.size ?? 0,
  };
}

export function inspectMp4Layout(buf: Uint8Array): Mp4LayoutInfo {
  return layoutFromBoxes(readTopBoxes(buf), buf.byteLength);
}

/** In-memory remux (tests / small buffers). Prefer Blob-based prepare for uploads. */
export function remuxMp4Faststart(input: Uint8Array): Uint8Array | null {
  const boxes = readTopBoxes(input);
  const moovBox = boxes.find((b) => b.type === "moov");
  const mdatBox = boxes.find((b) => b.type === "mdat");
  if (!moovBox || !mdatBox) return null;
  if (moovBox.start < mdatBox.start) return null;

  const prefix = boxes.filter(
    (b) => b.type !== "moov" && b.type !== "mdat" && b.start < mdatBox.start,
  );

  const moov = input.slice(moovBox.start, moovBox.start + moovBox.size);
  patchMoovChunkOffsets(moov, moovBox.size);

  const mdat = input.subarray(mdatBox.start, mdatBox.start + mdatBox.size);
  const prefixSize = prefix.reduce((sum, b) => sum + b.size, 0);
  const out = new Uint8Array(prefixSize + moovBox.size + mdatBox.size);
  let cursor = 0;
  for (const box of prefix) {
    out.set(input.subarray(box.start, box.start + box.size), cursor);
    cursor += box.size;
  }
  out.set(moov, cursor);
  cursor += moov.length;
  out.set(mdat, cursor);
  return out;
}

const MAX_MOOV_BYTES = 32 * 1024 * 1024; // safety: refuse absurd moov atoms

/**
 * Prepare a video File for web playback: remux MP4/MOV to faststart when needed.
 * Never throws — on any failure returns the original file so upload can proceed.
 */
export async function prepareVideoForUpload(file: File): Promise<{
  file: File;
  remuxed: boolean;
  layout: Mp4LayoutInfo | null;
  warning?: string;
}> {
  if (!isMp4LikeFile(file)) {
    return { file, remuxed: false, layout: null };
  }

  try {
    const boxes = await readTopBoxesFromBlob(file);
    const layout = layoutFromBoxes(boxes, file.size);
    const moovBox = boxes.find((b) => b.type === "moov");
    const mdatBox = boxes.find((b) => b.type === "mdat");

    if (!moovBox || !mdatBox) {
      return {
        file,
        remuxed: false,
        layout,
        warning: "Не удалось разобрать контейнер MP4 — загружаем как есть.",
      };
    }

    if (moovBox.start < mdatBox.start) {
      return { file, remuxed: false, layout };
    }

    if (moovBox.size > MAX_MOOV_BYTES) {
      return {
        file,
        remuxed: false,
        layout,
        warning: "Индекс видео слишком большой для авто-оптимизации — загружаем как есть.",
      };
    }

    const moov = new Uint8Array(
      await file.slice(moovBox.start, moovBox.start + moovBox.size).arrayBuffer(),
    );
    patchMoovChunkOffsets(moov, moovBox.size);

    const prefix = boxes.filter(
      (b) => b.type !== "moov" && b.type !== "mdat" && b.start < mdatBox.start,
    );
    const parts: BlobPart[] = [];
    for (const box of prefix) {
      parts.push(file.slice(box.start, box.start + box.size));
    }
    // Copy moov into a standalone buffer for the File parts list
    const moovCopy = new Uint8Array(moov.byteLength);
    moovCopy.set(moov);
    parts.push(moovCopy);
    parts.push(file.slice(mdatBox.start, mdatBox.start + mdatBox.size));

    const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
    const next = new File(parts, `${baseName}.mp4`, {
      type: "video/mp4",
      lastModified: Date.now(),
    });

    return {
      file: next,
      remuxed: true,
      layout: { ...layout, faststart: true, size: next.size },
    };
  } catch {
    return {
      file,
      remuxed: false,
      layout: null,
      warning: "Оптимизация не удалась — загружаем исходный файл.",
    };
  }
}
