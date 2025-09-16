import { supabaseAdmin, WhatsAppSession } from './supabase'
import { getUserByFoundarvId } from './auth'
import { generateSignedUrl } from './storage'

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!

export interface WhatsAppMessage {
  to: string
  type: 'text' | 'image' | 'document' | 'template'
  text?: {
    body: string
  }
  image?: {
    link: string
    caption?: string
  }
  document?: {
    link: string
    filename: string
    caption?: string
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: Array<{
      type: string
      parameters: Array<{
        type: string
        text: string
      }>
    }>
  }
}

export interface WhatsAppWebhookEvent {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: string
          text?: {
            body: string
          }
          image?: {
            id: string
            mime_type: string
            sha256: string
          }
          document?: {
            id: string
            mime_type: string
            filename: string
            sha256: string
          }
        }>
        statuses?: Array<{
          id: string
          status: string
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}

export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: message.to,
          type: message.type,
          ...message
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send WhatsApp message')
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function handleWhatsAppWebhook(event: WhatsAppWebhookEvent): Promise<void> {
  try {
    for (const entry of event.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          const messages = change.value.messages || []
          
          for (const message of messages) {
            await processWhatsAppMessage(message, change.value.metadata.phone_number_id)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error)
  }
}

async function processWhatsAppMessage(message: any, phoneNumberId: string): Promise<void> {
  try {
    const phoneNumber = message.from
    const messageType = message.type
    const messageText = message.text?.body || ''

    // Get or create user session
    let session = await getWhatsAppSession(phoneNumber)
    if (!session) {
      session = await createWhatsAppSession(phoneNumber)
    }

    // Process different message types
    switch (messageType) {
      case 'text':
        await handleTextMessage(session, messageText)
        break
      case 'image':
        await handleImageMessage(session, message)
        break
      case 'document':
        await handleDocumentMessage(session, message)
        break
      default:
        await sendWhatsAppMessage({
          to: phoneNumber,
          type: 'text',
          text: {
            body: 'Sorry, I can only process text messages, images, and documents. Please try again.'
          }
        })
    }
  } catch (error) {
    console.error('Error processing WhatsApp message:', error)
  }
}

async function handleTextMessage(session: WhatsAppSession, text: string): Promise<void> {
  const command = text.toLowerCase().trim()
  
  switch (command) {
    case 'help':
      await sendHelpMessage(session.phone_number)
      break
    case 'status':
      await sendStatusMessage(session.phone_number)
      break
    case 'list':
      await sendFileListMessage(session.phone_number, session.user_id)
      break
    default:
      if (command.startsWith('find ') || command.startsWith('search ')) {
        const query = command.replace(/^(find|search)\s+/, '')
        await searchAndSendFiles(session.phone_number, session.user_id, query)
      } else if (command.startsWith('send ')) {
        const filename = command.replace(/^send\s+/, '')
        await sendSpecificFile(session.phone_number, session.user_id, filename)
      } else {
        await sendUnknownCommandMessage(session.phone_number)
      }
  }
}

async function handleImageMessage(session: WhatsAppSession, message: any): Promise<void> {
  try {
    // Download image from WhatsApp
    const imageUrl = await getMediaUrl(message.image.id)
    const imageBuffer = await downloadMedia(imageUrl)
    
    // Process and upload image
    // This would integrate with your file processing pipeline
    await sendWhatsAppMessage({
      to: session.phone_number,
      type: 'text',
      text: {
        body: 'Image received! Processing and uploading to your vault...'
      }
    })
    
    // TODO: Process image and upload to vault
    // This would call your file processing and storage functions
    
  } catch (error) {
    console.error('Error handling image message:', error)
    await sendWhatsAppMessage({
      to: session.phone_number,
      type: 'text',
      text: {
        body: 'Sorry, there was an error processing your image. Please try again.'
      }
    })
  }
}

async function handleDocumentMessage(session: WhatsAppSession, message: any): Promise<void> {
  try {
    // Download document from WhatsApp
    const documentUrl = await getMediaUrl(message.document.id)
    const documentBuffer = await downloadMedia(documentUrl)
    
    // Process and upload document
    await sendWhatsAppMessage({
      to: session.phone_number,
      type: 'text',
      text: {
        body: 'Document received! Processing and uploading to your vault...'
      }
    })
    
    // TODO: Process document and upload to vault
    
  } catch (error) {
    console.error('Error handling document message:', error)
    await sendWhatsAppMessage({
      to: session.phone_number,
      type: 'text',
      text: {
        body: 'Sorry, there was an error processing your document. Please try again.'
      }
    })
  }
}

async function getWhatsAppSession(phoneNumber: string): Promise<WhatsAppSession | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()

    if (error || !data) {
      return null
    }

    return data as WhatsAppSession
  } catch (error) {
    console.error('Error getting WhatsApp session:', error)
    return null
  }
}

