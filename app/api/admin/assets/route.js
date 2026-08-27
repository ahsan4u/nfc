import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';
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

function inferFolderAndName(pathname) {
  // Normalize path removing nfc/ prefix
  const cleanPath = pathname.replace(/^nfc\//, '');
  const parts = cleanPath.split('/');

  if (parts.length > 1) {
    const dir = parts[0].toLowerCase();
    if (dir === 'images' && parts.length > 2) {
      const sub = parts[1].toLowerCase();
      if (sub === 'categories') return { folder: 'Categories', name: parts.slice(2).join('/') };
      if (sub === 'dishes') return { folder: 'Dishes', name: parts.slice(2).join('/') };
      return { folder: formatFolderName(parts[1]), name: parts.slice(2).join('/') };
    }
    if (dir === 'icons') return { folder: 'Icons', name: parts.slice(1).join('/') };
    if (dir === 'banners') return { folder: 'Banners', name: parts.slice(1).join('/') };
    if (dir === 'general') return { folder: 'General', name: parts.slice(1).join('/') };
    return { folder: formatFolderName(parts[0]), name: parts.slice(1).join('/') };
  }

  const filename = parts[0];
  if (filename.toLowerCase().includes('banner')) return { folder: 'Banners', name: filename };
  if (filename.toLowerCase().includes('founder')) return { folder: 'General', name: filename };
  if (filename.toLowerCase().includes('logo')) return { folder: 'Icons', name: filename };

  return { folder: 'General', name: filename };
}

export async function GET(request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ success: false, message: 'BLOB_READ_WRITE_TOKEN not configured' }, { status: 500 });
    }

    const { blobs } = await list({ token });

    const allAssets = blobs.map((blob) => {
      const { folder, name } = inferFolderAndName(blob.pathname);
      return {
        url: blob.url,
        pathname: blob.pathname,
        name: name || blob.pathname.split('/').pop(),
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        folder: formatFolderName(folder),
        type: 'image',
      };
    });

    // Compute folder counts
    const folderCounts = { All: allAssets.length };
    for (const asset of allAssets) {
      const f = asset.folder || 'General';
      folderCounts[f] = (folderCounts[f] || 0) + 1;
    }

    const { searchParams } = new URL(request.url);
    const selectedFolder = searchParams.get('folder');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';

    let filtered = allAssets;

    if (selectedFolder && selectedFolder.toLowerCase() !== 'all') {
      filtered = filtered.filter((a) => (a.folder || 'General').toLowerCase() === selectedFolder.toLowerCase());
    }

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(q) || a.pathname.toLowerCase().includes(q));
    }

    // Sort
    filtered.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'size_desc') return b.size - a.size;
      if (sort === 'size_asc') return a.size - b.size;
      return new Date(b.uploadedAt) - new Date(a.uploadedAt); // newest
    });

    return NextResponse.json({
      success: true,
      assets: filtered,
      folderCounts,
      total: filtered.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to list assets' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ success: false, message: 'Asset URL is required' }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    await del(url, { token });

    return NextResponse.json({ success: true, message: 'Asset deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete asset' }, { status: 500 });
  }
}
