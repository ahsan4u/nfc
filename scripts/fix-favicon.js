const fs = require('fs');
const path = require('path');

const src = path.resolve(process.cwd(), 'public/icons/og-logo2.png');
const appFavicon = path.resolve(process.cwd(), 'app/favicon.ico');
const publicFavicon = path.resolve(process.cwd(), 'public/favicon.ico');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, appFavicon);
  fs.copyFileSync(src, publicFavicon);
  console.log("Replaced favicon.ico with brand og-logo2.png");
} else {
  console.log("Source icon not found");
}
