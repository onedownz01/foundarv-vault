# 🚀 Quick Start - Deploy Foundarv Vault in 15 Minutes

## ✅ Checklist - Follow These Steps

### Step 1: Create Accounts (5 minutes)
- [ ] Go to [supabase.com](https://supabase.com) → Sign up → Create project
- [ ] Go to [vercel.com](https://vercel.com) → Sign up with GitHub
- [ ] Go to [platform.openai.com](https://platform.openai.com) → Sign up → Add payment method

### Step 2: Get Your Keys (3 minutes)
- [ ] **Supabase**: Project Settings → API → Copy URL and keys
- [ ] **OpenAI**: API Keys → Create new key
- [ ] **Generated Keys**: Use the keys from the terminal output above

### Step 3: Set Up Database (2 minutes)
- [ ] Supabase → SQL Editor → New Query
- [ ] Copy contents of `supabase/schema.sql` file
- [ ] Paste and click "Run"

### Step 4: Deploy to Vercel (5 minutes)
- [ ] Vercel → New Project → Import from GitHub
- [ ] Find "foundarv-vault" → Import
- [ ] Go to Settings → Environment Variables
- [ ] Add these 7 variables:

```
NEXT_PUBLIC_SUPABASE_URL = [your supabase url]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your supabase anon key]
SUPABASE_SERVICE_ROLE_KEY = [your supabase service role key]
OPENAI_API_KEY = [your openai key]
ENCRYPTION_KEY = 1faa7c8eb8238f1ae296443b6cf0c5d9
NEXTAUTH_URL = https://your-project-name.vercel.app
NEXTAUTH_SECRET = ZRLVspFqjXn8x5SB+FZyDbrBgUEM8zT9kDH/XIKHHLs=
```

- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes
- [ ] Click "Visit" when done!

### Step 5: Test Your App (2 minutes)
- [ ] Open your deployed URL
- [ ] Click "Create Account"
- [ ] Fill in your details
- [ ] Upload a test file
- [ ] See AI magic happen! ✨

## 🎉 You're Done!

Your secure document vault is now live and ready to use!

**Your app URL**: https://your-project-name.vercel.app

## 🆘 Need Help?

If you get stuck on any step:
1. Check the detailed `DEPLOYMENT_GUIDE.md`
2. Make sure all environment variables are set correctly
3. Verify the database schema was run successfully

## 💡 Pro Tips

- Start with "Individual User" account type
- Try uploading different file types to see AI naming
- The app works on mobile too!
- You can always add WhatsApp integration later

**Total time needed**: 15 minutes
**Technical knowledge required**: None! 😊
