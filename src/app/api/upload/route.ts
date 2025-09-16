import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { processUploadedFile } from '@/lib/file-processing'
import { uploadWithThumbnail } from '@/lib/storage'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folderId') as string
    const shouldConvertToPdf = formData.get('convertToPdf') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Process the file
    const processedFile = await processUploadedFile(file, user.id, folderId)

    // Upload to storage
    const uploadResult = await uploadWithThumbnail(
      Buffer.from(await file.arrayBuffer()),
      processedFile.storagePath,
      processedFile.mimeType,
      {
        userId: user.id,
        originalName: processedFile.originalName,
        displayName: processedFile.displayName,
        fileType: processedFile.fileType,
        aiGeneratedName: processedFile.aiGeneratedName.toString(),
        tags: processedFile.tags.join(','),
        fileHash: processedFile.metadata.fileHash
      }
    )

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadResult.error },
        { status: 500 }
      )
    }

    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from('files')
      .insert({
        user_id: user.id,
        folder_id: folderId || null,
        original_name: processedFile.originalName,
        display_name: processedFile.displayName,
        file_type: processedFile.fileType,
        file_size: processedFile.size,
        mime_type: processedFile.mimeType,
        storage_path: processedFile.storagePath,
        encrypted_key: processedFile.encryptedKey,
        ai_generated_name: processedFile.aiGeneratedName,
        tags: processedFile.tags,
        metadata: processedFile.metadata
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save file metadata' },
        { status: 500 }
      )
    }

    // Log the upload action
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'file_uploaded',
        resource_type: 'file',
        resource_id: fileRecord.id,
        details: {
          filename: processedFile.displayName,
          fileType: processedFile.fileType,
          size: processedFile.size,
          aiGeneratedName: processedFile.aiGeneratedName
        },
        ip_address: request.ip || request.headers.get('x-forwarded-for'),
        user_agent: request.headers.get('user-agent')
      })

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        displayName: processedFile.displayName,
        fileType: processedFile.fileType,
        size: processedFile.size,
        mimeType: processedFile.mimeType,
        aiGeneratedName: processedFile.aiGeneratedName,
        tags: processedFile.tags,
        shouldConvertToPdf: processedFile.shouldConvertToPdf,
        createdAt: fileRecord.created_at
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,tags.cs.{${search}}`)
    }

    const { data: files, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Fetch files error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