async function createWhatsAppSession(phoneNumber: string): Promise<WhatsAppSession | null> {
  try {
    // Try to find user by phone number
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phoneNumber)
      .single()

    if (userError || !user) {
      // Create new user if not found
      const { data: newUser, error: newUserError } = await supabaseAdmin
        .from('users')
        .insert({
          phone: phoneNumber,
          email: `${phoneNumber}@whatsapp.foundarv.com`, // Temporary email
          user_type: 'individual'
        })
        .select()
        .single()

      if (newUserError || !newUser) {
        throw new Error('Failed to create user')
      }

      user = newUser
    }

    // Create WhatsApp session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('whatsapp_sessions')
      .insert({
        phone_number: phoneNumber,
        user_id: user.id,
        session_data: {}
      })
      .select()
      .single()

    if (sessionError || !session) {
      throw new Error('Failed to create WhatsApp session')
    }

    return session as WhatsAppSession
  } catch (error) {
    console.error('Error creating WhatsApp session:', error)
    return null
  }
}

async function getMediaUrl(mediaId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
      }
    )

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error getting media URL:', error)
    throw error
  }
}

async function downloadMedia(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    })

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Error downloading media:', error)
    throw error
  }
}

async function sendHelpMessage(phoneNumber: string): Promise<void> {
  const helpText = `🤖 *Foundarv Document Vault - WhatsApp Commands*

*Available Commands:*
• \`help\` - Show this help message
• \`status\` - Check your vault status
• \`list\` - List your files
• \`find [query]\` - Search for files
• \`send [filename]\` - Send specific file
• Upload images/documents directly

*Examples:*
• \`find MoA\` - Find Memorandum of Association
• \`send invoice.pdf\` - Send invoice file

Need help? Contact support at support@foundarv.com`

  await sendWhatsAppMessage({
    to: phoneNumber,
    type: 'text',
    text: { body: helpText }
  })
}

async function sendStatusMessage(phoneNumber: string): Promise<void> {
  // Get user stats
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('foundarv_id, created_at')
    .eq('phone', phoneNumber)
    .single()

  const { data: fileCount } = await supabaseAdmin
    .from('files')
    .select('id', { count: 'exact' })
    .eq('user_id', user?.id)

  const statusText = `📊 *Your Vault Status*

*Foundarv ID:* ${user?.foundarv_id || 'N/A'}
*Files Stored:* ${fileCount?.length || 0}
*Member Since:* ${user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}

*Quick Actions:*
• Send \`list\` to see your files
• Send \`help\` for more commands`

  await sendWhatsAppMessage({
    to: phoneNumber,
    type: 'text',
    text: { body: statusText }
  })
}

async function sendFileListMessage(phoneNumber: string, userId: string): Promise<void> {
  try {
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('display_name, file_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!files || files.length === 0) {
      await sendWhatsAppMessage({
        to: phoneNumber,
        type: 'text',
        text: {
          body: '📁 Your vault is empty. Upload some files to get started!'
        }
      })
      return
    }

    let fileList = '📁 *Your Recent Files*\n\n'
    files.forEach((file, index) => {
      const date = new Date(file.created_at).toLocaleDateString()
      fileList += `${index + 1}. ${file.display_name}\n   📅 ${date}\n\n`
    })

    fileList += '*To download a file, send:*\n`send [filename]`'

    await sendWhatsAppMessage({
      to: phoneNumber,
      type: 'text',
      text: { body: fileList }
    })
  } catch (error) {
    console.error('Error sending file list:', error)
    await sendWhatsAppMessage({
      to: phoneNumber,
      type: 'text',
      text: {
        body: 'Sorry, there was an error retrieving your files. Please try again.'
      }
    })
  }
}

