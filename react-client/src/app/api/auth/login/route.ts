import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'NextJS Client',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    const { refreshToken, accessToken, ...userData } = data.data;

    // Set HttpOnly cookie for Refresh Token
    const res = NextResponse.json({
      success: true,
      message: data.message,
      data: {
        accessToken,
        ...userData,
      },
    });

    res.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        errorCode: 1000,
        errorName: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to authenticate with backend server',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
