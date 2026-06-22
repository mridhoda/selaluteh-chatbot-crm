// Fix sidebar text overflow
import { readFileSync, writeFileSync } from 'fs'

const filePath = './src/styles.css'
let content = readFileSync(filePath, 'utf8')

// Find and replace the sidebar:hover .label section
const oldCSS = `.sidebar:hover .label {
    opacity: 1;
    max-width: 100%;
    /* Allow it to expand fully within its flex container */
    flex-grow: 1;
    /* Takes up remaining space */
}`

const newCSS = `.sidebar:hover .label {
    opacity: 1;
    max-width: 160px;
    white-space: normal;
    word-break: break-word;
    /* Allow it to expand fully within its flex container */
    flex-grow: 1;
    /* Takes up remaining space */
}`

content = content.replace(oldCSS, newCSS)
writeFileSync(filePath, content, 'utf8')

console.log('✅ Fixed sidebar text overflow!')
console.log('✅ Text will now wrap properly in sidebar')
