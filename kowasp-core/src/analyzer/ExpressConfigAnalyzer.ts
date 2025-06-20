import { ExpressConfig, AnalysisResult } from '../types/analyzer';
import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import { ASTNode } from '../types/analyzer';

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
} 