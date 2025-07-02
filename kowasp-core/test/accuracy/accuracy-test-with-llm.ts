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
    hasLLMEnhancement: boolean;
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

console.log(`Loaded ${payloadList.length} XSS payloads for testing with batch LLM enhancement (filtered for valid syntax)\n`);

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
        }
    ];
};

// Create temporary test file
const createTempFile = (code: string, index: number): string => {
    const tempDir = path.join(__dirname, 'temp-llm');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const filePath = path.join(tempDir, `test-${index}.js`);
    fs.writeFileSync(filePath, code, 'utf-8');
    return filePath;
};

// Clean up temporary files
const cleanupTempFiles = (): void => {
    const tempDir = path.join(__dirname, 'temp-llm');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};

// LLM enhancement function (simplified version of XSSAnalyzer's enhanceVulnerabilities)
async function enhanceVulnerabilitiesBatch(vulnerabilities: XSSVulnerability[]): Promise<XSSVulnerability[]> {
    if (vulnerabilities.length === 0) return [];
    
    console.log(`\n🤖 SENDING ${vulnerabilities.length} VULNERABILITIES TO LLM AS A SINGLE BATCH`);
    console.log('='.repeat(60));
    
    try {
        const prompt = createBatchAnalysisPrompt(vulnerabilities);
        const analyses = await queryOllama(prompt);
        
        // Better error handling for LLM response
        if (!analyses || !Array.isArray(analyses)) {
            console.warn(`⚠️ LLM returned invalid response format: ${typeof analyses}`);
            console.warn(`⚠️ Returning original vulnerabilities without enhancement`);
            return vulnerabilities;
        }
        
        console.log(`✅ RECEIVED LLM BATCH RESPONSE FOR ${analyses.length} VULNERABILITIES`);
        
        return vulnerabilities.map((vuln, i) => {
            const analysis = analyses[i] || {};
            return {
                ...vuln,
                description: analysis.description || vuln.description,
                remediation: analysis.remediation || vuln.remediation,
                confidence: analysis.confidence || vuln.confidence
            };
        });
    } catch (error) {
        console.error('❌ Error enhancing vulnerabilities with LLM batch:', error);
        return vulnerabilities;
    }
}

function createBatchAnalysisPrompt(vulnerabilities: XSSVulnerability[]): string {
    // Limit the batch size to avoid overwhelming the LLM
    const maxBatchSize = 20;
    const limitedVulns = vulnerabilities.slice(0, maxBatchSize);
    
    const items = limitedVulns.map((vuln, i) => 
        `#${i+1}\nType: ${vuln.type}\nSeverity: ${vuln.severity}\nCode: ${vuln.code.substring(0, 100)}...\n`
    ).join('\n');
    
    return `Analyze these XSS vulnerabilities and provide enhanced descriptions and remediation advice.

For each vulnerability, return a JSON array with objects containing: description, remediation, confidence (0-1).

Vulnerabilities:
${items}

Return only valid JSON array.`;
}

async function queryOllama(prompt: string): Promise<any> {
    const ollamaEndpoint = 'http://localhost:11434/api/generate';
    const ollamaModel = 'mistral';
    
    try {
        const response = await fetch(ollamaEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: ollamaModel,
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        if (typeof data === 'object' && data !== null && 'response' in data && typeof (data as any).response === 'string') {
            try {
                const sanitized = (data as any).response.replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, '');
                const parsed = JSON.parse(sanitized);
                
                // Validate that we got an array
                if (Array.isArray(parsed)) {
                    return parsed;
                } else {
                    console.warn('LLM returned non-array response, wrapping in array');
                    return [parsed];
                }
            } catch (e) {
                console.warn('Failed to parse LLM response as JSON:', (data as any).response.substring(0, 200));
                return [];
            }
        } else if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                console.warn('Failed to parse string response as JSON:', data.substring(0, 200));
                return [];
            }
        } else {
            throw new Error('Unexpected response format from Ollama');
        }
    } catch (error) {
        console.error('Error querying Ollama:', error);
        return [];
    }
}

