import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import sql from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

function formatFolderName(str) {
  if (!str) return 'General';
  const s = str.trim();
  const lower = s.toLowerCase();
  if (lower === 'categories') return 'Categories';
  if (lower === 'dishes') return 'Dishes';
  if (lower === 'icons') return 'Icons';
  if (lower === 'banners') return 'Banners';
  if (lower === 'general') return 'General';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function POST(request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ success: false, message: 'BLOB_READ_WRITE_TOKEN not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { action = 'move', assetUrl, assetName, items, targetFolder = 'General' } = body;

    const formattedTargetFolder = formatFolderName(targetFolder);

    const folderMap = {
      Categories: 'images/categories',
      Dishes: 'images/dishes',
      Icons: 'icons',
      Banners: 'banners',
      General: 'general',
    };

    const targetSubdir = folderMap[formattedTargetFolder] || formattedTargetFolder.toLowerCase().replace(/[^a-z0-9_-]+/g, '_');

    // Build list of items to process
    const rawItems = Array.isArray(items) && items.length > 0 
      ? items 
      : (assetUrl ? [{ assetUrl, assetName }] : []);

    if (rawItems.length === 0) {
      return NextResponse.json({ success: false, message: 'No items selected to move' }, { status: 400 });
    }

    let successCount = 0;
    const errors = [];

    for (const item of rawItems) {
      const url = item.assetUrl || item.url;
      const name = item.assetName || item.name || 'image.png';
      if (!url) continue;

      try {
        // 1. Fetch image bytes
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch source image: ${res.statusText}`);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type') || 'image/png';

        // 2. Put in destination folder
        const cleanName = (name || 'image.png').replace(/[^a-zA-Z0-9._-]/g, '_');
        const targetBlobPath = `nfc/${targetSubdir}/${cleanName}`;

        const newBlob = await put(targetBlobPath, buffer, {
          access: 'public',
          contentType,
          addRandomSuffix: true,
          token,
        });

        // 3. If action is move, update database and delete old blob
        if (action === 'move') {
          try {
            if (sql) {
              await sql`UPDATE products SET image_url = ${newBlob.url} WHERE image_url = ${url}`;
              await sql`UPDATE categories SET img = ${newBlob.url} WHERE img = ${url}`;
              await sql`UPDATE config SET value = ${newBlob.url} WHERE value = ${url}`;
            }
          } catch (dbErr) {
            console.warn('DB ref update warning on move:', dbErr?.message || dbErr);
          }

          try {
            if (url.startsWith('http://') || url.startsWith('https://')) {
              await del(url, { token });
            }
          } catch (delErr) {
            console.warn('Delete old blob warning on move:', delErr?.message || delErr);
          }
        }

        successCount++;
      } catch (err) {
        console.error(`Error transferring ${name}:`, err);
        errors.push(`${name}: ${err.message}`);
      }
    }

    if (successCount === 0 && errors.length > 0) {
      return NextResponse.json({ success: false, message: errors.join(', ') }, { status: 500 });
    }

    const itemLabel = successCount === 1 ? '1 item' : `${successCount} items`;
    return NextResponse.json({
      success: true,
      message: `Successfully moved ${itemLabel} to '${formattedTargetFolder}'`,
      count: successCount,
    });
  } catch (error) {
    console.error('Batch transfer error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Transfer failed' }, { status: 500 });
  }
}
