const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name === 'node_modules' || item.name === 'dist' || item.name === '.git') continue;
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results = results.concat(searchFiles(fullPath));
      } else if (/\.(tsx|jsx|js|html)$/i.test(item.name)) {
        if (/quiz/i.test(item.name) || /quiz/i.test(fullPath)) {
          results.push(fullPath);
        }
      }
    }
  } catch (e) {}
  return results;
}

const topicsDir = path.join(__dirname, '..', 'frontend', 'DSA topics');
const topics = fs.readdirSync(topicsDir);

console.log('Auditing Quizzes across DSA topics:');
for (const topic of topics) {
  const tDir = path.join(topicsDir, topic);
  if (!fs.statSync(tDir).isDirectory()) continue;
  const files = searchFiles(tDir);
  console.log(`\nTopic: ${topic} (${files.length} quiz files found)`);
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    // Check timer references
    const timerMatches = content.match(/(?:time|timer|seconds|countdown|limit|interval)[^;\n]{0,60}/gi) || [];
    const relevant = timerMatches.filter(m => /\b(20|30|15|60|10|timer|setTime|timeLeft)\b/i.test(m)).slice(0, 5);
    console.log(`  File: ${path.relative(tDir, f)}`);
    if (relevant.length > 0) {
      console.log(`    Timer snippets:`);
      relevant.forEach(r => console.log(`      ${r.trim()}`));
    }
  }
}
