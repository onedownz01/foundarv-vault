import AWS from 'aws-sdk'
import { createHash } from 'crypto'

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET!

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

export interface DownloadResult {
  success: boolean
  buffer?: Buffer
  error?: string
}

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata || {},
      ServerSideEncryption: 'AES256',
    }

    const result = await s3.upload(params).promise()
    
    return {
      success: true,
      url: result.Location,
      key: result.Key
    }
  } catch (error) {
    console.error('Error uploading file to S3:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function downloadFile(key: string): Promise<DownloadResult> {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    }

    const result = await s3.getObject(params).promise()
    
    return {
      success: true,
      buffer: result.Body as Buffer
    }
  } catch (error) {
    console.error('Error downloading file from S3:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    }

    await s3.deleteObject(params).promise()
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting file from S3:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function generateSignedUrl(
  key: string,
  expiresIn: number = 3600,
  operation: 'getObject' | 'putObject' = 'getObject'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn,
    }

    const url = await s3.getSignedUrlPromise(operation, params)
    
    return {
      success: true,
      url
    }
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function listUserFiles(userId: string, prefix?: string): Promise<{
  success: boolean
  files?: Array<{
    key: string
    lastModified: Date
    size: number
    contentType: string
  }>
  error?: string
}> {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: prefix || `users/${userId}/`,
      MaxKeys: 1000,
    }

    const result = await s3.listObjectsV2(params).promise()
    
    const files = (result.Contents || []).map(item => ({
      key: item.Key!,
      lastModified: item.LastModified!,
      size: item.Size!,
      contentType: item.ContentType || 'application/octet-stream'
    }))
    
    return {
      success: true,
      files
    }
  } catch (error) {
    console.error('Error listing user files:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export function generateFileKey(userId: string, filename: string, fileHash: string): string {
  const timestamp = Date.now()
  const extension = filename.split('.').pop() || ''
  return `users/${userId}/files/${timestamp}-${fileHash.substring(0, 8)}.${extension}`
}

export function generateThumbnailKey(userId: string, fileKey: string): string {
  return fileKey.replace(/\.(jpg|jpeg|png|gif)$/i, '_thumb.jpg')
}

export async function createThumbnail(
  imageBuffer: Buffer,
  size: number = 200
): Promise<Buffer> {
  try {
    const sharp = require('sharp')
    
    const thumbnail = await sharp(imageBuffer)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()
    
    return thumbnail
  } catch (error) {
    console.error('Error creating thumbnail:', error)
    throw error
  }
}

export async function uploadWithThumbnail(
  buffer: Buffer,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<UploadResult & { thumbnailUrl?: string }> {
  try {
    // Upload main file
    const uploadResult = await uploadFile(buffer, key, contentType, metadata)
    
    if (!uploadResult.success) {
      return uploadResult
    }
    
    // Create and upload thumbnail if it's an image
    if (contentType.startsWith('image/')) {
      try {
        const thumbnailBuffer = await createThumbnail(buffer)
        const thumbnailKey = generateThumbnailKey('', key)
        
        const thumbnailResult = await uploadFile(
          thumbnailBuffer,
          thumbnailKey,
          'image/jpeg',
          { ...metadata, isThumbnail: 'true' }
        )
        
        if (thumbnailResult.success) {
          return {
            ...uploadResult,
            thumbnailUrl: thumbnailResult.url
          }
        }
      } catch (thumbnailError) {
        console.warn('Failed to create thumbnail:', thumbnailError)
        // Don't fail the main upload if thumbnail creation fails
      }
    }
    
    return uploadResult
  } catch (error) {
    console.error('Error uploading file with thumbnail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
