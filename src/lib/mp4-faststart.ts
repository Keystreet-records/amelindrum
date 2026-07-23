/**
 * Progressive web video: faststart remux + codec checks.
 * Remux is memory-safe (Blob slices); only `moov` is loaded into RAM.
 */

export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const VIDEO_MAX_MB = 100;

type TopBox = {
  type: string;
  start: number;
  size: number;
};

/** Read top-level MP4 boxes from a Blob without loading the whole file. */
async function readTopBoxesFromBlob(blob: Blob): Promise<TopBox[]> {
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
    boxes.push({ type, start: offset, size });
    offset += size;
    if (boxes.length > 64) break;
  }

  return boxes;
}

/** Patch chunk offsets inside a moov atom copy by `delta` bytes. */
function patchMoovChunkOffsets(moov: Uint8Array, delta: number): void {
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
  if (rootSize === 1 && moov.byteLength >= 16) rootHeader = 16;
  walk(rootHeader, moov.byteLength);
}

function isMp4LikeFile(file: File): boolean {
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

function isWebmFile(file: File): boolean {
  return file.type === "video/webm" || file.name.toLowerCase().endsWith(".webm");
}

function hasFourCc(haystack: Uint8Array, tag: string): boolean {
  const bytes = new TextEncoder().encode(tag);
  outer: for (let i = 0; i <= haystack.length - bytes.length; i += 1) {
    for (let j = 0; j < bytes.length; j += 1) {
      if (haystack[i + j] !== bytes[j]) continue outer;
    }
    return true;
  }
  return false;
}

const MAX_MOOV_BYTES = 16 * 1024 * 1024;

export type PrepareVideoResult = {
  file: File;
  remuxed: boolean;
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
    return { file, remuxed: false };
  }

  if (!isMp4LikeFile(file)) {
    throw new Error("Формат видео: MP4 (H.264 + AAC), WebM или MOV.");
  }

  const boxes = await readTopBoxesFromBlob(file);
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

  const hasAvc1 = hasFourCc(moov, "avc1") || hasFourCc(moov, "avc3");
  const hasHevc = hasFourCc(moov, "hvc1") || hasFourCc(moov, "hev1");
  if (hasHevc && !hasAvc1) {
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
  parts.push(moov);
  parts.push(file.slice(mdatBox.start, mdatBox.start + mdatBox.size));

  const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
  const next = new File(parts, `${baseName}.mp4`, {
    type: "video/mp4",
    lastModified: Date.now(),
  });

  const outBoxes = await readTopBoxesFromBlob(next);
  const outMoov = outBoxes.find((b) => b.type === "moov");
  const outMdat = outBoxes.find((b) => b.type === "mdat");
  if (!outMoov || !outMdat || outMoov.start >= outMdat.start) {
    throw new Error(
      "Не удалось оптимизировать файл для мгновенного старта. Переэкспортируйте MP4 (H.264) и попробуйте снова.",
    );
  }

  return { file: next, remuxed: true };
}
