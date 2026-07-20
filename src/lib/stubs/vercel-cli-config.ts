/**
 * Stub: @vercel/cli-config pulls xdg-app-paths which uses `require` and
 * crashes under Nitro's ESM serverless bundle. Production Blob auth uses
 * BLOB_READ_WRITE_TOKEN / VERCEL_OIDC_TOKEN from env — CLI config is unused.
 */
export function getGlobalPathConfig(): string {
  return "/tmp";
}

export function tryReadAuthConfig(_dir?: string): null {
  return null;
}

export function writeAuthConfig(_dir?: string, _config?: unknown): void {}

export function readConfigFile(): null {
  return null;
}

export default {
  getGlobalPathConfig,
  tryReadAuthConfig,
  writeAuthConfig,
  readConfigFile,
};
