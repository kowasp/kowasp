const vulnerable_dom3 = `
const unsafeData = document.location.hash;
document.body.innerHTML = unsafeData;
`;

const vulnerable_framework1 = `
function UnsafeComponent({ content }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}
`;

const vulnerable_stored1 = `
const comment = getUserInput();
db.collection('comments').insert({ text: \`\${comment}\` });
`;

const secure_reflected1 = `
const xss = require('xss');
app.get('/', (req, res) => {
  const sanitizedName = xss(req.query.name);
  res.send(\`<h1>Welcome \${sanitizedName}</h1>\`);
});
`;

const vulnerable_reflected1 = `
app.get('/', (req, res) => {
  res.send(\`<h1>Welcome \${req.query.name}</h1>\`);
});
`;

// Test patterns
const dom3_pattern = /(?:document\.)?location\.(?:hash|search|href|pathname).*?(?:document\.write|\.innerHTML|\.outerHTML)/;
const framework1_pattern = /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/;
const stored1_pattern = /(?:db|database|collection)\.(?:insert|update|save)\s*\([^)]*\$\{[^}]*\}[^)]*\)/;
const reflected1_pattern = /res\.(?:send|render|json|write)\s*\([^)]*\$\{[^}]*req\.(?:query|body|params)[^}]*\}[^)]*\)/;

console.log('DOM-3 Pattern Test:', dom3_pattern.test(vulnerable_dom3));
console.log('Framework-1 Pattern Test:', framework1_pattern.test(vulnerable_framework1));
console.log('Stored-1 Pattern Test:', stored1_pattern.test(vulnerable_stored1));
console.log('Reflected-1 Vulnerable Pattern Test:', reflected1_pattern.test(vulnerable_reflected1));
console.log('Reflected-1 Secure Pattern Test:', reflected1_pattern.test(secure_reflected1));

console.log('\nVulnerable DOM-3:', vulnerable_dom3);
console.log('\nVulnerable Framework-1:', vulnerable_framework1);
console.log('\nVulnerable Stored-1:', vulnerable_stored1);
console.log('\nVulnerable Reflected-1:', vulnerable_reflected1);
console.log('\nSecure Reflected-1:', secure_reflected1); 