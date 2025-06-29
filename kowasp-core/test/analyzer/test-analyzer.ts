import { ExpressConfigAnalyzer } from '../../src/analyzer/ExpressConfigAnalyzer';
import * as fs from 'fs';

async function testExpressConfigAnalyzerWithLLM() {
    const code = fs.readFileSync(require.resolve('../../examples/secure-app/app.js'), 'utf-8');
    const analyzer = new ExpressConfigAnalyzer('examples/secure-app/app.js');
    const result = await analyzer.analyzeWithLLM(code);
    console.log('ExpressConfigAnalyzer LLM-enhanced result:', JSON.stringify(result, null, 2));
}

// Run the test if this file is executed directly
if (require.main === module) {
    testExpressConfigAnalyzerWithLLM();
} 