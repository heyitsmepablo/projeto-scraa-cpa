const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'src', 'app');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile()) {
      const name = entry.name;
      if (
        name.includes('.component.') ||
        name.includes('.service.') ||
        name === 'domain-enums.ts' ||
        (name === 'index.ts' && fullPath.includes('core'))
      ) {
        console.log('Removing old file:', fullPath);
        fs.unlinkSync(fullPath);
      }
    }
  }
}

walk(appDir);
console.log('Old files cleanup complete.');
