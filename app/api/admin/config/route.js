import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const rows = await sql`
      SELECT key, value FROM config;
    `;

    const configObj = {};
    for (const r of rows) {
      configObj[r.key] = r.value;
    }

    return NextResponse.json({ success: true, config: configObj });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const entries = Object.entries(body);

    for (const [key, value] of entries) {
      if (typeof key === 'string') {
        const valStr = value !== null && value !== undefined ? String(value) : '';
        await sql`
          INSERT INTO config (key, value)
          VALUES (${key}, ${valStr})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
        `;
      }
    }

    return NextResponse.json({ success: true, message: 'Configuration saved successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to save config' }, { status: 500 });
  }
}
