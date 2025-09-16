import { NextRequest, NextResponse } from 'next/server'
import { signInWithPhone, signInWithEmail } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { phone, email, password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    let result

    if (phone) {
      result = await signInWithPhone(phone, password)
    } else if (email) {
      result = await signInWithEmail(email, password)
    } else {
      return NextResponse.json(
        { error: 'Phone or email is required' },
        { status: 400 }
      )
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || 'Authentication failed' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.data?.user
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
