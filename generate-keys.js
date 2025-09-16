// Simple script to generate random keys for deployment
const crypto = require('crypto');

console.log('🔑 Foundarv Vault - Key Generator');
console.log('=====================================\n');

// Generate 32-character encryption key
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('ENCRYPTION_KEY=' + encryptionKey);

// Generate NextAuth secret
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('NEXTAUTH_SECRET=' + nextAuthSecret);

console.log('\n📋 Copy these values to your Vercel environment variables:');
console.log('1. Go to your Vercel project settings');
console.log('2. Click "Environment Variables"');
console.log('3. Add these two variables with the values above');
console.log('\n✅ You still need to get Supabase and OpenAI keys from their websites!');
