const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

const allFiles = walk('client/web/src/app').map(f => f.replace(/\\/g, '/'));
console.log('TOTAL FILES:', allFiles.length);
allFiles.forEach(f => console.log(f));
