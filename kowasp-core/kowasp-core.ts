// kowasp-core
// Can be used for educational purposes only

const vulCode = "eval('alert(1)');";
const esprima = require('esprima');

// Syntactic Analysis
// Identify tokens

// Determine its a script or a module
const moduleExample = 'import { sqrt } from "math.js"';
console.log(esprima.parseScript(vulCode));
console.log(esprima.parseModule(moduleExample));

// Lexical Analysis
// Identify the meaning of each token

const tokens = esprima.tokenize(vulCode);
console.log(tokens);

// Build an Abstract Syntax Tree (AST)
// Identify the structure of the code

//const ast = {
    //type: 'eval',
    //value: 'alert(1)'
//};
const ast = esprima.parse(vulCode);

console.log(ast);

// Semantic Analysis
// Identify the meaning of the AST
// Check if the code is vulnerable

const isVulnerable = ast.type === 'eval' && ast.value.includes('alert');
//console.log(isVulnerable);

// Output Dashboard
// -------------
// KOwasp-XSS Report
// -------------
// Code: eval('alert(1)');
// Vulnerable: Yes
// -------------
// Summary: The code is vulnerable to XSS attacks
// -------------
// Recommendations: Use a Content Security Policy (CSP) to prevent XSS attacks
// -------------

// Output the report
const report = `
 -------------
 KOwasp-XSS Report
 -------------
 Code: ${vulCode}
 Vulnerable: ${isVulnerable ? 'Yes' : 'No'}
 -------------
 Summary: Eval function is used with alert function which is vulnerable to XSS attacks
 -------------
 Recommendations: Use a Content Security Policy (CSP) to prevent XSS attacks
 -------------
`;

console.log(report);
