/** Client-side image prep for CMS uploads: decode → crop → resize → encode. */

export type ImageAspectPreset = "video" | "portrait" | "free";

export type OptimizeImageOptions = {
  /** Target frame. `video` = 16:9, `portrait` = 4:5, `free` = keep ratio. */
  aspect?: ImageAspectPreset;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Preferred output; falls back to JPEG if the browser cannot encode WebP. */
  preferWebp?: boolean;
  fileName?: string;
};

export type OptimizedImage = {
  file: File;
  width: number;
  height: number;
  optimized: boolean;
  sourceWidth: number;
  sourceHeight: number;
};

const PRESET_RATIO: Record<Exclude<ImageAspectPreset, "free">, number> = {
  video: 16 / 9,
  portrait: 4 / 5,
};

function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function extensionForMime(mime: string): string {
  if (mime === "image/webp") return "webp";
  if (mime === "image/png") return "png";
  return "jpg";
}

function buildFileName(base: string | undefined, mime: string): string {
  const stem = (base ?? "image").replace(/\.[^.]+$/, "") || "image";
  return `${stem}.${extensionForMime(mime)}`;
}

/**
 * Center-crop to aspect (optional), downscale to max box, encode WebP/JPEG.
 * Keeps uploads small and fills 16:9 portfolio cards without letterboxing strips.
 */
export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {},
): Promise<OptimizedImage> {
  const aspect = options.aspect ?? "free";
  const maxWidth = options.maxWidth ?? 1280;
  const maxHeight = options.maxHeight ?? 1280;
  const quality = options.quality ?? 0.82;
  const preferWebp = options.preferWebp ?? true;

  const bitmap = await loadImageBitmap(file);
  const sourceWidth = bitmap.width;
  const sourceHeight = bitmap.height;

  if (!sourceWidth || !sourceHeight) {
    bitmap.close();
    throw new Error("Не удалось прочитать изображение");
  }

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (aspect !== "free") {
    const target = PRESET_RATIO[aspect];
    const sourceRatio = sourceWidth / sourceHeight;
    if (sourceRatio > target) {
      sw = Math.round(sourceHeight * target);
      sx = Math.round((sourceWidth - sw) / 2);
    } else if (sourceRatio < target) {
      sh = Math.round(sourceWidth / target);
      sy = Math.round((sourceHeight - sh) / 2);
    }
  }

  const scale = Math.min(1, maxWidth / sw, maxHeight / sh);
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));

  const alreadyFits =
    aspect === "free" &&
    sourceWidth === width &&
    sourceHeight === height &&
    (file.type === "image/jpeg" || file.type === "image/webp") &&
    file.size <= 350_000;

  if (alreadyFits) {
    bitmap.close();
    return {
      file,
      width: sourceWidth,
      height: sourceHeight,
      optimized: false,
      sourceWidth,
      sourceHeight,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas недоступен в этом браузере");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#0a0e18";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  bitmap.close();

  const candidates = preferWebp
    ? (["image/webp", "image/jpeg"] as const)
    : (["image/jpeg"] as const);

  let blob: Blob | null = null;
  let mime: string = "image/jpeg";
  for (const type of candidates) {
    blob = await canvasToBlob(canvas, type, quality);
    if (blob && blob.size > 0) {
      mime = type;
      break;
    }
  }

  if (!blob) {
    throw new Error("Не удалось сжать изображение");
  }

  const optimized = new File([blob], buildFileName(options.fileName ?? file.name, mime), {
    type: mime,
    lastModified: Date.now(),
  });

  return {
    file: optimized,
    width,
    height,
    optimized: true,
    sourceWidth,
    sourceHeight,
  };
}

export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось прочитать изображение"));
    };
    img.src = url;
  });
}
