/**
 * Progressive web video: faststart remux + codec checks for hosting-like playback.
 * Remux is memory-safe (Blob slices); only `moov` is loaded into RAM.
 */

export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const VIDEO_MAX_MB = 100;

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

export type Mp4CodecInfo = {
  hasAvc1: boolean;
  hasHevc: boolean;
  hasMp4a: boolean;
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
    file.type === "video/x-m4v" ||
    name.endsWith(".mp4") ||
    name.endsWith(".m4v") ||
    name.endsWith(".mov")
  );
}

export function isWebmFile(file: File): boolean {
  return file.type === "video/webm" || file.name.toLowerCase().endsWith(".webm");
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

export function detectCodecsInMoov(moov: Uint8Array): Mp4CodecInfo {
  const has = (tag: string) => {
    const bytes = new TextEncoder().encode(tag);
    outer: for (let i = 0; i <= moov.length - bytes.length; i += 1) {
      for (let j = 0; j < bytes.length; j += 1) {
        if (moov[i + j] !== bytes[j]) continue outer;
      }
      return true;
    }
    return false;
  };

  return {
    hasAvc1: has("avc1") || has("avc3"),
    hasHevc: has("hvc1") || has("hev1"),
    hasMp4a: has("mp4a"),
  };
}

/** In-memory remux (tests / small buffers). */
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

const MAX_MOOV_BYTES = 16 * 1024 * 1024;

export type PrepareVideoResult = {
  file: File;
  remuxed: boolean;
  layout: Mp4LayoutInfo | null;
  codecs: Mp4CodecInfo | null;
  streamingReady: boolean;
};

/**
 * Optimize a video for progressive web playback (moov-first / faststart).
 * Throws with a clear Russian message when the file cannot be made streamable.
 */
export async function prepareVideoForUpload(file: File): Promise<PrepareVideoResult> {
  if (file.size > VIDEO_MAX_BYTES) {
    throw new Error(
      `Файл больше ${VIDEO_MAX_MB} МБ. Сожмите видео (HandBrake / экспорт H.264) и загрузите снова.`,
    );
  }

  if (isWebmFile(file)) {
    return {
      file,
      remuxed: false,
      layout: null,
      codecs: null,
      streamingReady: true,
    };
  }

  if (!isMp4LikeFile(file)) {
    throw new Error("Формат видео: MP4 (H.264 + AAC), WebM или MOV.");
  }

  const boxes = await readTopBoxesFromBlob(file);
  const layout = layoutFromBoxes(boxes, file.size);
  const moovBox = boxes.find((b) => b.type === "moov");
  const mdatBox = boxes.find((b) => b.type === "mdat");

  if (!moovBox || !mdatBox) {
    throw new Error(
      "Не удалось прочитать контейнер MP4. Экспортируйте файл заново как MP4 (H.264 + AAC).",
    );
  }

  if (moovBox.size > MAX_MOOV_BYTES) {
    throw new Error("Индекс видео слишком большой. Сожмите или переэкспортируйте ролик.");
  }

  const moov = new Uint8Array(
    await file.slice(moovBox.start, moovBox.start + moovBox.size).arrayBuffer(),
  );
  const codecs = detectCodecsInMoov(moov);

  if (codecs.hasHevc && !codecs.hasAvc1) {
    throw new Error(
      "В файле HEVC/H.265 — многие браузеры его не играют. Экспортируйте в H.264 (AVC) + AAC.",
    );
  }

  // Already streamable
  if (moovBox.start < mdatBox.start) {
    return {
      file: new File([file], file.name.replace(/\.(mov|m4v)$/i, ".mp4") || file.name, {
        type: "video/mp4",
        lastModified: file.lastModified,
      }),
      remuxed: false,
      layout,
      codecs,
      streamingReady: true,
    };
  }

  // Move moov before mdat (progressive download / instant start)
  patchMoovChunkOffsets(moov, moovBox.size);

  const prefix = boxes.filter(
    (b) => b.type !== "moov" && b.type !== "mdat" && b.start < mdatBox.start,
  );
  const parts: BlobPart[] = [];
  for (const box of prefix) {
    parts.push(file.slice(box.start, box.start + box.size));
  }
  const moovCopy = new Uint8Array(moov.byteLength);
  moovCopy.set(moov);
  parts.push(moovCopy);
  parts.push(file.slice(mdatBox.start, mdatBox.start + mdatBox.size));

  const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
  const next = new File(parts, `${baseName}.mp4`, {
    type: "video/mp4",
    lastModified: Date.now(),
  });

  // Verify result is faststart
  const outBoxes = await readTopBoxesFromBlob(next);
  const outLayout = layoutFromBoxes(outBoxes, next.size);
  if (!outLayout.faststart) {
    throw new Error(
      "Не удалось оптимизировать файл для мгновенного старта. Переэкспортируйте MP4 (H.264) и попробуйте снова.",
    );
  }

  return {
    file: next,
    remuxed: true,
    layout: outLayout,
    codecs,
    streamingReady: true,
  };
}
