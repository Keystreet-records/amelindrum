/**
 * Stub: @vercel/cli-config pulls xdg-app-paths which uses `require` and
 * crashes under Nitro's ESM serverless bundle. Kept as a safe alias.
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
