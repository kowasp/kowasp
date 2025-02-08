// kowasp-xss
// Can be used for educational purposes only

const vulCode = "eval('alert(1)');";

// Syntactic Analysis
// Identify tokens

const tokens = vulCode.split(/(\(|\)|\s|;)/).filter(token => token !== '');
console.log(tokens);


// Lexical Analysis
// Identify the meaning of each token

const lexemes = tokens.map(token => {
    if (token === 'eval') {
        return 'eval';
    } else if (token === ' ') {
        return 'whitespace';
    } else if (token === '(' || token === ')') {
        return 'parenthesis';
    } else if (token === ';') {
        return 'semicolon';
    } else {
        return 'string';
    }
});

console.log(lexemes);

// Build an Abstract Syntax Tree (AST)
// Identify the structure of the code

const ast = {
    type: 'eval',
    value: 'alert(1)'
};

console.log(ast);

// Semantic Analysis
// Identify the meaning of the AST
// Check if the code is vulnerable

const isVulnerable = ast.type === 'eval' && ast.value.includes('alert');
console.log(isVulnerable);

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
