import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuid } from 'uuid'
import path from 'path'
import { AppError } from './errors'

const mimeToExt: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
}

const getS3Client = (): S3Client => {
  const region = process.env.S3_REGION
  if (!region) {
    throw new AppError('INTERNAL_ERROR', 'S3_REGION is required', 500)
  }

  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey }
    })
  }

  return new S3Client({ region })
}

export const uploadToS3 = async (
  file: Express.Multer.File,
  options?: { prefix?: string }
): Promise<string> => {
  const bucket = process.env.S3_BUCKET
  const region = process.env.S3_REGION

  if (!bucket || !region) {
    throw new AppError('INTERNAL_ERROR', 'S3 is not configured', 500, {
      missing: ['S3_BUCKET', 'S3_REGION'].filter((key) => !process.env[key])
    })
  }

  const prefix = options?.prefix ? options.prefix.replace(/^\/+|\/+$/g, '') : 'uploads'
  const ext = path.extname(file.originalname).toLowerCase() || mimeToExt[file.mimetype] || ''
  const key = `${prefix}/${uuid()}${ext}`

  const client = getS3Client()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  )

  const publicBaseRaw = process.env.S3_PUBLIC_URL ?? `https://${bucket}.s3.${region}.amazonaws.com`
  const publicBase = publicBaseRaw.replace(/\/+$/g, '')
  return `${publicBase}/${key}`
}
