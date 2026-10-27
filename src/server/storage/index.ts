import "server-only";
import { getEnv } from "@/server/env";
import { createLocalStorage } from "./local";
import { createS3Storage } from "./s3";
import type { DocumentStorage } from "./types";

let instance: DocumentStorage | undefined;

export function getDocumentStorage(): DocumentStorage {
  if (instance) return instance;
  const env = getEnv();
  instance =
    env.STORAGE_DRIVER === "s3"
      ? createS3Storage({
          bucket: env.STORAGE_BUCKET!,
          region: env.STORAGE_REGION,
          endpoint: env.STORAGE_ENDPOINT,
          accessKeyId: env.STORAGE_ACCESS_KEY_ID!,
          secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY!,
        })
      : createLocalStorage(env.STORAGE_LOCAL_DIR);
  return instance;
}
