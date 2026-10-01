const fs = require('fs');
const file = 'src/routes/api/webhooks/github/+server.ts';
let content = fs.readFileSync(file, 'utf8');

// Remove full line comments
content = content.replace(/^\s*\/\/.*$/gm, '');

// Remove extra blank lines created by the removal
content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

fs.writeFileSync(file, content);

const file2 = 'src/routes/tickets/+page.svelte';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/\/\/ Polling every 30 seconds/g, '');
fs.writeFileSync(file2, content2);
