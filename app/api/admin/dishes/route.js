import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search');

    let dishes;
    if (categoryId && categoryId !== 'all') {
      dishes = await sql`
        SELECT p.*, c.name AS category_name, c.img AS category_img
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.category_id = ${parseInt(categoryId)}
        ORDER BY p.name ASC;
      `;
    } else {
      dishes = await sql`
        SELECT p.*, c.name AS category_name, c.img AS category_img
        FROM products p
        JOIN categories c ON c.id = p.category_id
        ORDER BY c.display_order ASC, p.name ASC;
      `;
    }

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      dishes = dishes.filter(d => d.name.toLowerCase().includes(q) || d.category_name.toLowerCase().includes(q));
    }

    return NextResponse.json({ success: true, dishes });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch dishes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      category_id, 
      name, 
      price, 
      compare_price = null, 
      image_url = null, 
      available = true,
      pricing_type = 'count',
      variants_json = '[]'
    } = body;

    if (!category_id || !name || price === undefined) {
      return NextResponse.json({ success: false, message: 'Category, dish name, and price are required' }, { status: 400 });
    }

    const compPriceVal = compare_price ? parseFloat(compare_price) : null;
    const imgUrlVal = image_url ? String(image_url).trim() : null;
    const variantsStr = typeof variants_json === 'object' ? JSON.stringify(variants_json) : String(variants_json || '[]');

    const [newDish] = await sql`
      INSERT INTO products (category_id, name, price, compare_price, image_url, available, pricing_type, variants_json)
      VALUES (
        ${parseInt(category_id)}, 
        ${name.trim()}, 
        ${parseFloat(price)}, 
        ${compPriceVal}, 
        ${imgUrlVal}, 
        ${Boolean(available)},
        ${String(pricing_type || 'count')},
        ${variantsStr}
      )
      RETURNING *;
    `;

    return NextResponse.json({ success: true, dish: newDish, message: 'Dish created successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to create dish' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id, 
      category_id, 
      name, 
      price, 
      compare_price = null, 
      image_url = null, 
      available,
      pricing_type = 'count',
      variants_json = '[]'
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Dish ID is required' }, { status: 400 });
    }

    let updated;
    if (name !== undefined && price !== undefined && category_id !== undefined) {
      const compPriceVal = compare_price ? parseFloat(compare_price) : null;
      const imgUrlVal = image_url ? String(image_url).trim() : null;
      const variantsStr = typeof variants_json === 'object' ? JSON.stringify(variants_json) : String(variants_json || '[]');

      [updated] = await sql`
        UPDATE products
        SET 
          category_id = ${parseInt(category_id)}, 
          name = ${name.trim()}, 
          price = ${parseFloat(price)}, 
          compare_price = ${compPriceVal}, 
          image_url = ${imgUrlVal}, 
          available = ${Boolean(available)},
          pricing_type = ${String(pricing_type || 'count')},
          variants_json = ${variantsStr}
        WHERE id = ${parseInt(id)}
        RETURNING *;
      `;
    } else if (available !== undefined) {
      [updated] = await sql`
        UPDATE products
        SET available = ${Boolean(available)}
        WHERE id = ${parseInt(id)}
        RETURNING *;
      `;
    }

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Dish not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, dish: updated, message: 'Dish updated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update dish' }, { status: 500 });
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
      return NextResponse.json({ success: false, message: 'Dish ID is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM products
      WHERE id = ${parseInt(id)};
    `;

    return NextResponse.json({ success: true, message: 'Dish deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete dish' }, { status: 500 });
  }
}
