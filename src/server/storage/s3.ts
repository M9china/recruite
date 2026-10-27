import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { assertSafeKey, type DocumentStorage } from "./types";

type Config = {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
};

/**
 * S3-compatible private storage (AWS S3, Cloudflare R2, Backblaze B2…).
 * The bucket must block public access; objects are written with no ACL.
 */
export function createS3Storage(config: Config): DocumentStorage {
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: Boolean(config.endpoint),
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  return {
    async put(key, bytes, contentType) {
      assertSafeKey(key);
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: bytes,
          ContentType: contentType,
          ContentDisposition: "attachment",
          ServerSideEncryption: config.endpoint ? undefined : "AES256",
          // Never overwrite: keys are random, so an existing key means something is wrong.
          IfNoneMatch: "*",
        }),
      );
    },
    async delete(key) {
      assertSafeKey(key);
      await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    },
  };
}
