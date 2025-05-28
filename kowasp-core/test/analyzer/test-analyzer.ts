import { readFileSync } from 'fs';
import { XSSAnalyzer } from '../src/XSSAnalyzer';

// Test HTML content with potential XSS vulnerabilities
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <div id="user-input">
        <script>eval('alert(1)')</script>
        <img src="x" onerror="alert('XSS')">
        <a href="javascript:alert('XSS')">Click me</a>
    </div>
</body>
</html>
`;

// Test JavaScript content with potential XSS vulnerabilities
const jsContent = `
function processUserInput(input) {
    document.write(input);
    eval(input);
    location.href = input;
    document.cookie = input;
}
`;

// Create analyzer instance
const analyzer = new XSSAnalyzer();

// Analyze HTML content
console.log('\nAnalyzing HTML content:');
console.log('='.repeat(80));
const htmlFindings = analyzer.analyze(htmlContent);
analyzer.displayResults(htmlFindings);

// Analyze JavaScript content
console.log('\nAnalyzing JavaScript content:');
console.log('='.repeat(80));
const jsFindings = analyzer.analyze(jsContent);
analyzer.displayResults(jsFindings); 