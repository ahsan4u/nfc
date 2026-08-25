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

    const formData = await request.formData();
    const folder = (formData.get('folder') || 'General').trim();
    const files = formData.getAll('file');

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'No files provided for upload' }, { status: 400 });
    }

    const folderMap = {
      Categories: 'images/categories',
      Dishes: 'images/dishes',
      Icons: 'icons',
      Banners: 'banners',
      General: 'general',
    };

    const targetSubdir = folderMap[folder] || folder.toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
    const uploadedAssets = [];

    for (const file of files) {
      if (typeof file === 'string') continue;
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blobPath = `nfc/${targetSubdir}/${cleanName}`;

      const blob = await put(blobPath, file, {
        access: 'public',
        addRandomSuffix: true,
        token,
      });

      uploadedAssets.push({
        url: blob.url,
        pathname: blob.pathname,
        name: cleanName,
        size: file.size,
        folder,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Uploaded ${uploadedAssets.length} asset(s)`,
      assets: uploadedAssets,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Upload failed' }, { status: 500 });
  }
}
