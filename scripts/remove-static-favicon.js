const fs = require('fs');
const path = require('path');

const appFavicon = path.resolve(process.cwd(), 'app/favicon.ico');
if (fs.existsSync(appFavicon)) {
  fs.unlinkSync(appFavicon);
  console.log("Removed app/favicon.ico to allow dynamic metadata favicon to take precedence.");
} else {
  console.log("app/favicon.ico does not exist.");
}
