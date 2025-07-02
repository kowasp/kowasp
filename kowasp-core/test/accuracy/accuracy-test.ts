import * as fs from 'fs';
import * as path from 'path';
import { XSSAnalyzer } from '../../src/analyzer/XSSAnalyzer';
import { AnalysisResult } from '../../src/types/analyzer';

interface TestResult {
    payload: string;
    context: string;
    detected: boolean;
    vulnerabilities: any[];
    lineNumber: number;
}

// Read XSS payload list
const payloadList = fs.readFileSync(path.join(__dirname, './xss-payload-list'), 'utf-8')
    .split('\n')
    .slice(7) // Skip first 7 lines (header comments)
    .filter(line => line.trim() !== '' && !line.startsWith('<!--')) // Remove empty lines and comments
    .map(line => line.trim());

console.log(`Loaded ${payloadList.length} XSS payloads for testing\n`);

// Create different test contexts for each payload
const createTestContexts = (payload: string): { context: string; code: string }[] => {
    return [
        {
            context: 'Direct HTML Injection',
            code: `<!DOCTYPE html><html><body><div>${payload}</div></body></html>`
        },
        {
            context: 'HTML Attribute Injection',
            code: `<!DOCTYPE html><html><body><div title="${payload}">Test</div></body></html>`
        },
        {
            context: 'JavaScript String Injection',
            code: `const userInput = "${payload}";\neval(userInput);`
        },
        {
            context: 'DOM innerHTML Injection',
            code: `const userInput = "${payload}";\ndocument.getElementById('test').innerHTML = userInput;`
        },
        {
            context: 'Event Handler Injection',
            code: `const userInput = "${payload}";\ndocument.getElementById('test').onclick = userInput;`
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

    console.log('Starting XSS Payload Accuracy Test\n');
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
                const analyzer = new XSSAnalyzer(filePath);
                const result: AnalysisResult = await analyzer.analyze();
                
                const detected = result.vulnerabilities.length > 0;
                totalDetected += detected ? 1 : 0;
                totalTests++;
                
                results.push({
                    payload,
                    context,
                    detected,
                    vulnerabilities: result.vulnerabilities,
                    lineNumber: i + 1
                });
                
                // Clean up temp file
                fs.unlinkSync(filePath);
                
                console.log(`  ${context}: ${detected ? '✅ DETECTED' : '❌ MISSED'} (${result.vulnerabilities.length} vulnerabilities)`);
                
            } catch (error) {
                console.log(`  ${context}: ❌ ERROR - ${error.message}`);
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
    console.log('ACCURACY TEST RESULTS');
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
            console.log(`   Vulnerabilities: ${result.vulnerabilities.map(v => v.type).join(', ')}`);
        });
    }
    
    // Save detailed results to file
    const reportPath = path.join(__dirname, 'accuracy-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        summary: {
            totalPayloads: payloadList.length,
            totalTests,
            detected: totalDetected,
            missed: totalTests - totalDetected,
            detectionRate: (totalDetected / totalTests) * 100
        },
        results
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
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