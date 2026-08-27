import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
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
    const { 
      imageBase64, 
      originalName, 
      originalUrl,
      folder: rawFolder = 'General',
      replaceOriginal = false,
      colours = 64,
      usePalette = true,
    } = body;
    const folder = formatFolderName(rawFolder);

    if (!imageBase64) {
      return NextResponse.json({ success: false, message: 'Missing imageBase64 data' }, { status: 400 });
    }

    // Convert base64 data url to Buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const rawBuffer = Buffer.from(base64Data, 'base64');

    // Process image buffer with Sharp palette color reduction for reduced file size
    let processedBuffer = rawBuffer;
    try {
      if (usePalette && colours && Number(colours) >= 2 && Number(colours) <= 256) {
        const numColours = Math.min(256, Math.max(2, parseInt(colours, 10)));
        processedBuffer = await sharp(rawBuffer)
          .png({ palette: true, colours: numColours })
          .toBuffer();
      } else {
        processedBuffer = await sharp(rawBuffer)
          .png({ quality: 90 })
          .toBuffer();
      }
    } catch (sharpErr) {
      console.warn('Sharp optimization fallback:', sharpErr?.message || sharpErr);
      processedBuffer = rawBuffer;
    }

    const baseName = (originalName || 'image.png').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFileName = replaceOriginal 
      ? `${baseName}.png`
      : `${baseName}_cropped_${Date.now()}.png`;

    const folderMap = {
      Categories: 'images/categories',
      Dishes: 'images/dishes',
      Icons: 'icons',
      Banners: 'banners',
      General: 'general',
    };

    const targetSubdir = folderMap[folder] || folder.toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
    const targetBlobPath = `nfc/${targetSubdir}/${cleanFileName}`;

    // Upload the processed buffer with addRandomSuffix so Vercel CDN and browser cache are completely fresh
    const blob = await put(targetBlobPath, processedBuffer, {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: true,
      token,
    });

    // If replaceOriginal is true, clean up old blob and update database references
    if (replaceOriginal && originalUrl) {
      // 1. Update Neon DB references so linked dishes/categories/config point to the new blob URL
      try {
        if (sql) {
          await sql`UPDATE products SET image_url = ${blob.url} WHERE image_url = ${originalUrl}`;
          await sql`UPDATE categories SET img = ${blob.url} WHERE img = ${originalUrl}`;
          await sql`UPDATE config SET value = ${blob.url} WHERE value = ${originalUrl}`;
        }
      } catch (dbErr) {
        console.warn('Database reference update note:', dbErr?.message || dbErr);
      }

      // 2. Delete the old blob from storage if it is an external URL different from new blob
      try {
        if (
          (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) &&
          originalUrl !== blob.url
        ) {
          await del(originalUrl, { token });
        }
      } catch (delErr) {
        console.warn('Failed to delete original blob during replace:', delErr?.message || delErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: replaceOriginal 
        ? 'Original image replaced with cropped & compressed version!' 
        : 'Cropped & compressed image created successfully!',
      asset: {
        url: blob.url,
        pathname: blob.pathname,
        name: replaceOriginal ? (originalName || cleanFileName) : cleanFileName,
        folder,
        size: processedBuffer.length,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Crop error in POST route:', error);
    return NextResponse.json({ success: false, message: error.message || 'Crop save failed' }, { status: 500 });
  }
}
