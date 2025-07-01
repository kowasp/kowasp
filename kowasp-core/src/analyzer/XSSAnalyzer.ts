import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { ASTAnalyzer } from './ASTAnalyzer';
import { ExpressConfigAnalyzer } from './ExpressConfigAnalyzer';
import { AnalysisResult, XSSVulnerability } from '../types/analyzer';
import fetch from 'node-fetch';

export class XSSAnalyzer {
    private ollamaEndpoint = 'http://localhost:11434/api/generate';
    private ollamaModel = 'mistral';

    constructor(private target: string) {}

    public async analyze(): Promise<AnalysisResult> {
        const files = (await this.findExpressFiles()).slice(0, 50); // Limit to first 50 files for testing
        console.log(`[XSSAnalyzer] Total files to analyze: ${files.length}`);
        const vulnerabilities: XSSVulnerability[] = [];
        let expressConfig = {
            helmet: false,
            contentSecurityPolicy: false,
            xssFilter: false,
            noSniff: false,
            frameguard: false,
            hsts: false
        };
        const missingHeaders: string[] = [];
        const recommendations: string[] = [];

        let fileIndex = 0;
        for (const file of files) {
            fileIndex++;
            if (!fs.statSync(file).isFile()) continue;
            const fileSize = fs.statSync(file).size;
            if (fileSize > 1024 * 1024) { // 1MB
                console.log(`[XSSAnalyzer] Skipping large file (${(fileSize/1024/1024).toFixed(2)} MB): ${file}`);
                continue;
            }
            console.log(`[XSSAnalyzer] Analyzing file ${fileIndex}/${files.length}: ${file}`);
            const code = fs.readFileSync(file, 'utf-8');
            
            // Analyze AST for XSS vulnerabilities
            const astAnalyzer = new ASTAnalyzer(file);
            const fileVulnerabilities = astAnalyzer.analyze(code);
            vulnerabilities.push(...fileVulnerabilities);

            // Analyze Express configuration
            const configAnalyzer = new ExpressConfigAnalyzer(file);
            const configResult = configAnalyzer.analyze(code);
            
            // Merge results
            expressConfig = this.mergeConfigs(expressConfig, configResult.expressConfig);
            missingHeaders.push(...configResult.missingSecurityHeaders);
            recommendations.push(...configResult.recommendations);

            // Note: Configuration issues are handled as recommendations, not as XSS vulnerabilities
            // Missing headers and other config issues are addressed in the recommendations array
        }

        // Use Ollama for context-aware analysis
        const enhancedVulnerabilities = await this.enhanceVulnerabilities(vulnerabilities);

        return {
            vulnerabilities: enhancedVulnerabilities,
            expressConfig,
            missingSecurityHeaders: [...new Set(missingHeaders)],
            recommendations: [...new Set(recommendations)]
        };
    }

    private async findExpressFiles(): Promise<string[]> {
        const stat = fs.statSync(this.target);
        if (stat.isFile()) {
            return [this.target];
        }
        // Directory: glob for JS/JSX files
        const patterns = [
            '**/*.js',
            '**/*.jsx'
        ];
        const files = await Promise.all(
            patterns.map(pattern => glob(pattern, {
                cwd: this.target,
                ignore: [
                    'node_modules/**',
                    'dist/**',
                    'test/**',
                    'coverage/**',
                    'docs/**',
                    'public/**',
                    'examples/**',
                    '**/*.min.js',
                    'scripts/**',
                    'benchmark/**',
                    'mocks/**',
                    'tmp/**',
                    'build/**',
                    'out/**',
                    'vendor/**',
                    '__tests__/**',
                    '__mocks__/**',
                ]
            }))
        );
        return files.flat().map(file => path.join(this.target, file));
    }

    private mergeConfigs(config1: any, config2: any): any {
        return {
            helmet: config1.helmet || config2.helmet,
            contentSecurityPolicy: config1.contentSecurityPolicy || config2.contentSecurityPolicy,
            xssFilter: config1.xssFilter || config2.xssFilter,
            noSniff: config1.noSniff || config2.noSniff,
            frameguard: config1.frameguard || config2.frameguard,
            hsts: config1.hsts || config2.hsts
        };
    }

    private async enhanceVulnerabilities(vulnerabilities: XSSVulnerability[]): Promise<XSSVulnerability[]> {
        if (vulnerabilities.length === 0) return [];
        console.log(`[XSSAnalyzer] Sending ${vulnerabilities.length} vulnerabilities to LLM as a batch.`);
        try {
            const prompt = this.createBatchAnalysisPrompt(vulnerabilities);
            const analyses = await this.queryOllama(prompt);
            if (!Array.isArray(analyses)) {
                console.error('[XSSAnalyzer] LLM did not return an array, skipping enhancement.');
                return vulnerabilities;
            }
            console.log(`[XSSAnalyzer] Received LLM batch response for ${analyses.length} vulnerabilities.`);
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
            console.error('[XSSAnalyzer] Error enhancing vulnerabilities with LLM batch:', error);
            return vulnerabilities;
        }
    }

    private createBatchAnalysisPrompt(vulnerabilities: XSSVulnerability[]): string {
        const items = vulnerabilities.map((vuln, i) => `#${i+1}\nType: ${vuln.type}\nSeverity: ${vuln.severity}\nLocation: ${vuln.location.file}:${vuln.location.line}\nCode: ${vuln.code}\n`).join('\n');
        return `Analyze the following list of XSS vulnerabilities and provide context-aware analysis for each.\n\nFor each item, return a JSON array of objects with keys: description, remediation, confidence.\n\nVulnerabilities:\n${items}\n\nFormat the response as a JSON array, in the same order as the input.`;
    }

    private createAnalysisPrompt(vulnerability: XSSVulnerability): string {
        return `Analyze this XSS vulnerability and provide context-aware analysis:
Type: ${vulnerability.type}
Severity: ${vulnerability.severity}
Location: ${vulnerability.location.file}:${vulnerability.location.line}
Code: ${vulnerability.code}

Please provide:
1. A more detailed description of the vulnerability
2. A specific remediation suggestion
3. A confidence score (0-1) based on the context

Format the response as JSON with keys: description, remediation, confidence`;
    }

    private async queryOllama(prompt: string): Promise<any> {
        try {
            const response = await fetch(this.ollamaEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.ollamaModel,
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
                    // Remove control characters except for newlines and tabs
                    const sanitized = (data as any).response.replace(/[\u0000-\u0019]+/g, '');
                    return JSON.parse(sanitized);
                } catch (e) {
                    return { raw: (data as any).response, error: 'Invalid JSON from LLM' };
                }
            } else {
                throw new Error('Unexpected response format from Ollama');
            }
        } catch (error) {
            console.error('Error querying Ollama:', error);
            return {};
        }
    }
} 
