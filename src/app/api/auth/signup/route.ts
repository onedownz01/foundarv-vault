import { NextRequest, NextResponse } from 'next/server'
import { signUpWithPhone, signUpWithEmail } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { phone, email, password, userType } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (!phone || !email) {
      return NextResponse.json(
        { error: 'Both phone and email are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Try phone signup first, then email
    let result = await signUpWithPhone(phone, password, email, userType)
    
    if (result.error) {
      // If phone signup fails, try email signup
      result = await signUpWithEmail(email, password, phone, userType)
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || 'Signup failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.data?.user,
      message: 'Account created successfully. Please check your email for verification.'
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
