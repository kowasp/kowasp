import * as fs from 'fs';
import * as path from 'path';
import { XSSAnalyzer } from '../src/XSSAnalyzer';

// Read XSS payload list
const payloadList = fs.readFileSync(path.join(__dirname, './xss-payload-list'), 'utf-8')
    .split('\n')
    .slice(7) // Skip first 7 lines
    .filter(line => line.trim() !== ''); // Remove empty lines

// Create test cases
const testCases = payloadList.map((payload, index) => {
    // Create different contexts for each payload
    return [
        // Basic injection
        `<!DOCTYPE html><html><body><div>${payload}</div></body></html>`,
        // In attribute
        `<!DOCTYPE html><html><body><div title="${payload}">Test</div></body></html>`,
        // In script tag
        `<!DOCTYPE html><html><body><script>const x = "${payload}";</script></body></html>`,
        // In event handler
        `<!DOCTYPE html><html><body><div onclick="alert('${payload}')">Click me</div></body></html>`,
        // In href
        `<!DOCTYPE html><html><body><a href="${payload}">Link</a></body></html>`
    ];
}).flat();

// Run tests
const analyzer = new XSSAnalyzer();
let totalFindings = 0;

console.log('Starting XSS Payload Tests\n');
console.log('='.repeat(80));

testCases.forEach((testCase, index) => {
    console.log(`\nTest Case #${index + 1}:`);
    console.log('-'.repeat(40));
    console.log('Input:');
    console.log(testCase);
    
    const findings = analyzer.analyze(testCase);
    totalFindings += findings.length;
    
    console.log('\nFindings:');
    if (findings.length === 0) {
        console.log('No vulnerabilities detected!');
    } else {
        findings.forEach((finding, i) => {
            console.log(`\nFinding #${i + 1}:`);
            console.log(`Pattern: ${finding.pattern_name}`);
            console.log(`Description: ${finding.description}`);
            console.log(`Severity: ${finding.severity}`);
            console.log(`Matched Text: ${finding.matched_text}`);
        });
    }
    console.log('-'.repeat(40));
});

console.log('\nTest Summary:');
console.log('='.repeat(80));
console.log(`Total test cases: ${testCases.length}`);
console.log(`Total findings: ${totalFindings}`);
console.log(`Average findings per test: ${(totalFindings / testCases.length).toFixed(2)}`); 