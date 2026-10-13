const fs = require('fs');
const path = require('path');

const bfsDir = path.join(__dirname, '..', 'frontend', 'DSA topics', 'Breadth-First Search (BFS)');

console.log('--- 1. Searching for video references in BFS ---');
const files = fs.readdirSync(path.join(bfsDir, 'js'));
files.forEach(f => {
  const content = fs.readFileSync(path.join(bfsDir, 'js', f), 'utf8');
  const matches = content.match(/[^"'`\s]+\.mp4/gi);
  if (matches) {
    console.log(`js/${f}:`, matches);
  }
});

const indexHtml = fs.readFileSync(path.join(bfsDir, 'index.html'), 'utf8');
const htmlMatches = indexHtml.match(/[^"'`\s]+\.mp4/gi);
console.log('index.html video matches:', htmlMatches);

console.log('\n--- 2. Searching for Overview links/navigation in BFS ---');
const overviewMatches = indexHtml.match(/<[^>]*overview[^>]*>/gi);
console.log('index.html overview tags:', overviewMatches);

console.log('\n--- 3. Guided Solve in BFS ---');
const guidedSolveJs = fs.readFileSync(path.join(bfsDir, 'js', 'guided-solve.js'), 'utf8');
console.log('guided-solve.js length:', guidedSolveJs.length);
const gameEngineJs = fs.readFileSync(path.join(bfsDir, 'js', 'game-engine.js'), 'utf8');
console.log('game-engine.js length:', gameEngineJs.length);
