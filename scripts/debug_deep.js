const fs = require('fs');
const path = require('path');

const filePath = 'src/components/Footer.tsx';
const fullPath = path.resolve(process.cwd(), filePath);
const content = fs.readFileSync(fullPath, 'utf8');

console.log('File length:', content.length);
const idx = content.indexOf('bg-cacao-100');
console.log('Index of bg-cacao-100:', idx);

if (idx !== -1) {
    console.log('Context:', content.substring(idx - 10, idx + 20));
}

const regex = /\b(bg|text|border|ring|divide|outline|accent|shadow|decoration|fill|stroke|from|to|via)-cacao/g;
console.log('Regex:', regex);

const match = regex.exec(content);
console.log('Exec match:', match);

const replaced = content.replace(regex, '$1-brand');
if (replaced !== content) {
    console.log('Replace works!');
} else {
    console.log('Replace failed.');
}
