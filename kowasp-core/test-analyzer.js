const { ASTAnalyzer } = require('./dist/analyzer/ASTAnalyzer');

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

console.log('Testing DOM-3 vulnerable sample:');
const analyzer1 = new ASTAnalyzer('dom-3.ts');
const result1 = analyzer1.analyze(vulnerable_dom3);
console.log('Vulnerabilities found:', result1.length);
result1.forEach(v => console.log('- Type:', v.type, 'Description:', v.description));

console.log('\nTesting Framework-1 vulnerable sample:');
const analyzer2 = new ASTAnalyzer('framework-1.ts');
const result2 = analyzer2.analyze(vulnerable_framework1);
console.log('Vulnerabilities found:', result2.length);
result2.forEach(v => console.log('- Type:', v.type, 'Description:', v.description));

console.log('\nTesting Stored-1 vulnerable sample:');
const analyzer3 = new ASTAnalyzer('stored-1.ts');
const result3 = analyzer3.analyze(vulnerable_stored1);
console.log('Vulnerabilities found:', result3.length);
result3.forEach(v => console.log('- Type:', v.type, 'Description:', v.description)); 