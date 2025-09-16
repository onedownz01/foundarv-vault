# 🚀 Foundarv Vault - Simple Deployment Guide

## Step 1: Get Your API Keys

### 1.1 Supabase Keys
1. Go to your Supabase project dashboard
2. Click "Settings" (gear icon) in the left sidebar
3. Click "API" in the settings menu
4. Copy these values:
   - **Project URL** (looks like: https://abcdefgh.supabase.co)
   - **anon public** key (starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
   - **service_role** key (starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)

### 1.2 OpenAI Key
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Name it "foundarv-vault"
4. Copy the key (starts with: sk-...)

### 1.3 WhatsApp Business API (Optional - Skip for now)
- This is complex to set up
- You can add it later
- For now, the app will work without WhatsApp

## Step 2: Set Up Database

### 2.1 Run Database Setup
1. Go to your Supabase project
2. Click "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the entire contents of `supabase/schema.sql` file
5. Paste it into the SQL editor
6. Click "Run" button
7. Wait for "Success" message

## Step 3: Deploy to Vercel

### 3.1 Connect GitHub
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Click "Import Git Repository"
4. Connect your GitHub account
5. Find "foundarv-vault" repository
6. Click "Import"

### 3.2 Configure Environment Variables
In Vercel dashboard, go to your project settings:

1. Click "Settings" tab
2. Click "Environment Variables" in left sidebar
3. Add these variables one by one:

```
NEXT_PUBLIC_SUPABASE_URL = your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY = your_supabase_service_role_key_here
OPENAI_API_KEY = your_openai_api_key_here
ENCRYPTION_KEY = your_32_character_random_string_here
NEXTAUTH_URL = https://your-project-name.vercel.app
NEXTAUTH_SECRET = your_random_secret_string_here
```

### 3.3 Deploy
1. Click "Deploy" button
2. Wait 2-3 minutes
3. Click "Visit" when deployment is complete

## Step 4: Test Your App

1. Open your deployed URL
2. Click "Create Account"
3. Fill in your details
4. Choose "Individual User" or "Startup Founder"
5. Click "Create Account"
6. Try uploading a file!

## Step 5: Optional - Add WhatsApp (Advanced)

If you want WhatsApp features later:
1. Create a Meta Developer account
2. Set up WhatsApp Business API
3. Add WhatsApp environment variables to Vercel

## Troubleshooting

### Common Issues:

**"Database error"**
- Make sure you ran the SQL schema
- Check your Supabase keys are correct

**"OpenAI error"**
- Check your OpenAI API key
- Make sure you have credits in your account

**"Upload not working"**
- Check all environment variables are set
- Make sure Supabase service role key is correct

### Need Help?
- Check the main README.md for detailed setup
- All code is ready to go!
- Just follow these steps and you'll have a working app

## What You'll Have After Deployment:

✅ Secure document vault
✅ AI-powered file naming
✅ Apple-style interface
✅ File organization
✅ User authentication
✅ Mobile-friendly design
✅ Ready for production use

Your app will be live at: https://your-project-name.vercel.app
