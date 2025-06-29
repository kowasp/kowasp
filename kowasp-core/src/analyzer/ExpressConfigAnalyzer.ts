import { ExpressConfig, AnalysisResult } from '../types/analyzer';
import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import { ASTNode } from '../types/analyzer';
import fetch from 'node-fetch';

export class ExpressConfigAnalyzer {
    private config: ExpressConfig = {
        helmet: false,
        contentSecurityPolicy: false,
        xssFilter: false,
        noSniff: false,
        frameguard: false,
        hsts: false,
        viewEngine: undefined,
        ejsEscapingDisabled: undefined
    };

    private missingHeaders: string[] = [];
    private recommendations: string[] = [];

    // New fields for additional config
    private customHeaders: { [header: string]: boolean } = {};
    private securityMiddleware: { [name: string]: boolean } = {};
    private expressDisabled: string[] = [];
    private sessionConfig: { [key: string]: any } = {};

    private ollamaEndpoint = 'http://localhost:11434/api/generate';
    private ollamaModel = 'mistral';

    constructor(private filePath: string) {}

    public analyze(code: string): AnalysisResult {
        try {
            const ast = esprima.parseScript(code, { loc: true });
            this.traverseAST(ast as any);
            this.generateRecommendations();
            return {
                vulnerabilities: [], // This will be populated by the main analyzer
                expressConfig: this.config,
                missingSecurityHeaders: this.missingHeaders,
                recommendations: this.recommendations
            };
        } catch (error) {
            console.error(`Error analyzing Express config in ${this.filePath}:`, error);
            return {
                vulnerabilities: [],
                expressConfig: this.config,
                missingSecurityHeaders: [],
                recommendations: ['Error analyzing Express configuration']
            };
        }
    }

    private traverseAST(ast: ASTNode): void {
        estraverse.traverse(ast as any, {
            enter: (node: any) => {
                this.checkNode(node);
            }
        });
    }

    private checkNode(node: ASTNode): void {
        // Check for helmet usage
        if (this.isHelmetUsage(node)) {
            this.config.helmet = true;
            this.checkHelmetConfig(node);
        }

        // Check for security headers
        if (this.isSecurityHeader(node)) {
            this.checkSecurityHeaders(node);
        }

        if (this.isViewEngineSet(node)) {
            this.checkViewEngine(node);
        }

        if (this.isEjsEscapingDisabled(node)) {
            this.config.ejsEscapingDisabled = true;
        }

        // New: Check for direct header setting
        if (this.isSetHeaderCall(node)) {
            const header = this.getSetHeaderName(node);
            if (header) this.customHeaders[header] = true;
        }

        // New: Check for security middleware
        if (this.isSecurityMiddleware(node)) {
            const name = this.getSecurityMiddlewareName(node);
            if (name) this.securityMiddleware[name] = true;
        }

        // New: Check for disabling Express features
        if (this.isDisableCall(node)) {
            const feature = this.getDisabledFeature(node);
            if (feature) this.expressDisabled.push(feature);
        }

        // New: Check for session/cookie middleware
        if (this.isSessionMiddleware(node)) {
            this.sessionConfig = this.getSessionConfig(node);
        }
    }

    private isHelmetUsage(node: ASTNode): boolean {
        return node.type === 'CallExpression' &&
               node.callee?.type === 'MemberExpression' &&
               node.callee?.object?.name === 'app' &&
               node.callee?.property?.name === 'use' &&
               node.arguments?.[0]?.type === 'CallExpression' &&
               node.arguments?.[0]?.callee?.name === 'helmet';
    }

    private isSecurityHeader(node: ASTNode): boolean {
        return node.type === 'CallExpression' &&
               node.callee?.type === 'MemberExpression' &&
               node.callee?.object?.name === 'app' &&
               node.callee?.property?.name === 'use' &&
               node.arguments?.[0]?.type === 'CallExpression' &&
               ['helmet', 'helmet.contentSecurityPolicy', 'helmet.xssFilter', 'helmet.noSniff', 'helmet.frameguard', 'helmet.hsts']
                   .includes(node.arguments?.[0]?.callee?.name);
    }

