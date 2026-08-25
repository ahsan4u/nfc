import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { isAdminAuthenticated } from '@/lib/admin-auth';

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
    const { imageBase64, originalName, folder = 'General' } = body;

    if (!imageBase64) {
      return NextResponse.json({ success: false, message: 'Missing imageBase64 data' }, { status: 400 });
    }

    // Convert base64 data url to Buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const baseName = (originalName || 'cropped_image.png').replace(/\.[^/.]+$/, '');
    const cleanFileName = `${baseName}_cropped_${Date.now()}.png`;

    const folderMap = {
      Categories: 'images/categories',
      Dishes: 'images/dishes',
      Icons: 'icons',
      Banners: 'banners',
      General: 'general',
    };

    const targetSubdir = folderMap[folder] || folder.toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
    const blobPath = `nfc/${targetSubdir}/${cleanFileName}`;

    const blob = await put(blobPath, buffer, {
      access: 'public',
      contentType: 'image/png',
      token,
    });

    return NextResponse.json({
      success: true,
      message: 'Cropped image saved successfully',
      asset: {
        url: blob.url,
        pathname: blob.pathname,
        name: cleanFileName,
        folder,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Crop save failed' }, { status: 500 });
  }
}
