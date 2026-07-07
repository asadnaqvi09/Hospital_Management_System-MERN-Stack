import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2Client, isStorageConfigured } from "../config/r2.js"
import { env } from "../config/env.js"
import { AppError } from "./AppError.js"

const ensureStorageReady = () => {
  if (!isStorageConfigured()) {
    throw new AppError("File storage is not configured", 503, "STORAGE_NOT_CONFIGURED")
  }
}

export const uploadObject = async ({ key, body, contentType }) => {
  ensureStorageReady()
  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.r2.bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  )
  const publicUrl = env.r2.publicUrl ? `${env.r2.publicUrl.replace(/\/$/, "")}/${key}` : null
  return { key, url: publicUrl }
}

export const getSignedDownloadUrl = async (key, expiresInSeconds = 3600) => {
  ensureStorageReady()
  return getSignedUrl(r2Client, new GetObjectCommand({ Bucket: env.r2.bucket, Key: key }), {
    expiresIn: expiresInSeconds
  })
}

export const deleteObject = async (key) => {
  ensureStorageReady()
  await r2Client.send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: key }))
}
