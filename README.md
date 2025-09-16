<<<<<<< HEAD
# Foundarv Document Vault

An AI-powered, clutter-free document management system for individuals and startup founders. Built with Next.js, Supabase, and OpenAI integration.

## 🎯 Features

### Core Features
- **Multi-Auth System**: Sign in with phone + email
- **AI-Powered Processing**: Auto-naming, categorization, and document detection
- **Smart Organization**: Auto-cropping, PDF conversion, and intelligent folder structure
- **WhatsApp Integration**: Upload, retrieve, and manage files via WhatsApp
- **Apple-Style UI**: Clean, minimal dashboard with grid/list views
- **Secure Storage**: AES-256 encrypted files with audit logs

### User Types
- **Individual Users**: Generic file storage with custom folders
- **Founders**: Predefined folders (Incorporation, Legal, Finance, HR, ESOP, IP, Misc)

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Storage**: AWS S3 (configurable)
- **AI**: OpenAI GPT-4 Vision for document analysis
- **Image Processing**: Sharp for cropping and thumbnails
- **WhatsApp**: WhatsApp Cloud API (Meta)
- **Authentication**: Supabase Auth

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- AWS S3 bucket (optional, can use Supabase Storage)
- WhatsApp Business API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd foundarv-vault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ruatfcblbqqdsahofxvt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1YXRmY2JsYnFxZHNhaG9meHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5OTM2MDgsImV4cCI6MjA3MzU2OTYwOH0.-qfKL42yK84UrkVJ-paIUqEp8ZVS5aINwc1WHfiY14o
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1YXRmY2JsYnFxZHNhaG9meHZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk5MzYwOCwiZXhwIjoyMDczNTY5NjA4fQ.F4NVClZ5HEd6ROFt4ilyZrBME-T-OYUYsQmd-A4Kuro

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # AWS S3 Configuration (optional)
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=foundarv-vault-storage

   # WhatsApp Cloud API
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
   WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
   WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token

   # Encryption
   ENCRYPTION_KEY=your_32_character_encryption_key_here

   # App Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. **Set up Supabase Database**
   ```bash
   # Run the schema.sql file in your Supabase SQL editor
   # This will create all necessary tables, indexes, and RLS policies
   ```

5. **Start the development server**
```bash
npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 WhatsApp Integration

### Setup WhatsApp Business API

1. **Create a Meta Developer Account**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create a new app and select "Business" type

2. **Add WhatsApp Product**
   - Add WhatsApp product to your app
   - Get your Phone Number ID and Access Token

3. **Configure Webhook**
   - Set webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
   - Verify token: Use the same token from your environment variables

### WhatsApp Commands

Users can interact with the vault via WhatsApp:

- `help` - Show available commands
- `status` - Check vault status
- `list` - List recent files
- `find [query]` - Search for files
- `send [filename]` - Download specific file
- Upload images/documents directly

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Sign in with phone/email
- `POST /api/auth/signup` - Create new account

### Files
- `GET /api/upload` - List user files
- `POST /api/upload` - Upload new file

### Folders
- `GET /api/folders` - List user folders
- `POST /api/folders` - Create new folder

### WhatsApp
- `GET /api/whatsapp/webhook` - Webhook verification
- `POST /api/whatsapp/webhook` - Handle WhatsApp messages

## 🏗 Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── upload/         # File upload endpoints
│   │   ├── folders/        # Folder management
│   │   └── whatsapp/       # WhatsApp webhook
│   ├── auth/               # Authentication page
│   └── page.tsx            # Main dashboard
├── lib/
│   ├── auth.ts             # Authentication utilities
│   ├── file-processing.ts  # AI processing & file handling
│   ├── storage.ts          # AWS S3 storage utilities
│   ├── supabase.ts         # Database client & types
│   └── whatsapp.ts         # WhatsApp integration
└── components/             # Reusable UI components
```

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **AES-256 Encryption**: File encryption at rest
- **Signed URLs**: Time-limited access to files
- **Audit Logging**: Complete activity tracking
- **Input Validation**: Sanitized user inputs
- **Rate Limiting**: API request throttling

## 🎨 UI/UX Features

- **Apple-Style Design**: Clean, minimal interface
- **Responsive Layout**: Works on all devices
- **Dark/Light Mode**: Theme switching (coming soon)
- **Drag & Drop**: Intuitive file uploads
- **Real-time Updates**: Live file processing status
- **Search & Filter**: Advanced file discovery

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main**

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 📊 Database Schema

### Core Tables
- `users` - User accounts with Foundarv IDs
- `folders` - Folder organization
- `files` - File metadata and storage info
- `shares` - File sharing permissions
- `audit_logs` - Activity tracking
- `whatsapp_sessions` - WhatsApp user sessions

### Key Features
- **Auto-generated Foundarv IDs**: Unique 8-character identifiers
- **Founder Folders**: Pre-created folder structure for startups
- **File Metadata**: Rich metadata with AI-generated tags
- **Audit Trail**: Complete activity logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@foundarv.com
- Documentation: [docs.foundarv.com](https://docs.foundarv.com)
- Issues: GitHub Issues

## 🔮 Roadmap

### Phase 2 Features
- [ ] Email upload integration
- [ ] Advanced sharing permissions
- [ ] Document collaboration
- [ ] Mobile app (React Native)
- [ ] Advanced AI features
- [ ] Team workspaces
- [ ] API for third-party integrations

### Phase 3 Features
- [ ] Blockchain verification
- [ ] Advanced analytics
- [ ] Custom AI models
- [ ] Enterprise features
- [ ] White-label solutions

---

Built with ❤️ for secure document management
=======
# foundarv-vault
AI-powered document vault for individuals and startup founders
>>>>>>> d9a2ea544812204210d2f61d4afbbd6a85e14732
