import * as fs from 'fs';
import * as path from 'path';
import { ASTAnalyzer } from '../../src/analyzer/ASTAnalyzer';
import { XSSVulnerability } from '../../src/types/analyzer';

interface TestResult {
    payload: string;
    context: string;
    detected: boolean;
    vulnerabilities: XSSVulnerability[];
    lineNumber: number;
}

// Read XSS payload list
const payloadList = fs.readFileSync(path.join(__dirname, './xss-payload-list'), 'utf-8')
    .split('\n')
    .slice(7) // Skip first 7 lines (header comments)
    .filter(line => line.trim() !== '' && !line.startsWith('<!--')) // Remove empty lines and comments
    .map(line => line.trim())
    .map(payload => {
        // URL decode the payload to handle encoded characters
        try {
            return decodeURIComponent(payload);
        } catch (e) {
            // If URL decoding fails, return original payload
            return payload;
        }
    })
    .filter(payload => {
        // Filter out payloads that would create invalid JavaScript
        const testCode = `const userInput = "${payload}";`;
        try {
            // Try to parse as JavaScript to see if it's valid
            require('@babel/parser').parse(testCode, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript']
            });
            return true;
        } catch (e) {
            // Skip payloads that would cause parser errors
            return false;
        }
    });

console.log(`Loaded ${payloadList.length} XSS payloads for testing (filtered for valid syntax)\n`);

// Create different test contexts for each payload
const createTestContexts = (payload: string): { context: string; code: string }[] => {
    return [
        {
            context: 'JavaScript String Injection',
            code: `const userInput = "${payload}";\neval(userInput);`
        },
        {
            context: 'DOM innerHTML Injection',
            code: `const userInput = "${payload}";\ndocument.getElementById('test').innerHTML = userInput;`
        },
        {
            context: 'setTimeout Injection',
            code: `const userInput = "${payload}";\nsetTimeout(userInput, 1000);`
        },
        {
            context: 'Database Storage',
            code: `const userInput = "${payload}";\ndb.collection('users').insert({ comment: userInput });`
        },
        {
            context: 'Template Literal Injection',
            code: `const userInput = "${payload}";\nconst message = \`Hello \${userInput}\`;\nelement.innerHTML = message;`
        },
        {
            context: 'HTML Attribute Injection',
            code: `const userInput = "${payload}";\ndocument.getElementById('test').setAttribute('title', userInput);`
        },
        {
            context: 'Event Handler Injection',
            code: `const userInput = "${payload}";\ndocument.getElementById('test').onclick = userInput;`
        },
        {
            context: 'Response Write Injection',
            code: `const userInput = "${payload}";\nres.send(userInput);`
        }
    ];
};

// Create temporary test file
const createTempFile = (code: string, index: number): string => {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const filePath = path.join(tempDir, `test-${index}.js`);
    fs.writeFileSync(filePath, code, 'utf-8');
    return filePath;
};

// Clean up temporary files
const cleanupTempFiles = (): void => {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};

