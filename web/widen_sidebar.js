// Widen sidebar to fit long labels
import { readFileSync, writeFileSync } from 'fs';

const filePath = './src/styles.css';
let content = readFileSync(filePath, 'utf8');

// Update all sidebar width references from 230px to 270px
content = content.replace(/margin-left: 230px;/g, 'margin-left: 270px;');

// Update label to not wrap and have more space
content = content.replace('white-space: normal;', 'white-space: nowrap;');
content = content.replace('max-width: 160px;', 'max-width: 200px;');

writeFileSync(filePath, content, 'utf8');

console.log('✅ Sidebar widened to 270px!');
console.log('✅ Text will now fit in one line');
