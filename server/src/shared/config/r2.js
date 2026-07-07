import { S3Client } from "@aws-sdk/client-s3"
import { env } from "./env.js"

const resolveEndpoint = () => {
  if (env.r2.endpoint) {
    return env.r2.endpoint
  }
  if (env.r2.accountId) {
    return `https://${env.r2.accountId}.r2.cloudflarestorage.com`
  }
  return undefined
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: resolveEndpoint(),
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey
  }
})

export const isStorageConfigured = () => {
  return Boolean(env.r2.bucket && env.r2.accessKeyId && env.r2.secretAccessKey)
}
