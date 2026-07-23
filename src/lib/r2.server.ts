import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Public base URL without trailing slash, e.g. https://media.example.com */
  publicBaseUrl: string;
};

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() ?? "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? "";
  const bucket = process.env.R2_BUCKET_NAME?.trim() ?? "";
  const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
}

export function r2MissingEnvMessage(): string {
  return "Cloudflare R2 не настроен. Задайте R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL.";
}

function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/** Sanitize object key segments; keep folder/file structure under portfolio/. */
export function sanitizeR2ObjectKey(pathname: string): string {
  const cleaned = pathname
    .replace(/^\/+/, "")
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._\-/]/g, "-")
    .replace(/\/{2,}/g, "/");

  if (!cleaned || cleaned.includes("..")) {
    throw new Error("Некорректный путь файла");
  }
  if (!cleaned.startsWith("portfolio/")) {
    throw new Error("Загрузка разрешена только в portfolio/");
  }
  return cleaned;
}

export function publicUrlForKey(config: R2Config, key: string): string {
  return `${config.publicBaseUrl}/${key.replace(/^\/+/, "")}`;
}

/** Extract object key from our public R2 URL, or null if not ours. */
export function objectKeyFromPublicUrl(config: R2Config, url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;

    let path = parsed.pathname.replace(/^\/+/, "");
    const base = new URL(config.publicBaseUrl);
    if (parsed.hostname === base.hostname) {
      const basePath = base.pathname.replace(/\/+$/, "").replace(/^\/+/, "");
      if (basePath && path.startsWith(`${basePath}/`)) {
        path = path.slice(basePath.length + 1);
      } else if (basePath && path === basePath) {
        path = "";
      }
    } else if (!parsed.hostname.endsWith(".r2.dev")) {
      return null;
    }

    if (!path.startsWith("portfolio/")) return null;
    return path;
  } catch {
    return null;
  }
}

export const R2_OBJECT_CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function createPresignedPutUrl(options: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string; cacheControl: string }> {
  const config = getR2Config();
  if (!config) throw new Error(r2MissingEnvMessage());

  const key = sanitizeR2ObjectKey(options.key);
  const client = createR2Client(config);
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: options.contentType,
    // Signed into the PUT — client must send the same Cache-Control header.
    CacheControl: R2_OBJECT_CACHE_CONTROL,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: options.expiresInSeconds ?? 60 * 15,
  });

  return {
    uploadUrl,
    publicUrl: publicUrlForKey(config, key),
    key,
    cacheControl: R2_OBJECT_CACHE_CONTROL,
  };
}

export async function deleteR2ObjectByPublicUrl(url: string): Promise<"deleted" | "missing" | "not_managed"> {
  const config = getR2Config();
  if (!config) throw new Error(r2MissingEnvMessage());

  const key = objectKeyFromPublicUrl(config, url);
  if (!key) return "not_managed";

  const client = createR2Client(config);
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );
    return "deleted";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not found|nosuchkey|404/i.test(message)) return "missing";
    throw error;
  }
}
