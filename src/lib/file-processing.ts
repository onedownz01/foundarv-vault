import OpenAI from 'openai'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import { createHash } from 'crypto'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ProcessedFile {
  originalName: string
  displayName: string
  fileType: string
  mimeType: string
  size: number
  storagePath: string
  encryptedKey: string
  aiGeneratedName: boolean
  tags: string[]
  metadata: Record<string, any>
  shouldConvertToPdf?: boolean
}

export async function detectDocumentType(file: File): Promise<{
  type: string
  confidence: number
  suggestedName: string
  tags: string[]
}> {
  try {
    const fileContent = await file.arrayBuffer()
    const base64 = Buffer.from(fileContent).toString('base64')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this document and provide:
              1. Document type (e.g., "Memorandum of Association", "Invoice", "Contract", "ID Document", "Receipt", "Certificate", etc.)
              2. Confidence level (0-1)
              3. Suggested filename (without extension, descriptive and professional)
              4. Relevant tags (array of strings)
              
              File: ${file.name}
              MIME type: ${file.type}
              Size: ${file.size} bytes`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the response
    const lines = content.split('\n')
    const type = lines.find(line => line.includes('Document type:'))?.split(':')[1]?.trim() || 'Unknown Document'
    const confidence = parseFloat(lines.find(line => line.includes('Confidence:'))?.split(':')[1]?.trim() || '0.5')
    const suggestedName = lines.find(line => line.includes('Suggested filename:'))?.split(':')[1]?.trim() || file.name.split('.')[0]
    const tagsLine = lines.find(line => line.includes('Tags:'))?.split(':')[1]?.trim()
    const tags = tagsLine ? tagsLine.split(',').map(tag => tag.trim()) : []

    return {
      type,
      confidence,
      suggestedName,
      tags
    }
  } catch (error) {
    console.error('Error detecting document type:', error)
    return {
      type: 'Unknown Document',
      confidence: 0.1,
      suggestedName: file.name.split('.')[0],
      tags: []
    }
  }
}

export async function cropDocumentEdges(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()
    
    // Use edge detection to find document boundaries
    const { data, info } = await image
      .greyscale()
      .normalize()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
      })
      .threshold(128)
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Find edges and crop
    const edges = findDocumentEdges(data, info.width, info.height)
    
    if (edges) {
      return await image
        .extract({
          left: edges.left,
          top: edges.top,
          width: edges.right - edges.left,
          height: edges.bottom - edges.top
        })
        .jpeg({ quality: 90 })
        .toBuffer()
    }

    return imageBuffer
  } catch (error) {
    console.error('Error cropping document edges:', error)
    return imageBuffer
  }
}

function findDocumentEdges(data: Buffer, width: number, height: number): { left: number, top: number, right: number, bottom: number } | null {
  const threshold = 0.1 // 10% of image dimensions
  const minEdge = Math.min(width, height) * threshold
  
  let left = width, right = 0, top = height, bottom = 0
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = data[y * width + x]
      if (pixel > 128) { // White pixel (edge detected)
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }
  
  // Check if we found valid edges
  if (right - left < minEdge || bottom - top < minEdge) {
    return null
  }
  
  return { left, top, right, bottom }
}

export async function convertImageToPdf(imageBuffer: Buffer, filename: string): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create()
    const image = await pdfDoc.embedPng(imageBuffer)
    
    const page = pdfDoc.addPage([image.width, image.height])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    })
    
    return Buffer.from(await pdfDoc.save())
  } catch (error) {
    console.error('Error converting image to PDF:', error)
    throw error
  }
}

export async function generateFileHash(buffer: Buffer): Promise<string> {
  return createHash('sha256').update(buffer).digest('hex')
}

export async function processUploadedFile(
  file: File,
  userId: string,
  folderId?: string
): Promise<ProcessedFile> {
  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileHash = await generateFileHash(fileBuffer)
    
    // Detect document type using AI
    const { type, confidence, suggestedName, tags } = await detectDocumentType(file)
    
    // Check if it's an image that might need cropping
    let processedBuffer = fileBuffer
    let shouldConvertToPdf = false
    
    if (file.type.startsWith('image/')) {
      // Crop document edges if it's a document image
      processedBuffer = await cropDocumentEdges(fileBuffer)
      
      // Ask user if they want to convert to PDF (this would be handled in the UI)
      shouldConvertToPdf = true
    }
    
    // Generate storage path
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || ''
    const storagePath = `users/${userId}/files/${timestamp}-${fileHash.substring(0, 8)}.${extension}`
    
    // Generate encrypted key (in production, use proper encryption)
    const encryptedKey = generateEncryptedKey(fileHash)
    
    return {
      originalName: file.name,
      displayName: suggestedName,
      fileType: type,
      mimeType: file.type,
      size: processedBuffer.length,
      storagePath,
      encryptedKey,
      aiGeneratedName: confidence > 0.7,
      tags,
      metadata: {
        originalSize: file.size,
        processedSize: processedBuffer.length,
        confidence,
        uploadedAt: new Date().toISOString(),
        fileHash
      },
      shouldConvertToPdf
    }
  } catch (error) {
    console.error('Error processing uploaded file:', error)
    throw error
  }
}

function generateEncryptedKey(fileHash: string): string {
  // In production, use proper AES-256 encryption
  // For now, return a simple hash
  return createHash('sha256').update(fileHash + process.env.ENCRYPTION_KEY).digest('hex')
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦'
  if (mimeType.includes('video')) return '🎥'
  if (mimeType.includes('audio')) return '🎵'
  return '📁'
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}
