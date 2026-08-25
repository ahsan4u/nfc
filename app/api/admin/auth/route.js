import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminPassword, getAdminSessionToken, isAdminAuthenticated } from '@/lib/admin-auth';

export async function POST(request) {
  try {
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ success: false, message: 'Password is required' }, { status: 400 });
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ success: false, message: 'Invalid Admin password' }, { status: 401 });
    }

    const token = getAdminSessionToken();
    const cookieStore = await cookies();

    cookieStore.set('nfc_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true, message: 'Authenticated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({ authenticated });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('nfc_admin_session');
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
