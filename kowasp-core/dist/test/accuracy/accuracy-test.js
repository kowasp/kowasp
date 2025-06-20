"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const XSSAnalyzer_1 = require("../src/XSSAnalyzer");
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
const analyzer = new XSSAnalyzer_1.XSSAnalyzer();
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
    }
    else {
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
