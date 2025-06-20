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

    constructor(private targetDir: string) {}

    public async analyze(): Promise<AnalysisResult> {
        const files = await this.findExpressFiles();
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

        for (const file of files) {
            if (!fs.statSync(file).isFile()) continue;
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

            // Treat missing headers as vulnerabilities
            for (const header of configResult.missingSecurityHeaders) {
                vulnerabilities.push({
                    type: 'misconfiguration',
                    severity: 'medium',
                    location: { file, line: 0, column: 0 },
                    description: `Missing security header: ${header}`,
                    code: '',
                    remediation: `Add or configure the ${header} header.`,
                    confidence: 1
                });
            }

            // Treat other major config issues as vulnerabilities
            if (configResult.expressConfig.viewEngine === 'ejs' && configResult.expressConfig.ejsEscapingDisabled) {
                vulnerabilities.push({
                    type: 'misconfiguration',
                    severity: 'high',
                    location: { file, line: 0, column: 0 },
                    description: 'EJS auto-escaping is disabled application-wide. This is a high-risk security vulnerability.',
                    code: '',
                    remediation: 'Enable EJS auto-escaping by removing `app.locals.escape = false`.',
                    confidence: 1
                });
            }
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
        const patterns = [
            '**/*.js',
            '**/*.jsx'
        ];

        const files = await Promise.all(
            patterns.map(pattern => glob(pattern, { cwd: this.targetDir, ignore: ['node_modules/**', 'dist/**', 'test/**'] }))
        );

        return files.flat().map(file => path.join(this.targetDir, file));
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
        const enhancedVulnerabilities: XSSVulnerability[] = [];

        for (const vuln of vulnerabilities) {
            try {
                const prompt = this.createAnalysisPrompt(vuln);
                const analysis = await this.queryOllama(prompt);
                
                // Update vulnerability with enhanced analysis
                enhancedVulnerabilities.push({
                    ...vuln,
                    description: analysis.description || vuln.description,
                    remediation: analysis.remediation || vuln.remediation,
                    confidence: analysis.confidence || vuln.confidence
                });
            } catch (error) {
                console.error('Error enhancing vulnerability:', error);
                enhancedVulnerabilities.push(vuln);
            }
        }

        return enhancedVulnerabilities;
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
