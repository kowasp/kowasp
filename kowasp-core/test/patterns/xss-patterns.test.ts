import { ASTAnalyzer } from '../../src/analyzer/ASTAnalyzer';
import { xssPatterns } from '../../src/patterns/xss-patterns';
import * as fs from 'fs';
import * as path from 'path';

describe('XSS Pattern Tests', () => {
    const samplesDir = path.join(__dirname, '../samples');
    const sampleFiles = fs.readdirSync(samplesDir).filter(file => file.endsWith('.ts'));

    for (const sampleFile of sampleFiles) {
        const patternId = path.basename(sampleFile, '.ts');
        const pattern = xssPatterns.find(p => p.id === patternId);
        
        if (pattern) {
            const { vulnerable, secure } = require(path.join(samplesDir, sampleFile));

            describe(`Pattern: ${pattern.name} (${pattern.id})`, () => {
                it('should detect the vulnerability in the vulnerable sample', () => {
                    const analyzer = new ASTAnalyzer(sampleFile);
                    const vulnerabilities = analyzer.analyze(vulnerable);
                    const found = vulnerabilities.some(v => v.description === pattern.description);
                    expect(vulnerabilities.length).toBeGreaterThan(0);
                    expect(found).toBe(true);
                });

                it('should not detect a vulnerability in the secure sample', () => {
                    const analyzer = new ASTAnalyzer(sampleFile);
                    const vulnerabilities = analyzer.analyze(secure);
                    const found = vulnerabilities.some(v => v.description === pattern.description);
                    expect(found).toBe(false);
                });
            });
        }
    }
}); 