const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('frontend/public/dsa-modules/bfs/index.html');
let html = fs.readFileSync(targetPath, 'utf8');

// Replace the logo section to remove conflicting inline styles and let the CSS handle it cleanly
const searchRegex = /<div class="topbar-brand-logo-left"[^>]*>[\s\S]*?<\/div>/;
const replacement = `<div class="topbar-brand-logo-left" title="AlgoLearn — Your DSA Journey" style="cursor: pointer; position: relative; height: 36px; width: 156px; display: inline-block;" onclick="if (typeof navigateParent === 'function') navigateParent('home'); else if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'ALGOLEARN_NAVIGATE', tab: 'home' }, '*'); else window.location.href = '/';">
            <img src="logo-light.png" onerror="if (this.src !== '/logo-light.png') this.src='/logo-light.png';" alt="AlgoLearn - YOUR DSA JOURNEY" class="brand-logo-img logo-light-img" draggable="false" />
            <img src="logo-dark.png" onerror="if (this.src !== '/logo-dark.png') this.src='/logo-dark.png';" alt="AlgoLearn - YOUR DSA JOURNEY" class="brand-logo-img logo-dark-img" draggable="false" />
          </div>`;

if (!searchRegex.test(html)) {
  console.error('Could not find topbar-brand-logo-left in file');
  process.exit(1);
}

html = html.replace(searchRegex, replacement);
fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully updated frontend/public/dsa-modules/bfs/index.html');