    private checkHelmetConfig(node: ASTNode): void {
        const helmetConfig = node.arguments?.[0]?.arguments?.[0];
        if (helmetConfig?.type === 'ObjectExpression') {
            this.checkHelmetOptions(helmetConfig);
        }
    }

    private checkHelmetOptions(config: ASTNode): void {
        config.properties?.forEach((prop: ASTNode) => {
            switch (prop.key?.name) {
                case 'contentSecurityPolicy':
                    this.config.contentSecurityPolicy = true;
                    break;
                case 'xssFilter':
                    this.config.xssFilter = true;
                    break;
                case 'noSniff':
                    this.config.noSniff = true;
                    break;
                case 'frameguard':
                    this.config.frameguard = true;
                    break;
                case 'hsts':
                    this.config.hsts = true;
                    break;
            }
        });
    }

    private checkSecurityHeaders(node: ASTNode): void {
        const headerName = node.arguments?.[0]?.callee?.name;
        switch (headerName) {
            case 'helmet.contentSecurityPolicy':
                this.config.contentSecurityPolicy = true;
                break;
            case 'helmet.xssFilter':
                this.config.xssFilter = true;
                break;
            case 'helmet.noSniff':
                this.config.noSniff = true;
                break;
            case 'helmet.frameguard':
                this.config.frameguard = true;
                break;
            case 'helmet.hsts':
                this.config.hsts = true;
                break;
        }
    }

    private isViewEngineSet(node: ASTNode): boolean {
        return node.type === 'CallExpression' &&
               node.callee?.type === 'MemberExpression' &&
               node.callee?.object?.name === 'app' &&
               node.callee?.property?.name === 'set' &&
               node.arguments?.[0]?.type === 'Literal' &&
               node.arguments?.[0]?.value === 'view engine' &&
               node.arguments?.[1]?.type === 'Literal';
    }

    private checkViewEngine(node: ASTNode): void {
        if (node.arguments?.[1]?.type === 'Literal') {
            this.config.viewEngine = node.arguments[1].value as string;
        }
    }

    private isEjsEscapingDisabled(node: ASTNode): boolean {
        return node.type === 'AssignmentExpression' &&
               node.left?.type === 'MemberExpression' &&
               node.left?.object?.type === 'MemberExpression' &&
               node.left?.object?.object?.name === 'app' &&
               node.left?.object?.property?.name === 'locals' &&
               node.left?.property?.name === 'escape' &&
               node.right?.type === 'Literal' &&
               node.right?.value === false;
    }

    // --- New AST check helpers ---
    private isSetHeaderCall(node: ASTNode): boolean {
        return node.type === 'CallExpression' &&
            node.callee?.type === 'MemberExpression' &&
            node.callee?.property?.name === 'setHeader' &&
            node.arguments?.[0]?.type === 'Literal';
    }
    private getSetHeaderName(node: ASTNode): string | undefined {
        return node.arguments?.[0]?.value;
    }
    private isSecurityMiddleware(node: ASTNode): boolean {
        return node.type === 'CallExpression' &&
            node.callee?.type === 'MemberExpression' &&
            node.callee?.object?.name === 'app' &&
            node.callee?.property?.name === 'use' &&
            node.arguments?.[0]?.type === 'CallExpression' &&
            ['csurf', 'rateLimit', 'expressRateLimit'].includes(node.arguments?.[0]?.callee?.name);
    }
    private getSecurityMiddlewareName(node: ASTNode): string | undefined {
        return node.arguments?.[0]?.callee?.name;
    }
    private isDisableCall(node: ASTNode): boolean {
        return node.type === 'CallExpression' &&
            node.callee?.type === 'MemberExpression' &&
            node.callee?.object?.name === 'app' &&
            node.callee?.property?.name === 'disable' &&
            node.arguments?.[0]?.type === 'Literal';
    }
    private getDisabledFeature(node: ASTNode): string | undefined {
        return node.arguments?.[0]?.value;
    }
    private isSessionMiddleware(node: ASTNode): boolean {
        return node.type === 'CallExpression' &&
            node.callee?.type === 'MemberExpression' &&
            node.callee?.object?.name === 'app' &&
            node.callee?.property?.name === 'use' &&
            node.arguments?.[0]?.type === 'CallExpression' &&
            ['session', 'cookieSession', 'expressSession'].includes(node.arguments?.[0]?.callee?.name);
    }
    private getSessionConfig(node: ASTNode): any {
        // Return the config object if present
        const configArg = node.arguments?.[0]?.arguments?.[0];
        if (configArg && configArg.type === 'ObjectExpression') {
            const config: any = {};
            configArg.properties?.forEach((prop: ASTNode) => {
                if (prop.key?.name) config[prop.key.name] = prop.value?.value;
            });
            return config;
        }
        return {};
    }

