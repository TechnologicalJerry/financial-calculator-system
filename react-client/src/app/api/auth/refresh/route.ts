import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const refreshTokenCookie = request.cookies.get('refresh_token')?.value;

    if (!refreshTokenCookie) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 2002,
          errorName: 'INVALID_TOKEN',
          message: 'Refresh token cookie is missing',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: refreshTokenCookie }),
    });

    const data = await response.json();

    if (!response.ok) {
      const res = NextResponse.json(data, { status: response.status });
      res.cookies.delete('refresh_token');
      return res;
    }

    const { refreshToken: newRefreshToken, accessToken, ...userData } = data.data;

    // Set rotated HttpOnly cookie
    const res = NextResponse.json({
      success: true,
      message: data.message,
      data: {
        accessToken,
        ...userData,
      },
    });

    res.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        errorCode: 1000,
        errorName: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to refresh token',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