async function searchAndSendFiles(phoneNumber: string, userId: string, query: string): Promise<void> {
  try {
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('display_name, file_type, created_at, storage_path')
      .eq('user_id', userId)
      .or(`display_name.ilike.%${query}%,tags.cs.{${query}}`)
      .limit(5)

    if (!files || files.length === 0) {
      await sendWhatsAppMessage({
        to: phoneNumber,
        type: 'text',
        text: {
          body: `🔍 No files found for "${query}". Try a different search term.`
        }
      })
      return
    }

    if (files.length === 1) {
      // Send the single file directly
      await sendFileToWhatsApp(phoneNumber, files[0])
    } else {
      // Show list of matching files
      let fileList = `🔍 *Found ${files.length} files for "${query}":*\n\n`
      files.forEach((file, index) => {
        const date = new Date(file.created_at).toLocaleDateString()
        fileList += `${index + 1}. ${file.display_name}\n   📅 ${date}\n\n`
      })
      fileList += '*Send the number to download that file*'

      await sendWhatsAppMessage({
        to: phoneNumber,
        type: 'text',
        text: { body: fileList }
      })
    }
  } catch (error) {
    console.error('Error searching files:', error)
    await sendWhatsAppMessage({
      to: phoneNumber,
      type: 'text',
      text: {
        body: 'Sorry, there was an error searching your files. Please try again.'
      }
    })
  }
}

async function sendSpecificFile(phoneNumber: string, userId: string, filename: string): Promise<void> {
  try {
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('display_name, file_type, storage_path, mime_type')
      .eq('user_id', userId)
      .ilike('display_name', `%${filename}%`)
      .single()

    if (!file) {
      await sendWhatsAppMessage({
        to: phoneNumber,
        type: 'text',
        text: {
          body: `❌ File "${filename}" not found. Use \`list\` to see your files.`
        }
      })
      return
    }

    await sendFileToWhatsApp(phoneNumber, file)
  } catch (error) {
    console.error('Error sending specific file:', error)
    await sendWhatsAppMessage({
      to: phoneNumber,
      type: 'text',
      text: {
        body: 'Sorry, there was an error sending the file. Please try again.'
      }
    })
  }
}

async function sendFileToWhatsApp(phoneNumber: string, file: any): Promise<void> {
  try {
    // Generate signed URL for the file
    const { success, url } = await generateSignedUrl(file.storage_path, 3600)
    
    if (!success || !url) {
      throw new Error('Failed to generate file URL')
    }

    // Send file based on type
    if (file.mime_type.startsWith('image/')) {
      await sendWhatsAppMessage({
        to: phoneNumber,
        type: 'image',
        image: {
          link: url,
          caption: `📄 ${file.display_name}`
        }
      })
    } else {
      await sendWhatsAppMessage({
        to: phoneNumber,
        type: 'document',
        document: {
          link: url,
          filename: file.display_name,
          caption: `📄 ${file.display_name}`
        }
      })
    }
  } catch (error) {
    console.error('Error sending file to WhatsApp:', error)
    await sendWhatsAppMessage({
      to: phoneNumber,
      type: 'text',
      text: {
        body: 'Sorry, there was an error sending the file. Please try again.'
      }
    })
  }
}

async function sendUnknownCommandMessage(phoneNumber: string): Promise<void> {
  await sendWhatsAppMessage({
    to: phoneNumber,
    type: 'text',
    text: {
      body: '❓ Unknown command. Send `help` to see available commands.'
    }
  })
}

export function verifyWhatsAppWebhook(mode: string, token: string, challenge: string): boolean {
  return mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN
}
