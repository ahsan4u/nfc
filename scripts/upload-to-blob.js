const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

// Manually load .env variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1].trim();
      let val = (match[2] || '').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("Error: BLOB_READ_WRITE_TOKEN is missing in .env");
  process.exit(1);
}

const publicDir = path.resolve(process.cwd(), 'public');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'fonts') { // Skip fonts or include if needed
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg'].includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

async function uploadAll() {
  console.log("Scanning public folder for image assets...");
  const files = getAllFiles(publicDir);
  console.log(`Found ${files.length} images to upload.`);

  const urlMap = {};

  for (const filePath of files) {
    const relativePath = path.relative(publicDir, filePath).replace(/\\/g, '/');
    const blobPath = `nfc/${relativePath}`;
    const fileBuffer = fs.readFileSync(filePath);

    console.log(`Uploading: ${relativePath} -> ${blobPath}...`);
    try {
      const blob = await put(blobPath, fileBuffer, {
        access: 'public',
        addRandomSuffix: false,
        token: token,
      });
      console.log(`  Uploaded successfully: ${blob.url}`);
      // Map standard root-relative path (e.g. /icons/logo2.png) to Blob URL
      urlMap[`/${relativePath}`] = blob.url;
    } catch (err) {
      console.error(`  Failed to upload ${relativePath}:`, err.message);
    }
  }

  const outputPath = path.resolve(process.cwd(), 'lib', 'blob-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(urlMap, null, 2), 'utf8');
  console.log(`\nMapping written to ${outputPath}`);
  console.log("Upload complete!");
}

uploadAll();
