import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const categories = await sql`
      SELECT c.*, COUNT(p.id)::int AS product_count 
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC;
    `;

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, img, display_order = 0 } = body;

    if (!name || !img) {
      return NextResponse.json({ success: false, message: 'Name and image key are required' }, { status: 400 });
    }

    const [newCategory] = await sql`
      INSERT INTO categories (name, img, display_order)
      VALUES (${name.trim()}, ${img.trim()}, ${parseInt(display_order) || 0})
      RETURNING *;
    `;

    return NextResponse.json({ success: true, category: newCategory, message: 'Category created' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, img, display_order } = body;

    if (!id || !name || !img) {
      return NextResponse.json({ success: false, message: 'ID, name, and image key are required' }, { status: 400 });
    }

    const [updated] = await sql`
      UPDATE categories
      SET name = ${name.trim()}, img = ${img.trim()}, display_order = ${parseInt(display_order) || 0}
      WHERE id = ${id}
      RETURNING *;
    `;

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category: updated, message: 'Category updated' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Category ID is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM categories
      WHERE id = ${parseInt(id)};
    `;

    return NextResponse.json({ success: true, message: 'Category and its dishes deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