// Main test execution
async function runAccuracyTest(): Promise<void> {
    const results: TestResult[] = [];
    let totalTests = 0;
    let totalDetected = 0;

    console.log('Starting XSS Payload Accuracy Test (AST Analysis Only)\n');
    console.log('='.repeat(80));

    for (let i = 0; i < payloadList.length; i++) {
        const payload = payloadList[i];
        const contexts = createTestContexts(payload);
        
        console.log(`\nTesting Payload #${i + 1}/${payloadList.length}:`);
        console.log(`Payload: ${payload.substring(0, 100)}${payload.length > 100 ? '...' : ''}`);
        
        for (let j = 0; j < contexts.length; j++) {
            const { context, code } = contexts[j];
            const filePath = createTempFile(code, totalTests);
            
            try {
                // Use ASTAnalyzer directly (no LLM enhancement)
                const analyzer = new ASTAnalyzer(filePath);
                const vulnerabilities: XSSVulnerability[] = analyzer.analyze(code);
                
                const detected = vulnerabilities.length > 0;
                totalDetected += detected ? 1 : 0;
                totalTests++;
                
                results.push({
                    payload,
                    context,
                    detected,
                    vulnerabilities,
                    lineNumber: i + 1
                });
                
                // Clean up temp file
                fs.unlinkSync(filePath);
                
                console.log(`  ${context}: ${detected ? '✅ DETECTED' : '❌ MISSED'} (${vulnerabilities.length} vulnerabilities)`);
                
                // Show vulnerability details for detected cases
                if (detected) {
                    vulnerabilities.forEach((vuln, idx) => {
                        console.log(`    - ${vuln.type} XSS (${vuln.severity}): ${vuln.description}`);
                    });
                }
                
            } catch (error) {
                console.log(`  ${context}: ❌ ERROR - ${error instanceof Error ? error.message : String(error)}`);
                totalTests++;
                results.push({
                    payload,
                    context,
                    detected: false,
                    vulnerabilities: [],
                    lineNumber: i + 1
                });
                
                // Clean up temp file
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }
    }

    // Generate detailed report
    console.log('\n' + '='.repeat(80));
    console.log('ACCURACY TEST RESULTS (AST Analysis Only)');
    console.log('='.repeat(80));
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total Payloads Tested: ${payloadList.length}`);
    console.log(`Total Test Cases: ${totalTests}`);
    console.log(`Detected Cases: ${totalDetected}`);
    console.log(`Missed Cases: ${totalTests - totalDetected}`);
    console.log(`Detection Rate: ${((totalDetected / totalTests) * 100).toFixed(2)}%`);
    
    // Context-specific accuracy
    const contexts = createTestContexts('test');
    console.log(`\n📈 CONTEXT-SPECIFIC ACCURACY:`);
    contexts.forEach(({ context }, index) => {
        const contextResults = results.filter(r => r.context === context);
        const detected = contextResults.filter(r => r.detected).length;
        const total = contextResults.length;
        const rate = total > 0 ? ((detected / total) * 100).toFixed(2) : '0.00';
        console.log(`${context}: ${detected}/${total} (${rate}%)`);
    });
    
    // Vulnerability type breakdown
    const allVulnerabilities = results.flatMap(r => r.vulnerabilities);
    const typeBreakdown = allVulnerabilities.reduce((acc, vuln) => {
        acc[vuln.type] = (acc[vuln.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    console.log(`\n🔍 VULNERABILITY TYPE BREAKDOWN:`);
    Object.entries(typeBreakdown).forEach(([type, count]) => {
        console.log(`${type}: ${count}`);
    });
    
    // Show missed payloads
    const missedPayloads = results.filter(r => !r.detected);
    if (missedPayloads.length > 0) {
        console.log(`\n❌ MISSED PAYLOADS (first 10):`);
        missedPayloads.slice(0, 10).forEach((result, index) => {
            console.log(`${index + 1}. Line ${result.lineNumber}: ${result.payload.substring(0, 80)}...`);
            console.log(`   Context: ${result.context}`);
        });
        if (missedPayloads.length > 10) {
            console.log(`   ... and ${missedPayloads.length - 10} more`);
        }
    }
    
    // Show detected payloads with vulnerability details
    const detectedPayloads = results.filter(r => r.detected);
    if (detectedPayloads.length > 0) {
        console.log(`\n✅ DETECTED PAYLOADS (first 5):`);
        detectedPayloads.slice(0, 5).forEach((result, index) => {
            console.log(`${index + 1}. Line ${result.lineNumber}: ${result.payload.substring(0, 80)}...`);
            console.log(`   Context: ${result.context}`);
            console.log(`   Vulnerabilities: ${result.vulnerabilities.map(v => `${v.type}(${v.severity})`).join(', ')}`);
        });
    }
    
    // Save detailed results to file
    const reportPath = path.join(__dirname, 'accuracy-report-ast-only.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        summary: {
            totalPayloads: payloadList.length,
            totalTests,
            detected: totalDetected,
            missed: totalTests - totalDetected,
            detectionRate: (totalDetected / totalTests) * 100,
            vulnerabilityTypes: typeBreakdown
        },
        results
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log(`\n💡 Note: This test uses AST analysis only. For LLM-enhanced results, use XSSAnalyzer.`);
    
    // Cleanup
    cleanupTempFiles();
}

// Run the test
if (require.main === module) {
    runAccuracyTest().catch(error => {
        console.error('Test failed:', error);
        cleanupTempFiles();
        process.exit(1);
    });
}

export { runAccuracyTest }; 