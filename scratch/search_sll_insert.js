const fs = require('fs');
const path = require('path');

function searchAll(dir, pat) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (f.name !== 'node_modules' && f.name !== 'dist' && f.name !== '.git') searchAll(full, pat);
    } else if (/\.(tsx|ts|jsx|js)$/.test(f.name)) {
      const content = fs.readFileSync(full, 'utf8');
      if (pat.test(content)) {
        console.log('Match in', full);
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (pat.test(l)) console.log(`  L${i+1}: ${l.trim()}`);
        });
      }
    }
  }
}

searchAll('frontend/DSA topics/Singly Linked List (SLL)', /Insert at Any Position|game_insertion_position|L4_T1/i);