    private generateRecommendations(): void {
        if (!this.config.helmet) {
            this.recommendations.push('Install and configure helmet middleware for security headers');
        }

        if (!this.config.contentSecurityPolicy) {
            this.missingHeaders.push('Content-Security-Policy');
            this.recommendations.push('Configure Content Security Policy using helmet.contentSecurityPolicy()');
        }

        if (!this.config.xssFilter) {
            this.missingHeaders.push('X-XSS-Protection');
            this.recommendations.push('Enable XSS protection using helmet.xssFilter()');
        }

        if (!this.config.noSniff) {
            this.missingHeaders.push('X-Content-Type-Options');
            this.recommendations.push('Enable X-Content-Type-Options using helmet.noSniff()');
        }

        if (!this.config.frameguard) {
            this.missingHeaders.push('X-Frame-Options');
            this.recommendations.push('Configure frame protection using helmet.frameguard()');
        }

        if (!this.config.hsts) {
            this.missingHeaders.push('Strict-Transport-Security');
            this.recommendations.push('Enable HSTS using helmet.hsts()');
        }

        if (this.config.viewEngine === 'ejs' && this.config.ejsEscapingDisabled) {
            this.recommendations.push('EJS auto-escaping is disabled application-wide. This is a high-risk security vulnerability. Enable it by removing `app.locals.escape = false`.');
        } else if (this.config.viewEngine) {
            this.recommendations.push(`Template engine '${this.config.viewEngine}' is in use. Ensure that output is properly escaped to prevent XSS. For EJS, do not use <%- ... %>. For Pug, do not use != or #{} syntax with untrusted data.`);
        }
    }

    // --- LLM Integration ---
    public async analyzeWithLLM(code: string): Promise<AnalysisResult> {
        const result = this.analyze(code);
        const summary = this.createConfigSummary();
        const prompt = this.createLLMPrompt(summary);
        const llmAnalysis = await this.queryOllama(prompt);
        // Merge LLM output into recommendations
        if (llmAnalysis && llmAnalysis.recommendations) {
            result.recommendations.push(...llmAnalysis.recommendations);
        }
        // Note: Configuration issues are handled as recommendations, not as XSS vulnerabilities
        return result;
    }
    private createConfigSummary(): string {
        return `Helmet: ${this.config.helmet}\nCSP: ${this.config.contentSecurityPolicy}\nXSS Filter: ${this.config.xssFilter}\nNoSniff: ${this.config.noSniff}\nFrameguard: ${this.config.frameguard}\nHSTS: ${this.config.hsts}\nViewEngine: ${this.config.viewEngine}\nEJSEscapingDisabled: ${this.config.ejsEscapingDisabled}\nCustomHeaders: ${JSON.stringify(this.customHeaders)}\nSecurityMiddleware: ${JSON.stringify(this.securityMiddleware)}\nExpressDisabled: ${JSON.stringify(this.expressDisabled)}\nSessionConfig: ${JSON.stringify(this.sessionConfig)}`;
    }
    private createLLMPrompt(summary: string): string {
        return `Analyze this Express configuration for XSS and related security risks.\nConfig summary:\n${summary}\n\nPlease provide:\n1. A context-aware evaluation of the security posture\n2. Specific recommendations for improvement\n3. Severity (high/medium/low)\n4. A remediation summary\n\nFormat the response as JSON with keys: description, recommendations, severity, remediation.`;
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