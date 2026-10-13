const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  try {
    fs.readdirSync(dir).forEach(f => {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        if (f !== 'node_modules' && f !== '.git') res = res.concat(walk(full));
      } else {
        res.push(full);
      }
    });
  } catch (e) {}
  return res;
}

const bstDir = 'c:/Users/somar/Downloads/dsa-main-website (2)/frontend/DSA topics/Binary Search Tree';
const files = walk(bstDir);
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/['"][^'"]+\.(mp3|wav|ogg|svg|png|jpg|jpeg|mp4|json|ico)['"]/g);
  if (matches) {
    console.log(path.basename(f), matches);
  }
});
