const fs = require('fs');
const path = require('path');

const filePath = 'src/components/Footer.tsx';
const prefixes = [
    'bg', 'text', 'border', 'ring', 'divide', 'outline',
    'accent', 'shadow', 'decoration', 'fill', 'stroke',
    'from', 'to', 'via'
];

const regexKey = new RegExp(`\\b(${prefixes.join('|')})-cacao`, 'g');
const fullPath = path.resolve(process.cwd(), filePath);
const content = fs.readFileSync(fullPath, 'utf8');

console.log('Regex:', regexKey);
console.log('Testing match on content snippet:', content.substring(0, 500)); // First 500 chars should have bg-cacao-100

const matches = content.match(regexKey);
console.log('Matches found:', matches);

const updated = content.replace(regexKey, '$1-brand');
console.log('Updated content snippet:', updated.substring(0, 500));

if (content !== updated) {
    console.log('Success: Content would change.');
} else {
    console.log('Fail: Content matches original.');
}