// Main test execution
async function runAccuracyTestWithBatchLLM(): Promise<void> {
    const results: TestResult[] = [];
    let totalTests = 0;
    let totalDetected = 0;
    let allVulnerabilities: XSSVulnerability[] = [];

    console.log('Starting XSS Payload Accuracy Test (with BATCH LLM Enhancement)\n');
    console.log('='.repeat(80));

    // Test with a smaller subset for LLM testing
    const testPayloads = payloadList.slice(0, 10); // Test first 10 payloads

    console.log('🔍 PHASE 1: STATIC ANALYSIS');
    console.log('='.repeat(40));

    for (let i = 0; i < testPayloads.length; i++) {
        const payload = testPayloads[i];
        const contexts = createTestContexts(payload);
        
        console.log(`\nTesting Payload #${i + 1}/${testPayloads.length}:`);
        console.log(`Payload: ${payload.substring(0, 100)}${payload.length > 100 ? '...' : ''}`);
        
        for (let j = 0; j < contexts.length; j++) {
            const { context, code } = contexts[j];
            const filePath = createTempFile(code, totalTests);
            
            try {
                // Use ASTAnalyzer directly for static analysis
                const analyzer = new ASTAnalyzer(filePath);
                const vulnerabilities: XSSVulnerability[] = analyzer.analyze(code);
                
                const detected = vulnerabilities.length > 0;
                totalDetected += detected ? 1 : 0;
                totalTests++;
                
                // Collect all vulnerabilities for batch processing
                if (detected) {
                    allVulnerabilities.push(...vulnerabilities);
                }
                
                results.push({
                    payload,
                    context,
                    detected,
                    vulnerabilities,
                    lineNumber: i + 1,
                    hasLLMEnhancement: false // Will be updated after batch processing
                });
                
                // Clean up temp file
                fs.unlinkSync(filePath);
                
                console.log(`  ${context}: ${detected ? '✅ DETECTED' : '❌ MISSED'} (${vulnerabilities.length} vulnerabilities)`);
                
            } catch (error) {
                console.log(`  ${context}: ❌ ERROR - ${error instanceof Error ? error.message : String(error)}`);
                totalTests++;
                results.push({
                    payload,
                    context,
                    detected: false,
                    vulnerabilities: [],
                    lineNumber: i + 1,
                    hasLLMEnhancement: false
                });
                
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }
    }

    console.log(`\n📊 STATIC ANALYSIS COMPLETE:`);
    console.log(`Total vulnerabilities found: ${allVulnerabilities.length}`);

    // PHASE 2: BATCH LLM ENHANCEMENT
    console.log('\n🤖 PHASE 2: BATCH LLM ENHANCEMENT');
    console.log('='.repeat(40));

    const enhancedVulnerabilities = await enhanceVulnerabilitiesBatch(allVulnerabilities);

    // Update results with enhanced vulnerabilities
    let enhancedIndex = 0;
    for (let i = 0; i < results.length; i++) {
        if (results[i].detected) {
            const originalCount = results[i].vulnerabilities.length;
            results[i].vulnerabilities = enhancedVulnerabilities.slice(enhancedIndex, enhancedIndex + originalCount);
            results[i].hasLLMEnhancement = true;
            enhancedIndex += originalCount;
        }
    }

    // Generate detailed report
    console.log('\n' + '='.repeat(80));
    console.log('ACCURACY TEST RESULTS (with BATCH LLM Enhancement)');
    console.log('='.repeat(80));
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total Payloads Tested: ${testPayloads.length}`);
    console.log(`Total Test Cases: ${totalTests}`);
    console.log(`Detected Cases: ${totalDetected}`);
    console.log(`Missed Cases: ${totalTests - totalDetected}`);
    console.log(`Detection Rate: ${((totalDetected / totalTests) * 100).toFixed(2)}%`);
    console.log(`LLM Enhanced Cases: ${enhancedVulnerabilities.length}`);
    
    // Show enhanced examples
    const enhancedResults = results.filter(r => r.hasLLMEnhancement);
    if (enhancedResults.length > 0) {
        console.log(`\n🤖 LLM ENHANCED EXAMPLES:`);
        enhancedResults.slice(0, 3).forEach((result, index) => {
            console.log(`${index + 1}. Payload: ${result.payload.substring(0, 60)}...`);
            console.log(`   Context: ${result.context}`);
            result.vulnerabilities.forEach(vuln => {
                console.log(`   - Enhanced Description: ${vuln.description}`);
                console.log(`   - Remediation: ${vuln.remediation}`);
                console.log(`   - Confidence: ${(vuln.confidence * 100).toFixed(1)}%`);
            });
        });
    }
    
    // Save detailed results to file
    const reportPath = path.join(__dirname, 'accuracy-report-batch-llm.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        summary: {
            totalPayloads: testPayloads.length,
            totalTests,
            detected: totalDetected,
            missed: totalTests - totalDetected,
            llmEnhanced: enhancedVulnerabilities.length,
            detectionRate: (totalDetected / totalTests) * 100
        },
        results
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log(`\n💡 Note: This test uses BATCH LLM processing - all vulnerabilities sent in one request!`);
    
    // Cleanup
    cleanupTempFiles();
}

// Run the test
if (require.main === module) {
    runAccuracyTestWithBatchLLM().catch(error => {
        console.error('Test failed:', error);
        cleanupTempFiles();
        process.exit(1);
    });
}

export { runAccuracyTestWithBatchLLM }; 