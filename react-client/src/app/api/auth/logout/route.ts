import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const refreshTokenCookie = request.cookies.get('refresh_token')?.value;

    if (refreshTokenCookie) {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenCookie }),
      }).catch(() => {
        // Ignore backend network errors during logout
      });
    }

    const res = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    res.cookies.delete('refresh_token');

    return res;
  } catch (error) {
    const res = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
    res.cookies.delete('refresh_token');
    return res;
  }
}
