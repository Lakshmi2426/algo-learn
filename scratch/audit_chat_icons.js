const fs = require('fs');
const path = require('path');

const dsaDir = path.join(__dirname, '..', 'frontend', 'DSA topics');
const topics = fs.readdirSync(dsaDir);

console.log('Auditing Floating Chat / Ask a Teacher Icon across 13 modules:');

for (const topic of topics) {
  const tDir = path.join(dsaDir, topic);
  if (!fs.statSync(tDir).isDirectory()) continue;
  
  let found = [];
  function scan(dir) {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name === 'node_modules' || item.name === 'dist' || item.name === '.git') continue;
      const full = path.join(dir, item.name);
      if (item.isDirectory()) scan(full);
      else if (/\.(tsx|jsx|js|html)$/i.test(item.name)) {
        const c = fs.readFileSync(full, 'utf8');
        if (/ai-bot-floating|floating-chat|ask-a-teacher|ai-assistant-fab|floating-ask-teacher/i.test(c)) {
          found.push(path.relative(tDir, full));
        }
      }
    }
  }
  scan(tDir);
  console.log(`- ${topic}: ${found.length > 0 ? found.join(', ') : 'NONE FOUND'}`);
}
