import "server-only";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertSafeKey, type DocumentStorage } from "./types";

/**
 * Development and test storage on the local disk, outside /public so files are
 * never served. Refused on Vercel by src/server/env.ts.
 */
export function createLocalStorage(rootDir: string): DocumentStorage {
  const root = path.resolve(rootDir);
  const resolve = (key: string) => {
    assertSafeKey(key);
    return path.join(root, key);
  };
  return {
    async put(key, bytes) {
      const file = resolve(key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, bytes, { flag: "wx", mode: 0o600 });
    },
    async delete(key) {
      await rm(resolve(key), { force: true });
    },
  };
}
